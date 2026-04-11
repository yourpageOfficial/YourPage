package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type walletRepo struct {
	db *gorm.DB
}

func NewWalletRepository(db *gorm.DB) repository.WalletRepository {
	return &walletRepo{db: db}
}

func (r *walletRepo) FindOrCreateWallet(ctx context.Context, userID uuid.UUID) (*entity.UserWallet, error) {
	wallet := entity.UserWallet{UserID: userID}
	err := r.db.WithContext(ctx).
		Where(entity.UserWallet{UserID: userID}).
		FirstOrCreate(&wallet).Error
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func (r *walletRepo) AddCredits(ctx context.Context, userID uuid.UUID, credits int64) error {
	if credits <= 0 { return nil } // QA-37: guard against negative/zero
	return r.db.WithContext(ctx).
		Model(&entity.UserWallet{}).
		Where("user_id = ?", userID).
		Update("balance_credits", gorm.Expr("balance_credits + ?", credits)).Error
}

func (r *walletRepo) DeductCredits(ctx context.Context, userID uuid.UUID, credits int64) error {
	result := r.db.WithContext(ctx).
		Model(&entity.UserWallet{}).
		Where("user_id = ? AND balance_credits >= ?", userID, credits).
		Update("balance_credits", gorm.Expr("balance_credits - ?", credits))
	if result.RowsAffected == 0 {
		return entity.ErrInsufficientCredit
	}
	return result.Error
}

func (r *walletRepo) GetBalance(ctx context.Context, userID uuid.UUID) (int64, error) {
	var wallet entity.UserWallet
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&wallet).Error
	if err == gorm.ErrRecordNotFound {
		return 0, entity.ErrNotFound
	}
	if err != nil {
		return 0, err
	}
	return wallet.BalanceCredits, nil
}

func (r *walletRepo) CreateTransaction(ctx context.Context, tx *entity.CreditTransaction) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

func (r *walletRepo) ListTransactions(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.CreditTransaction, error) {
	var txs []entity.CreditTransaction
	q := r.db.WithContext(ctx).Where("user_id = ?", userID)
	if cursor != nil {
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&txs).Error
	return txs, err
}

func (r *walletRepo) CreateTopupRequest(ctx context.Context, req *entity.CreditTopupRequest) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *walletRepo) FindTopupRequest(ctx context.Context, id uuid.UUID) (*entity.CreditTopupRequest, error) {
	var req entity.CreditTopupRequest
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&req).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &req, err
}

func (r *walletRepo) UpdateTopupRequest(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, adminNote *string) error {
	updates := map[string]interface{}{
		"status":     status,
		"admin_note": adminNote,
	}
	return r.db.WithContext(ctx).
		Model(&entity.CreditTopupRequest{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *walletRepo) ListTopupRequests(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.CreditTopupRequest, error) {
	var reqs []entity.CreditTopupRequest
	q := r.db.WithContext(ctx).Preload("User")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if cursor != nil {
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&reqs).Error
	return reqs, err
}

func (r *walletRepo) UpdateTopupProof(ctx context.Context, id uuid.UUID, donorName, proofURL string) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreditTopupRequest{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{"donor_name": donorName, "proof_image_url": proofURL}).Error
}

func (r *walletRepo) CountPendingTopups(ctx context.Context) (int64, error) {
	var c int64
	err := r.db.WithContext(ctx).Model(&entity.CreditTopupRequest{}).Where("status = 'pending'").Count(&c).Error
	return c, err
}

func (r *walletRepo) CountPendingTopupsByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	var c int64
	err := r.db.WithContext(ctx).Model(&entity.CreditTopupRequest{}).Where("user_id = ? AND status = 'pending'", userID).Count(&c).Error
	return c, err
}

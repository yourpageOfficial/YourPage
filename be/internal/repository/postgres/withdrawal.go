package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type withdrawalRepo struct {
	db *gorm.DB
}

func NewWithdrawalRepository(db *gorm.DB) repository.WithdrawalRepository {
	return &withdrawalRepo{db: db}
}

func (r *withdrawalRepo) Create(ctx context.Context, w *entity.Withdrawal) error {
	return r.db.WithContext(ctx).Create(w).Error
}

func (r *withdrawalRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Withdrawal, error) {
	var withdrawal entity.Withdrawal
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&withdrawal).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &withdrawal, err
}

func (r *withdrawalRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.WithdrawalStatus, adminNote *string) error {
	updates := map[string]interface{}{
		"status":     status,
		"admin_note": adminNote,
	}
	if status == entity.WithdrawalStatusProcessed || status == entity.WithdrawalStatusApproved {
		now := time.Now()
		updates["processed_at"] = &now
	}
	return r.db.WithContext(ctx).
		Model(&entity.Withdrawal{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *withdrawalRepo) ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, error) {
	var withdrawals []entity.Withdrawal
	q := r.db.WithContext(ctx).Where("creator_id = ?", creatorID)
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&withdrawals).Error
	return withdrawals, err
}

func (r *withdrawalRepo) ListAll(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, error) {
	var withdrawals []entity.Withdrawal
	q := r.db.WithContext(ctx).Preload("Creator")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&withdrawals).Error
	return withdrawals, err
}

func (r *withdrawalRepo) HasPreviousApproved(ctx context.Context, creatorID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Withdrawal{}).
		Where("creator_id = ? AND status IN ?", creatorID, []entity.WithdrawalStatus{
			entity.WithdrawalStatusApproved,
			entity.WithdrawalStatusProcessed,
		}).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

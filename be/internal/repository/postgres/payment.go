package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type paymentRepo struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) repository.PaymentRepository {
	return &paymentRepo{db: db}
}

func (r *paymentRepo) Create(ctx context.Context, p *entity.Payment) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *paymentRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Payment, error) {
	var payment entity.Payment
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&payment).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &payment, err
}

func (r *paymentRepo) FindByExternalID(ctx context.Context, externalID string) (*entity.Payment, error) {
	var payment entity.Payment
	err := r.db.WithContext(ctx).Where("external_id = ?", externalID).First(&payment).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &payment, err
}

func (r *paymentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, paidAt interface{}) error {
	updates := map[string]interface{}{
		"status":  status,
		"paid_at": paidAt,
	}
	return r.db.WithContext(ctx).
		Model(&entity.Payment{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *paymentRepo) UpdateWebhookPayload(ctx context.Context, id uuid.UUID, payload entity.JSONMap) error {
	return r.db.WithContext(ctx).
		Model(&entity.Payment{}).
		Where("id = ?", id).
		Update("webhook_payload", payload).Error
}

func (r *paymentRepo) List(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Payment, error) {
	var payments []entity.Payment
	q := r.db.WithContext(ctx).Preload("Payer")
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&payments).Error
	return payments, err
}

func (r *paymentRepo) ListByPayer(ctx context.Context, payerID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, error) {
	var payments []entity.Payment
	q := r.db.WithContext(ctx).Where("payer_id = ?", payerID)
	if cursor != nil { q = q.Where("id > ?", *cursor) }
	err := q.Order("created_at DESC").Limit(limit).Find(&payments).Error
	return payments, err
}

func (r *paymentRepo) ListByReferenceCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, error) {
	var payments []entity.Payment
	// Collect reference IDs first (faster than 3 subqueries in WHERE)
	var refIDs []uuid.UUID
	r.db.WithContext(ctx).Model(&entity.Post{}).Where("creator_id = ? AND deleted_at IS NULL", creatorID).Pluck("id", &refIDs)
	var prodIDs []uuid.UUID
	r.db.WithContext(ctx).Model(&entity.Product{}).Where("creator_id = ? AND deleted_at IS NULL", creatorID).Pluck("id", &prodIDs)
	var donIDs []uuid.UUID
	r.db.WithContext(ctx).Model(&entity.Donation{}).Where("creator_id = ?", creatorID).Pluck("id", &donIDs)

	allIDs := append(append(refIDs, prodIDs...), donIDs...)
	if len(allIDs) == 0 { return payments, nil }

	q := r.db.WithContext(ctx).Preload("Payer").Where("status = 'paid' AND reference_id IN ?", allIDs)
	if cursor != nil { q = q.Where("id > ?", *cursor) }
	err := q.Order("created_at DESC").Limit(limit).Find(&payments).Error
	return payments, err
}

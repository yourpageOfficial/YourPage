package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type donationRepo struct {
	db *gorm.DB
}

func NewDonationRepository(db *gorm.DB) repository.DonationRepository {
	return &donationRepo{db: db}
}

func (r *donationRepo) Create(ctx context.Context, d *entity.Donation) error {
	return r.db.WithContext(ctx).Create(d).Error
}

func (r *donationRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Donation, error) {
	var donation entity.Donation
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&donation).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &donation, err
}

func (r *donationRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.PaymentStatus) error {
	return r.db.WithContext(ctx).
		Model(&entity.Donation{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *donationRepo) ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, error) {
	var donations []entity.Donation
	q := r.db.WithContext(ctx).Preload("Supporter").Where("creator_id = ?", creatorID)
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&donations).Error
	return donations, err
}

func (r *donationRepo) ListBySupporter(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, error) {
	var donations []entity.Donation
	q := r.db.WithContext(ctx).Preload("Creator").Where("supporter_id = ?", supporterID)
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&donations).Error
	return donations, err
}

func (r *donationRepo) ListAll(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Donation, error) {
	var donations []entity.Donation
	q := r.db.WithContext(ctx).Preload("Creator").Preload("Supporter")
	if cursor != nil { q = q.Where("id > ?", *cursor) }
	err := q.Order("created_at DESC").Limit(limit).Find(&donations).Error
	return donations, err
}

func (r *donationRepo) GetLatest(ctx context.Context, creatorID uuid.UUID) (*entity.Donation, error) {
	var d entity.Donation
	err := r.db.WithContext(ctx).Where("creator_id = ?", creatorID).Order("created_at DESC").First(&d).Error
	if err != nil { return nil, err }
	return &d, nil
}

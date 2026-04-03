package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type platformRepo struct {
	db *gorm.DB
}

func NewPlatformRepository(db *gorm.DB) repository.PlatformRepository {
	return &platformRepo{db: db}
}

func (r *platformRepo) GetSettings(ctx context.Context) (*entity.PlatformSetting, error) {
	var settings entity.PlatformSetting
	err := r.db.WithContext(ctx).First(&settings).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &settings, err
}

func (r *platformRepo) UpdateSettings(ctx context.Context, s *entity.PlatformSetting) error {
	return r.db.WithContext(ctx).Save(s).Error
}

func (r *platformRepo) CreatePlatformWithdrawal(ctx context.Context, w *entity.PlatformWithdrawal) error {
	return r.db.WithContext(ctx).Create(w).Error
}

func (r *platformRepo) ListPlatformWithdrawals(ctx context.Context) ([]entity.PlatformWithdrawal, error) {
	var wds []entity.PlatformWithdrawal
	err := r.db.WithContext(ctx).Preload("Admin").Order("created_at DESC").Find(&wds).Error
	return wds, err
}

func (r *platformRepo) ListTiers(ctx context.Context) ([]entity.CreatorTier, error) {
	var tiers []entity.CreatorTier
	err := r.db.WithContext(ctx).Order("sort_order").Find(&tiers).Error
	return tiers, err
}

func (r *platformRepo) FindTier(ctx context.Context, id uuid.UUID) (*entity.CreatorTier, error) {
	var tier entity.CreatorTier
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&tier).Error; err != nil {
		return nil, entity.ErrNotFound
	}
	return &tier, nil
}

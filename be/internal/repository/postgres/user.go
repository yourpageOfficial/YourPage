package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type userRepo struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) Create(ctx context.Context, user *entity.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	var user entity.User
	err := r.db.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", id).First(&user).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &user, err
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	var user entity.User
	err := r.db.WithContext(ctx).Where("email = ? AND deleted_at IS NULL", email).First(&user).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &user, err
}

func (r *userRepo) FindByUsername(ctx context.Context, username string) (*entity.User, error) {
	var user entity.User
	err := r.db.WithContext(ctx).Where("username = ? AND deleted_at IS NULL", username).First(&user).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &user, err
}

func (r *userRepo) Update(ctx context.Context, user *entity.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepo) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.User{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (r *userRepo) List(ctx context.Context, role string, cursor *uuid.UUID, limit int) ([]entity.User, error) {
	var users []entity.User
	q := r.db.WithContext(ctx).Where("deleted_at IS NULL")
	if role != "" {
		q = q.Where("role = ?", role)
	}
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&users).Error
	return users, err
}

func (r *userRepo) CreateCreatorProfile(ctx context.Context, p *entity.CreatorProfile) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *userRepo) FindCreatorBySlug(ctx context.Context, slug string) (*entity.CreatorProfile, error) {
	var profile entity.CreatorProfile
	err := r.db.WithContext(ctx).Preload("Tier").Where("page_slug = ?", slug).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &profile, err
}

func (r *userRepo) FindCreatorByUserID(ctx context.Context, userID uuid.UUID) (*entity.CreatorProfile, error) {
	var profile entity.CreatorProfile
	err := r.db.WithContext(ctx).Preload("Tier").Where("user_id = ?", userID).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &profile, err
}

func (r *userRepo) UpdateCreatorProfile(ctx context.Context, p *entity.CreatorProfile) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *userRepo) IncrementCreatorStorage(ctx context.Context, creatorID uuid.UUID, bytes int64) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreatorProfile{}).
		Where("id = ?", creatorID).
		Update("storage_used_bytes", gorm.Expr("storage_used_bytes + ?", bytes)).Error
}

func (r *userRepo) IncrementFollowerCount(ctx context.Context, creatorID uuid.UUID, delta int) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreatorProfile{}).
		Where("id = ?", creatorID).
		Update("follower_count", gorm.Expr("follower_count + ?", delta)).Error
}

func (r *userRepo) SearchCreators(ctx context.Context, query string, cursor *uuid.UUID, limit int) ([]entity.CreatorProfile, error) {
	var profiles []entity.CreatorProfile
	q := r.db.WithContext(ctx).Preload("User", "deleted_at IS NULL")
	if query != "" {
		like := "%" + query + "%"
		q = q.Joins("JOIN users ON users.id = creator_profiles.user_id AND users.deleted_at IS NULL").
			Where("users.username ILIKE ? OR users.display_name ILIKE ? OR creator_profiles.page_slug ILIKE ?", like, like, like)
	}
	if cursor != nil {
		q = q.Where("creator_profiles.id > ?", *cursor)
	}
	err := q.Order("creator_profiles.follower_count DESC").Limit(limit).Find(&profiles).Error
	return profiles, err
}

func (r *userRepo) CountCreatorPosts(ctx context.Context, userID uuid.UUID) (int64, error) {
	var c int64
	err := r.db.WithContext(ctx).Model(&entity.Post{}).Where("creator_id = ? AND deleted_at IS NULL", userID).Count(&c).Error
	return c, err
}

func (r *userRepo) CountCreatorProducts(ctx context.Context, userID uuid.UUID) (int64, error) {
	var c int64
	err := r.db.WithContext(ctx).Model(&entity.Product{}).Where("creator_id = ? AND deleted_at IS NULL", userID).Count(&c).Error
	return c, err
}

func (r *userRepo) CountCreatorDonations(ctx context.Context, userID uuid.UUID) (int64, int64, error) {
	var result struct{ Count int64; Total int64 }
	err := r.db.WithContext(ctx).Model(&entity.Donation{}).Select("COUNT(*) as count, COALESCE(SUM(amount_idr),0) as total").Where("creator_id = ?", userID).Scan(&result).Error
	return result.Count, result.Total, err
}

func (r *userRepo) CountCreatorSales(ctx context.Context, userID uuid.UUID) (int64, int64, error) {
	var result struct{ Count int64; Total int64 }
	err := r.db.WithContext(ctx).Model(&entity.Payment{}).Select("COUNT(*) as count, COALESCE(SUM(net_amount_idr),0) as total").Where("creator_id = ? AND status = 'paid'", userID).Scan(&result).Error
	return result.Count, result.Total, err
}

func (r *userRepo) ListFeaturedCreators(ctx context.Context) ([]entity.CreatorProfile, error) {
	var profiles []entity.CreatorProfile
	err := r.db.WithContext(ctx).Preload("Tier").Where("is_featured = true").Order("featured_order, created_at DESC").Find(&profiles).Error
	return profiles, err
}

func (r *userRepo) ListExpiredTierCreators(ctx context.Context) ([]entity.CreatorProfile, error) {
	var profiles []entity.CreatorProfile
	err := r.db.WithContext(ctx).
		Where("tier_expires_at IS NOT NULL AND tier_expires_at < NOW()").
		Where("tier_id != (SELECT id FROM creator_tiers WHERE price_idr = 0 LIMIT 1)").
		Find(&profiles).Error
	return profiles, err
}

func (r *userRepo) ListOverlayTiers(ctx context.Context, creatorID uuid.UUID) ([]entity.OverlayTier, error) {
	var tiers []entity.OverlayTier
	err := r.db.WithContext(ctx).Where("creator_id = ?", creatorID).Order("sort_order, min_credits").Find(&tiers).Error
	return tiers, err
}

func (r *userRepo) CreateOverlayTier(ctx context.Context, t *entity.OverlayTier) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *userRepo) DeleteOverlayTier(ctx context.Context, id, creatorID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ? AND creator_id = ?", id, creatorID).Delete(&entity.OverlayTier{}).Error
}

func (r *userRepo) ListFollowerIDs(ctx context.Context, creatorID uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	err := r.db.WithContext(ctx).Model(&entity.Follow{}).Where("creator_id = ?", creatorID).Pluck("follower_id", &ids).Error
	return ids, err
}

func (r *userRepo) CreateNotification(ctx context.Context, userID uuid.UUID, ntype, title, body string, refID *uuid.UUID) error {
	return r.db.WithContext(ctx).Create(&entity.Notification{
		ID: uuid.New(), UserID: userID, Type: entity.NotificationType(ntype), Title: title, Body: body, ReferenceID: refID,
	}).Error
}

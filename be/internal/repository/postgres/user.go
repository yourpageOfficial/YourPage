package postgres

import (
	"context"
	"crypto/rand"
	"fmt"
	"strings"
	"time"

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
		q = q.Where("id < ?", *cursor)
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

// IncrementCreatorStorage adjusts storage usage. bytes may be negative when
// media is deleted; usage is clamped at 0 so historical rows without a
// recorded size can never drive it below zero.
func (r *userRepo) IncrementCreatorStorage(ctx context.Context, creatorID uuid.UUID, bytes int64) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreatorProfile{}).
		Where("id = ?", creatorID).
		Update("storage_used_bytes", gorm.Expr("GREATEST(storage_used_bytes + ?, 0)", bytes)).Error
}

func (r *userRepo) IncrementFollowerCount(ctx context.Context, creatorID uuid.UUID, delta int) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreatorProfile{}).
		Where("id = ?", creatorID).
		Update("follower_count", gorm.Expr("GREATEST(follower_count + ?, 0)", delta)).Error
}

func (r *userRepo) SearchCreators(ctx context.Context, query string, category string, cursor *uuid.UUID, limit int) ([]entity.CreatorProfile, error) {
	var profiles []entity.CreatorProfile
	q := r.db.WithContext(ctx).Preload("User", "deleted_at IS NULL")
	if query != "" {
		like := "%" + query + "%"
		q = q.Joins("JOIN users ON users.id = creator_profiles.user_id AND users.deleted_at IS NULL").
			Where("users.username ILIKE ? OR users.display_name ILIKE ? OR creator_profiles.page_slug ILIKE ?", like, like, like)
	}
	if category != "" {
		q = q.Where("creator_profiles.category = ?", category)
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
	err := r.db.WithContext(ctx).Preload("Tier").Preload("User", "deleted_at IS NULL AND is_banned = false").Where("is_featured = true").Order("featured_order, created_at DESC").Find(&profiles).Error
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
	// The owner predicate keeps the data safe, but GORM reports no error when
	// it matches nothing — so a delete that hit someone else's tier, or a stale
	// id, still answered "deleted". Report the miss instead.
	res := r.db.WithContext(ctx).Where("id = ? AND creator_id = ?", id, creatorID).Delete(&entity.OverlayTier{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return entity.ErrNotFound
	}
	return nil
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

func (r *userRepo) FindReferralCode(ctx context.Context, code string) (*entity.ReferralCode, error) {
	var ref entity.ReferralCode
	if err := r.db.WithContext(ctx).Where("code = ?", code).First(&ref).Error; err != nil { return nil, err }
	return &ref, nil
}

func (r *userRepo) CreateReferralCode(ctx context.Context, ref *entity.ReferralCode) error {
	return r.db.WithContext(ctx).Create(ref).Error
}

func (r *userRepo) IncrementReferralUsed(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.ReferralCode{}).Where("id = ?", id).Update("used_count", gorm.Expr("used_count + 1")).Error
}

func (r *userRepo) GetOrCreateReferralCode(ctx context.Context, userID uuid.UUID) (*entity.ReferralCode, error) {
	var ref entity.ReferralCode
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&ref).Error; err == nil {
		return &ref, nil
	}
	// Auto-generate code: upper(username[:4]) + 4 random hex chars
	var user entity.User
	if err := r.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}
	prefix := strings.ToUpper(user.Username)
	if len(prefix) > 4 {
		prefix = prefix[:4]
	}
	for i := 0; i < 10; i++ {
		b := make([]byte, 2)
		if _, err := rand.Read(b); err != nil {
			return nil, fmt.Errorf("failed to generate random bytes: %w", err)
		}
		code := fmt.Sprintf("%s%02X%02X", prefix, b[0], b[1])
		ref = entity.ReferralCode{
			ID:            uuid.New(),
			UserID:        userID,
			Code:          code,
			RewardCredits: 10,
		}
		if err := r.db.WithContext(ctx).Create(&ref).Error; err == nil {
			return &ref, nil
		}
	}
	return nil, fmt.Errorf("failed to generate unique referral code")
}

func (r *userRepo) CreateReferralUse(ctx context.Context, ru *entity.ReferralUse) error {
	return r.db.WithContext(ctx).Create(ru).Error
}

func (r *userRepo) ListReferralUses(ctx context.Context, codeID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.ReferralUse, error) {
	var uses []entity.ReferralUse
	q := r.db.WithContext(ctx).Preload("ReferredUser").Where("referral_code_id = ?", codeID)
	if cursor != nil {
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&uses).Error
	return uses, err
}

func (r *userRepo) CountReferralEarnings(ctx context.Context, userID uuid.UUID) (int64, error) {
	var total int64
	err := r.db.WithContext(ctx).
		Table("referral_uses ru").
		Joins("JOIN referral_codes rc ON rc.id = ru.referral_code_id").
		Where("rc.user_id = ?", userID).
		Select("COALESCE(SUM(ru.reward_credits), 0)").
		Scan(&total).Error
	return total, err
}

func (r *userRepo) HardDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Unscoped().Where("id = ?", id).Delete(&entity.User{}).Error
}


func (r *userRepo) GetAnalyticsCounts(ctx context.Context) (map[string]int64, error) {
	result := make(map[string]int64)
	var v int64
	r.db.WithContext(ctx).Model(&entity.User{}).Where("deleted_at IS NULL").Count(&v); result["total_users"] = v
	r.db.WithContext(ctx).Model(&entity.User{}).Where("role = 'creator' AND deleted_at IS NULL").Count(&v); result["total_creators"] = v
	r.db.WithContext(ctx).Model(&entity.User{}).Where("role = 'supporter' AND deleted_at IS NULL").Count(&v); result["total_supporters"] = v
	r.db.WithContext(ctx).Model(&entity.User{}).Where("is_banned = true AND deleted_at IS NULL").Count(&v); result["total_banned"] = v
	r.db.WithContext(ctx).Model(&entity.Post{}).Where("deleted_at IS NULL").Count(&v); result["total_posts"] = v
	r.db.WithContext(ctx).Model(&entity.Product{}).Where("deleted_at IS NULL").Count(&v); result["total_products"] = v
	r.db.WithContext(ctx).Table("payments").Where("status = 'paid'").Count(&v); result["paid_count"] = v
	r.db.WithContext(ctx).Table("payments").Where("status = 'paid'").Select("COALESCE(SUM(amount_idr),0)").Row().Scan(&v); result["gmv"] = v
	r.db.WithContext(ctx).Table("payments").Where("status = 'paid'").Select("COALESCE(SUM(fee_idr),0)").Row().Scan(&v); result["revenue"] = v
	r.db.WithContext(ctx).Table("donations").Count(&v); result["total_donations"] = v
	r.db.WithContext(ctx).Table("withdrawals").Where("status = 'pending'").Count(&v); result["withdrawals_pending"] = v
	r.db.WithContext(ctx).Table("credit_topup_requests").Where("status = 'pending'").Count(&v); result["topups_pending"] = v
	r.db.WithContext(ctx).Table("user_kyc").Where("status = 'pending'").Count(&v); result["kyc_pending"] = v
	r.db.WithContext(ctx).Table("content_reports").Where("status = 'pending'").Count(&v); result["reports_pending"] = v
	return result, nil
}

func (r *userRepo) CountCreatorDonationsRange(ctx context.Context, userID uuid.UUID, from, to time.Time) (int64, int64, error) {
	var result struct{ Count int64; Total int64 }
	err := r.db.WithContext(ctx).Model(&entity.Donation{}).Select("COUNT(*) as count, COALESCE(SUM(amount_idr),0) as total").Where("creator_id = ? AND created_at BETWEEN ? AND ?", userID, from, to).Scan(&result).Error
	return result.Count, result.Total, err
}

func (r *userRepo) CountCreatorSalesRange(ctx context.Context, userID uuid.UUID, from, to time.Time) (int64, int64, error) {
	var result struct{ Count int64; Total int64 }
	// Join with posts/products/donations to filter by creator
	err := r.db.WithContext(ctx).Table("payments p").
		Select("COUNT(*) as count, COALESCE(SUM(p.net_amount_idr),0) as total").
		Where("p.status = 'paid' AND p.created_at BETWEEN ? AND ?", from, to).
		Where(`(p.reference_id IN (SELECT id FROM posts WHERE creator_id = ? AND deleted_at IS NULL)
			OR p.reference_id IN (SELECT id FROM products WHERE creator_id = ? AND deleted_at IS NULL)
			OR p.reference_id IN (SELECT id FROM donations WHERE creator_id = ?)
			OR p.reference_id IN (SELECT id FROM chat_conversations WHERE creator_id = ?))`,
			userID, userID, userID, userID).
		Scan(&result).Error
	return result.Count, result.Total, err
}

func (r *userRepo) AddPasswordHistory(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	history := entity.PasswordHistory{
		ID:           uuid.New(),
		UserID:       userID,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now(),
	}
	if err := r.db.WithContext(ctx).Create(&history).Error; err != nil {
		return err
	}

	// Auto-prune beyond 5 most recent records per user
	var count int64
	r.db.WithContext(ctx).Model(&entity.PasswordHistory{}).Where("user_id = ?", userID).Count(&count)
	if count > 5 {
		subquery := r.db.WithContext(ctx).
			Model(&entity.PasswordHistory{}).
			Select("id").
			Where("user_id = ?", userID).
			Order("created_at DESC").
			Limit(5)
		_ = r.db.WithContext(ctx).
			Where("user_id = ? AND id NOT IN (?)", userID, subquery).
			Delete(&entity.PasswordHistory{}).Error
	}
	return nil
}

func (r *userRepo) GetPasswordHistories(ctx context.Context, userID uuid.UUID, limit int) ([]entity.PasswordHistory, error) {
	var histories []entity.PasswordHistory
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&histories).Error
	return histories, err
}


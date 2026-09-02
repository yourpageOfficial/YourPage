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
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&donations).Error
	return donations, err
}

func (r *donationRepo) ListBySupporter(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, error) {
	var donations []entity.Donation
	q := r.db.WithContext(ctx).Preload("Creator").Where("supporter_id = ?", supporterID)
	if cursor != nil {
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&donations).Error
	return donations, err
}

func (r *donationRepo) ListAll(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Donation, error) {
	var donations []entity.Donation
	q := r.db.WithContext(ctx).Preload("Creator").Preload("Supporter")
	if cursor != nil { q = q.Where("id < ?", *cursor) }
	err := q.Order("created_at DESC").Limit(limit).Find(&donations).Error
	return donations, err
}

func (r *donationRepo) GetLatest(ctx context.Context, creatorID uuid.UUID) (*entity.Donation, error) {
	var d entity.Donation
	err := r.db.WithContext(ctx).Where("creator_id = ?", creatorID).Order("created_at DESC").First(&d).Error
	if err != nil { return nil, err }
	return &d, nil
}

func (r *donationRepo) GetTopSupporters(ctx context.Context, creatorID uuid.UUID, limit int) ([]entity.TopSupporter, error) {
	var result []entity.TopSupporter
	err := r.db.WithContext(ctx).Model(&entity.Donation{}).
		Select("donor_name, SUM(amount_idr) as total_idr, COUNT(*) as donation_count").
		Where("creator_id = ? AND is_anonymous = false", creatorID).
		Group("donor_name").Order("total_idr DESC").Limit(limit).Scan(&result).Error
	return result, err
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

func (r *donationRepo) GetLeaderboard(ctx context.Context, creatorID uuid.UUID, period string, limit int) ([]entity.LeaderboardEntry, error) {
	q := r.db.WithContext(ctx).Model(&entity.Donation{}).
		Select("donor_name, SUM(amount_idr) as total_idr, COUNT(*) as count").
		Where("creator_id = ? AND is_anonymous = false AND status = 'paid'", creatorID)

	switch period {
	case "weekly":
		q = q.Where("created_at >= NOW() - INTERVAL '7 days'")
	case "monthly":
		q = q.Where("created_at >= NOW() - INTERVAL '30 days'")
	}

	var rows []struct {
		DonorName string `gorm:"column:donor_name"`
		TotalIDR  int64  `gorm:"column:total_idr"`
		Count     int    `gorm:"column:count"`
	}
	if err := q.Group("donor_name").Order("total_idr DESC").Limit(limit).Scan(&rows).Error; err != nil {
		return nil, err
	}

	entries := make([]entity.LeaderboardEntry, len(rows))
	for i, row := range rows {
		entries[i] = entity.LeaderboardEntry{
			Rank:      i + 1,
			DonorName: row.DonorName,
			TotalIDR:  row.TotalIDR,
			Count:     row.Count,
		}
	}
	return entries, nil
}

func (r *donationRepo) GetLeaderboardSettings(ctx context.Context, creatorID uuid.UUID) (*entity.LeaderboardSettings, error) {
	var s entity.LeaderboardSettings
	err := r.db.WithContext(ctx).Where("creator_id = ?", creatorID).First(&s).Error
	if err == gorm.ErrRecordNotFound {
		// Return sensible defaults if not yet configured
		return &entity.LeaderboardSettings{
			CreatorID:  creatorID,
			IsEnabled:  true,
			Period:     "all_time",
			MaxEntries: 10,
			ShowAmount: true,
			Title:      "Top Supporters",
		}, nil
	}
	return &s, err
}

func (r *donationRepo) UpsertLeaderboardSettings(ctx context.Context, s *entity.LeaderboardSettings) error {
	// Written as an explicit update-then-insert rather than FirstOrCreate/Assign
	// because both of those drop false: Assign with a struct skips zero values,
	// and on insert GORM substitutes the column default for a zero value when
	// the field carries a `default:` tag. Either way a creator could never turn
	// is_enabled or show_amount off.
	fields := map[string]interface{}{
		"is_enabled":  s.IsEnabled,
		"period":      s.Period,
		"max_entries": s.MaxEntries,
		"show_amount": s.ShowAmount,
		"title":       s.Title,
	}

	res := r.db.WithContext(ctx).
		Model(&entity.LeaderboardSettings{}).
		Where("creator_id = ?", s.CreatorID).
		Updates(fields)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected > 0 {
		return r.db.WithContext(ctx).Where("creator_id = ?", s.CreatorID).First(s).Error
	}

	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if err := r.db.WithContext(ctx).Create(s).Error; err != nil {
		return err
	}
	// GORM omits zero-valued columns on insert when they carry a `default:`
	// tag, so the row lands with show_amount/is_enabled true regardless of what
	// was asked for. Re-apply the fields explicitly, then reload so the caller
	// sees what was actually stored.
	if err := r.db.WithContext(ctx).
		Model(&entity.LeaderboardSettings{}).
		Where("creator_id = ?", s.CreatorID).
		Updates(fields).Error; err != nil {
		return err
	}
	return r.db.WithContext(ctx).Where("creator_id = ?", s.CreatorID).First(s).Error
}


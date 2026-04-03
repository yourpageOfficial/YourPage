package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type kycRepo struct {
	db *gorm.DB
}

func NewKYCRepository(db *gorm.DB) repository.KYCRepository {
	return &kycRepo{db: db}
}

func (r *kycRepo) CreateKYC(ctx context.Context, kyc *entity.UserKYC) error {
	return r.db.WithContext(ctx).Create(kyc).Error
}

func (r *kycRepo) FindKYCByUserID(ctx context.Context, userID uuid.UUID) (*entity.UserKYC, error) {
	var kyc entity.UserKYC
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&kyc).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &kyc, err
}

func (r *kycRepo) UpdateKYCStatus(ctx context.Context, id uuid.UUID, status entity.KYCStatus, adminNote *string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":      status,
		"admin_note":  adminNote,
		"reviewed_at": &now,
	}
	return r.db.WithContext(ctx).
		Model(&entity.UserKYC{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *kycRepo) ListKYC(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.UserKYC, error) {
	var kycs []entity.UserKYC
	q := r.db.WithContext(ctx).Preload("User")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&kycs).Error
	return kycs, err
}

func (r *kycRepo) CreateReport(ctx context.Context, rep *entity.ContentReport) error {
	return r.db.WithContext(ctx).Create(rep).Error
}

func (r *kycRepo) FindReport(ctx context.Context, id uuid.UUID) (*entity.ContentReport, error) {
	var report entity.ContentReport
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&report).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &report, err
}

func (r *kycRepo) UpdateReportStatus(ctx context.Context, id uuid.UUID, status entity.ReportStatus, adminNote *string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":      status,
		"admin_note":  adminNote,
		"resolved_at": &now,
	}
	return r.db.WithContext(ctx).
		Model(&entity.ContentReport{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *kycRepo) ListReports(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.ContentReport, error) {
	var reports []entity.ContentReport
	q := r.db.WithContext(ctx)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&reports).Error
	return reports, err
}

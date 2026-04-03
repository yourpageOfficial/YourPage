package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
)

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

type SubmitKYCRequest struct {
	KTPImageURL string `json:"ktp_image_url" validate:"required,url"`
	FullName    string `json:"full_name"     validate:"required,max=200"`
	IDNumber    string `json:"id_number"     validate:"required,min=16,max=16"`
}

type CreateReportRequest struct {
	TargetType  entity.ReportTargetType `json:"target_type"  validate:"required,oneof=post product user"`
	TargetID    uuid.UUID               `json:"target_id"    validate:"required"`
	Reason      entity.ReportReason     `json:"reason"       validate:"required,oneof=nsfw plagiarism scam spam other"`
	Description *string                 `json:"description"  validate:"omitempty,max=1000"`
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

type KYCService interface {
	SubmitKYC(ctx context.Context, userID uuid.UUID, req SubmitKYCRequest) (*entity.UserKYC, error)
	GetMyKYC(ctx context.Context, userID uuid.UUID) (*entity.UserKYC, error)
	CreateReport(ctx context.Context, reporterID *uuid.UUID, req CreateReportRequest) (*entity.ContentReport, error)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type kycService struct {
	kycRepo repository.KYCRepository
}

func NewKYCService(kycRepo repository.KYCRepository) KYCService {
	return &kycService{kycRepo: kycRepo}
}

func (s *kycService) SubmitKYC(ctx context.Context, userID uuid.UUID, req SubmitKYCRequest) (*entity.UserKYC, error) {
	// Check if already submitted.
	existing, err := s.kycRepo.FindKYCByUserID(ctx, userID)
	if err == nil && existing != nil {
		return nil, entity.ErrConflict
	}

	kyc := &entity.UserKYC{
		ID:          uuid.New(),
		UserID:      userID,
		KTPImageURL: req.KTPImageURL,
		FullName:    req.FullName,
		IDNumber:    req.IDNumber,
		Status:      entity.KYCStatusPending,
	}

	if err := s.kycRepo.CreateKYC(ctx, kyc); err != nil {
		return nil, fmt.Errorf("kyc: create: %w", err)
	}
	return kyc, nil
}

func (s *kycService) GetMyKYC(ctx context.Context, userID uuid.UUID) (*entity.UserKYC, error) {
	return s.kycRepo.FindKYCByUserID(ctx, userID)
}

func (s *kycService) CreateReport(ctx context.Context, reporterID *uuid.UUID, req CreateReportRequest) (*entity.ContentReport, error) {
	report := &entity.ContentReport{
		ID:          uuid.New(),
		ReporterID:  reporterID,
		TargetType:  req.TargetType,
		TargetID:    req.TargetID,
		Reason:      req.Reason,
		Description: req.Description,
		Status:      entity.ReportStatusPending,
	}

	if err := s.kycRepo.CreateReport(ctx, report); err != nil {
		return nil, fmt.Errorf("report: create: %w", err)
	}
	return report, nil
}

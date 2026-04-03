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

type CreateDonationRequest struct {
	CreatorID   uuid.UUID `json:"creator_id"   validate:"required"`
	AmountIDR   int64     `json:"amount_idr"   validate:"required,min=1000"`
	Message     *string   `json:"message"      validate:"omitempty,max=500"`
	DonorName   string    `json:"donor_name"   validate:"required,max=100"`
	DonorEmail  string    `json:"donor_email"  validate:"required,email"`
	IsAnonymous bool      `json:"is_anonymous"`
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

type DonationService interface {
	Create(ctx context.Context, supporterID *uuid.UUID, req CreateDonationRequest) (*entity.Donation, error)
	ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, *uuid.UUID, error)
	ListBySupporter(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, *uuid.UUID, error)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type donationService struct {
	donationRepo repository.DonationRepository
	paymentRepo  repository.PaymentRepository
	userRepo     repository.UserRepository
	platformRepo repository.PlatformRepository
}

func NewDonationService(
	donationRepo repository.DonationRepository,
	paymentRepo repository.PaymentRepository,
	userRepo repository.UserRepository,
	platformRepo repository.PlatformRepository,
) DonationService {
	return &donationService{
		donationRepo: donationRepo,
		paymentRepo:  paymentRepo,
		userRepo:     userRepo,
		platformRepo: platformRepo,
	}
}

func (s *donationService) Create(ctx context.Context, supporterID *uuid.UUID, req CreateDonationRequest) (*entity.Donation, error) {
	// Verify creator exists.
	_, err := s.userRepo.FindCreatorByUserID(ctx, req.CreatorID)
	if err != nil {
		return nil, fmt.Errorf("donation: creator not found: %w", err)
	}

	settings, err := s.platformRepo.GetSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("donation: get settings: %w", err)
	}

	feeIDR := req.AmountIDR * int64(settings.FeePercent) / 100
	netIDR := req.AmountIDR - feeIDR

	paymentID := uuid.New()
	payment := &entity.Payment{
		ID:           paymentID,
		ExternalID:   fmt.Sprintf("DON-%s", paymentID),
		Provider:     entity.PaymentProviderXendit, // default, will be overridden by checkout flow
		Usecase:      entity.PaymentUsecaseDonation,
		ReferenceID:  uuid.New(), // will be set to donation ID
		PayerID:      supporterID,
		AmountIDR:    req.AmountIDR,
		FeeIDR:       feeIDR,
		NetAmountIDR: netIDR,
		Status:       entity.PaymentStatusPending,
	}

	donation := &entity.Donation{
		ID:           uuid.New(),
		CreatorID:    req.CreatorID,
		SupporterID:  supporterID,
		PaymentID:    paymentID,
		AmountIDR:    req.AmountIDR,
		NetAmountIDR: netIDR,
		Message:      req.Message,
		DonorName:    req.DonorName,
		DonorEmail:   req.DonorEmail,
		IsAnonymous:  req.IsAnonymous,
		Status:       entity.PaymentStatusPending,
	}

	payment.ReferenceID = donation.ID

	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		return nil, fmt.Errorf("donation: create payment: %w", err)
	}
	if err := s.donationRepo.Create(ctx, donation); err != nil {
		return nil, fmt.Errorf("donation: create donation: %w", err)
	}

	return donation, nil
}

func (s *donationService) ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, *uuid.UUID, error) {
	donations, err := s.donationRepo.ListByCreator(ctx, creatorID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(donations) > limit {
		next = &donations[limit].ID
		donations = donations[:limit]
	}
	return donations, next, nil
}

func (s *donationService) ListBySupporter(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, *uuid.UUID, error) {
	donations, err := s.donationRepo.ListBySupporter(ctx, supporterID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(donations) > limit {
		next = &donations[limit].ID
		donations = donations[:limit]
	}
	return donations, next, nil
}

package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/mailer"
	"github.com/yourpage/be/internal/repository"
)

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

type CreateWithdrawalRequest struct {
	AmountIDR     int64  `json:"amount_idr"     validate:"required,min=100000"`
	BankName      string `json:"bank_name"      validate:"required"`
	AccountNumber string `json:"account_number" validate:"required"`
	AccountName   string `json:"account_name"   validate:"required"`
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

type WithdrawalService interface {
	Create(ctx context.Context, creatorID uuid.UUID, req CreateWithdrawalRequest) (*entity.Withdrawal, error)
	ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, *uuid.UUID, error)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type withdrawalService struct {
	withdrawalRepo repository.WithdrawalRepository
	userRepo       repository.UserRepository
	walletRepo     repository.WalletRepository
	kycRepo        repository.KYCRepository
	platformRepo   repository.PlatformRepository
	mailer         mailer.Mailer
	adminEmail     string
}

func NewWithdrawalService(
	withdrawalRepo repository.WithdrawalRepository,
	userRepo repository.UserRepository,
	walletRepo repository.WalletRepository,
	kycRepo repository.KYCRepository,
	platformRepo repository.PlatformRepository,
	mailer mailer.Mailer,
	adminEmail string,
) WithdrawalService {
	return &withdrawalService{
		withdrawalRepo: withdrawalRepo,
		userRepo:       userRepo,
		walletRepo:     walletRepo,
		kycRepo:        kycRepo,
		platformRepo:   platformRepo,
		mailer:         mailer,
		adminEmail:     adminEmail,
	}
}

func (s *withdrawalService) Create(ctx context.Context, creatorID uuid.UUID, req CreateWithdrawalRequest) (*entity.Withdrawal, error) {
	settings, err := s.platformRepo.GetSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("withdrawal: get settings: %w", err)
	}
	if req.AmountIDR < settings.MinWithdrawalIDR {
		return nil, entity.ErrMinWithdrawal
	}

	_, err = s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("withdrawal: creator not found: %w", err)
	}

	// Check wallet balance
	balance, err := s.walletRepo.GetBalance(ctx, creatorID)
	if err != nil || balance*settings.CreditRateIDR < req.AmountIDR {
		return nil, entity.ErrInsufficientCredit
	}

	// Check if first-time withdrawal → require KYC approved.
	hasPrevious, err := s.withdrawalRepo.HasPreviousApproved(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("withdrawal: check previous: %w", err)
	}
	if !hasPrevious {
		kyc, err := s.kycRepo.FindKYCByUserID(ctx, creatorID)
		if err != nil {
			return nil, entity.ErrKYCRequired
		}
		if kyc.Status != entity.KYCStatusApproved {
			return nil, entity.ErrKYCRequired
		}
	}

	w := &entity.Withdrawal{
		ID:            uuid.New(),
		CreatorID:     creatorID,
		AmountIDR:     req.AmountIDR,
		BankName:      req.BankName,
		AccountNumber: req.AccountNumber,
		AccountName:   req.AccountName,
		Status:        entity.WithdrawalStatusPending,
	}

	if err := s.withdrawalRepo.Create(ctx, w); err != nil {
		return nil, fmt.Errorf("withdrawal: create: %w", err)
	}

	// Notify admin (non-blocking) — TODO: add admin notification

	return w, nil
}

func (s *withdrawalService) ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, *uuid.UUID, error) {
	items, err := s.withdrawalRepo.ListByCreator(ctx, creatorID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(items) > limit {
		next = &items[limit].ID
		items = items[:limit]
	}
	return items, next, nil
}

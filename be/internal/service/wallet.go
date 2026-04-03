package service

import (
	"context"
	"fmt"
	"io"
	"strconv"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
)

type WalletService interface {
	GetBalance(ctx context.Context, userID uuid.UUID) (*entity.UserWallet, error)
	ListTransactions(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.CreditTransaction, *uuid.UUID, error)
	CreateTopupRequest(ctx context.Context, userID uuid.UUID, amountStr string) (*entity.CreditTopupRequest, error)
	UploadTopupProof(ctx context.Context, userID, topupID uuid.UUID, donorName string, file io.Reader, fileSize int64, contentType string) (*entity.CreditTopupRequest, error)
}

type walletService struct {
	walletRepo   repository.WalletRepository
	platformRepo repository.PlatformRepository
	storage      storage.StorageService
	cfg          *config.Config
}

func NewWalletService(walletRepo repository.WalletRepository, platformRepo repository.PlatformRepository, storageSvc storage.StorageService, cfg *config.Config) WalletService {
	return &walletService{walletRepo: walletRepo, platformRepo: platformRepo, storage: storageSvc, cfg: cfg}
}

func (s *walletService) GetBalance(ctx context.Context, userID uuid.UUID) (*entity.UserWallet, error) {
	return s.walletRepo.FindOrCreateWallet(ctx, userID)
}

func (s *walletService) ListTransactions(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.CreditTransaction, *uuid.UUID, error) {
	txs, err := s.walletRepo.ListTransactions(ctx, userID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(txs) > limit {
		next = &txs[limit].ID
		txs = txs[:limit]
	}
	return txs, next, nil
}

// Step 1: Create topup request with unique code (no proof yet)
func (s *walletService) CreateTopupRequest(ctx context.Context, userID uuid.UUID, amountStr string) (*entity.CreditTopupRequest, error) {
	amount, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil || amount < 10000 {
		return nil, fmt.Errorf("minimum top-up is Rp 10.000")
	}

	settings, err := s.platformRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	uniqueCode := validator.GenerateUniqueCode()
	totalAmount := amount + int64(uniqueCode)
	credits := amount / settings.CreditRateIDR

	topup := &entity.CreditTopupRequest{
		ID:         uuid.New(),
		UserID:     userID,
		AmountIDR:  totalAmount,
		Credits:    credits,
		UniqueCode: uniqueCode,
		Status:     entity.PaymentStatusPending,
	}

	if err := s.walletRepo.CreateTopupRequest(ctx, topup); err != nil {
		return nil, err
	}
	return topup, nil
}

// Step 2: Upload proof for existing topup request
func (s *walletService) UploadTopupProof(ctx context.Context, userID, topupID uuid.UUID, donorName string, file io.Reader, fileSize int64, contentType string) (*entity.CreditTopupRequest, error) {
	topup, err := s.walletRepo.FindTopupRequest(ctx, topupID)
	if err != nil {
		return nil, err
	}
	if topup.UserID != userID {
		return nil, entity.ErrForbidden
	}

	objectName := fmt.Sprintf("topups/%s/%s", userID, uuid.NewString())
	proofURL, err := s.storage.UploadFile(ctx, s.cfg.MinIO.PublicBucket, objectName, file, fileSize, contentType)
	if err != nil {
		return nil, fmt.Errorf("wallet: upload proof: %w", err)
	}

	topup.DonorName = donorName
	topup.ProofImageURL = &proofURL

	if err := s.walletRepo.UpdateTopupProof(ctx, topupID, donorName, proofURL); err != nil {
		return nil, err
	}

	topup.ProofImageURL = &proofURL
	return topup, nil
}

package service

import (
	"context"
	"fmt"
	"io"
	"strconv"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/audit"
	"github.com/yourpage/be/internal/pkg/mailer"
	"github.com/yourpage/be/internal/pkg/payment/stripe"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
)

// maxTopupIDR caps a single top-up at Rp 100 juta.
const maxTopupIDR int64 = 100_000_000

type WalletService interface {
	GetBalance(ctx context.Context, userID uuid.UUID) (*entity.UserWallet, error)
	ListTransactions(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.CreditTransaction, *uuid.UUID, error)
	CreateTopupRequest(ctx context.Context, userID uuid.UUID, amountStr string, method entity.TopupMethod) (*entity.CreditTopupRequest, error)
	UploadTopupProof(ctx context.Context, userID, topupID uuid.UUID, donorName string, file io.Reader, fileSize int64, contentType string) (*entity.CreditTopupRequest, error)
	GetTopupStatus(ctx context.Context, userID, topupID uuid.UUID) (*entity.CreditTopupRequest, error)
	FulfillStripeTopup(ctx context.Context, sessionID string) error
	ExpireStripeTopup(ctx context.Context, sessionID string) error
}

type walletService struct {
	walletRepo   repository.WalletRepository
	platformRepo repository.PlatformRepository
	userRepo     repository.UserRepository
	followRepo   repository.FollowRepository
	storage      storage.StorageService
	cfg          *config.Config
	mailer       mailer.Mailer
	adminEmail   string
	audit        audit.Logger
}

func NewWalletService(walletRepo repository.WalletRepository, platformRepo repository.PlatformRepository, userRepo repository.UserRepository, followRepo repository.FollowRepository, storageSvc storage.StorageService, cfg *config.Config, mailSvc mailer.Mailer, adminEmail string, auditLog audit.Logger) WalletService {
	return &walletService{
		walletRepo:   walletRepo,
		platformRepo: platformRepo,
		userRepo:     userRepo,
		followRepo:   followRepo,
		storage:      storageSvc,
		cfg:          cfg,
		mailer:       mailSvc,
		adminEmail:   adminEmail,
		audit:        auditLog,
	}
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

// Step 1: Create topup request. QRIS: unique code + manual proof + admin approval.
// Stripe: hosted checkout session, fulfilled automatically via webhook.
func (s *walletService) CreateTopupRequest(ctx context.Context, userID uuid.UUID, amountStr string, method entity.TopupMethod) (*entity.CreditTopupRequest, error) {
	amount, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil || amount < 10000 {
		return nil, fmt.Errorf("⚠ Minimum top-up Rp 10.000. Masukkan angka bulat.")
	}
	// Upper bound keeps downstream arithmetic (amount*100 for Stripe,
	// amount+uniqueCode for QRIS) far from int64 overflow, and caps the blast
	// radius of a manipulated request reaching manual approval.
	if amount > maxTopupIDR {
		return nil, fmt.Errorf("⚠ Maksimum top-up Rp %d per transaksi.", maxTopupIDR)
	}

	// QA-22: Efficient per-user pending count
	userPending, _ := s.walletRepo.CountPendingTopupsByUser(ctx, userID)
	if userPending >= 3 { return nil, fmt.Errorf("⚠ Maksimal 3 topup pending. Tunggu yang sebelumnya diproses.") }

	settings, err := s.platformRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	if method == "" { method = entity.TopupMethodQRIS }
	switch method {
	case entity.TopupMethodQRIS:
		if !settings.QRISEnabled {
			return nil, fmt.Errorf("⚠ Metode QRIS sedang tidak tersedia")
		}
	case entity.TopupMethodStripe:
		if !settings.StripeEnabled {
			return nil, fmt.Errorf("⚠ Pembayaran kartu sedang tidak tersedia")
		}
		if settings.StripeSecretKey == "" {
			return nil, fmt.Errorf("⚠ Pembayaran kartu belum dikonfigurasi admin")
		}
	default:
		return nil, fmt.Errorf("⚠ Metode pembayaran tidak dikenal")
	}

	rate := settings.CreditRateIDR
	if rate <= 0 { rate = 1000 }
	credits := amount / rate

	if method == entity.TopupMethodStripe {
		topup := &entity.CreditTopupRequest{
			ID:        uuid.New(),
			UserID:    userID,
			AmountIDR: amount,
			Credits:   credits,
			Method:    entity.TopupMethodStripe,
			Status:    entity.PaymentStatusPending,
		}
		if err := s.walletRepo.CreateTopupRequest(ctx, topup); err != nil {
			return nil, err
		}

		email := ""
		if user, uerr := s.userRepo.FindByID(ctx, userID); uerr == nil { email = user.Email }
		client := stripe.NewClient(settings.StripeSecretKey)
		session, err := client.CreateCheckoutSession(ctx, stripe.CheckoutParams{
			AmountIDR:   amount,
			ProductName: fmt.Sprintf("Top-up %d Credit", credits),
			SuccessURL:  fmt.Sprintf("%s/wallet/topup?status=success&topup_id=%s", s.cfg.App.FrontendURL, topup.ID),
			CancelURL:   fmt.Sprintf("%s/wallet/topup?status=cancelled&topup_id=%s", s.cfg.App.FrontendURL, topup.ID),
			TopupID:     topup.ID.String(),
			UserEmail:   email,
		})
		if err != nil {
			_, _ = s.walletRepo.MarkTopupStatusIfPending(ctx, topup.ID, entity.PaymentStatusFailed, nil)
			// Log the provider's message server-side only: Stripe echoes the
			// offending API key back in auth errors, and this string is
			// returned verbatim to the caller.
			log.Error().Err(err).Str("topup_id", topup.ID.String()).Msg("wallet: stripe checkout session failed")
			return nil, fmt.Errorf("⚠ Gagal membuat sesi pembayaran. Coba lagi atau pilih metode lain.")
		}
		if err := s.walletRepo.SetTopupStripeSession(ctx, topup.ID, session.ID); err != nil {
			return nil, err
		}
		topup.StripeSessionID = &session.ID
		topup.CheckoutURL = session.URL
		s.audit.Log(ctx, audit.Entry{
			ActorID: &userID, ActorRole: "user", Event: audit.EventTopupCreated,
			ReferenceType: "topup", ReferenceID: &topup.ID,
			AmountIDR: amount, Credits: credits, Method: string(entity.TopupMethodStripe),
			Detail: entity.JSONMap{"stripe_session_id": session.ID},
		})
		return topup, nil
	}

	uniqueCode := validator.GenerateUniqueCode()
	totalAmount := amount + int64(uniqueCode)

	topup := &entity.CreditTopupRequest{
		ID:         uuid.New(),
		UserID:     userID,
		AmountIDR:  totalAmount,
		Credits:    credits,
		UniqueCode: uniqueCode,
		Method:     entity.TopupMethodQRIS,
		Status:     entity.PaymentStatusPending,
	}

	if err := s.walletRepo.CreateTopupRequest(ctx, topup); err != nil {
		return nil, err
	}
	s.audit.Log(ctx, audit.Entry{
		ActorID: &userID, ActorRole: "user", Event: audit.EventTopupCreated,
		ReferenceType: "topup", ReferenceID: &topup.ID,
		AmountIDR: totalAmount, Credits: credits, Method: string(entity.TopupMethodQRIS),
		Detail: entity.JSONMap{"unique_code": uniqueCode},
	})
	return topup, nil
}

// GetTopupStatus returns a user's topup. For pending Stripe topups it also
// reconciles against the Stripe API, so success works even when webhooks
// are delayed or unreachable (e.g. local development).
func (s *walletService) GetTopupStatus(ctx context.Context, userID, topupID uuid.UUID) (*entity.CreditTopupRequest, error) {
	topup, err := s.walletRepo.FindTopupRequest(ctx, topupID)
	if err != nil {
		return nil, err
	}
	if topup.UserID != userID {
		return nil, entity.ErrForbidden
	}
	if topup.Method == entity.TopupMethodStripe && topup.Status == entity.PaymentStatusPending && topup.StripeSessionID != nil {
		settings, serr := s.platformRepo.GetSettings(ctx)
		if serr == nil && settings.StripeSecretKey != "" {
			client := stripe.NewClient(settings.StripeSecretKey)
			if session, gerr := client.GetCheckoutSession(ctx, *topup.StripeSessionID); gerr == nil {
				if session.PayStatus == "paid" {
					if ferr := s.fulfillTopup(ctx, topup); ferr == nil {
						return s.walletRepo.FindTopupRequest(ctx, topupID)
					}
				} else if session.Status == "expired" {
					_, _ = s.walletRepo.MarkTopupStatusIfPending(ctx, topup.ID, entity.PaymentStatusExpired, nil)
					return s.walletRepo.FindTopupRequest(ctx, topupID)
				}
			}
		}
	}
	return topup, nil
}

// FulfillStripeTopup marks a Stripe topup paid and credits the wallet (webhook path).
func (s *walletService) FulfillStripeTopup(ctx context.Context, sessionID string) error {
	topup, err := s.walletRepo.FindTopupByStripeSession(ctx, sessionID)
	if err != nil {
		return err
	}
	return s.fulfillTopup(ctx, topup)
}

// ExpireStripeTopup marks a pending Stripe topup as expired (webhook path).
func (s *walletService) ExpireStripeTopup(ctx context.Context, sessionID string) error {
	topup, err := s.walletRepo.FindTopupByStripeSession(ctx, sessionID)
	if err != nil {
		return err
	}
	_, err = s.walletRepo.MarkTopupStatusIfPending(ctx, topup.ID, entity.PaymentStatusExpired, nil)
	return err
}

// fulfillTopup atomically flips pending→paid and credits the wallet exactly once.
func (s *walletService) fulfillTopup(ctx context.Context, topup *entity.CreditTopupRequest) error {
	won, err := s.walletRepo.MarkTopupStatusIfPending(ctx, topup.ID, entity.PaymentStatusPaid, nil)
	if err != nil {
		return err
	}
	if !won {
		return nil // already processed (webhook + poll race, or duplicate delivery)
	}

	s.walletRepo.FindOrCreateWallet(ctx, topup.UserID)
	if err := s.walletRepo.AddCredits(ctx, topup.UserID, topup.Credits); err != nil {
		return fmt.Errorf("wallet: stripe topup add credits: %w", err)
	}

	if err := s.walletRepo.CreateTransaction(ctx, &entity.CreditTransaction{
		ID:          uuid.New(),
		UserID:      topup.UserID,
		Type:        entity.CreditTransactionTopup,
		Credits:     topup.Credits,
		IDRAmount:   topup.AmountIDR,
		ReferenceID: &topup.ID,
		Description: "Top-up via kartu (Stripe)",
	}); err != nil {
		fmt.Printf("wallet: stripe topup transaction record: %v\n", err)
	}

	if err := s.followRepo.CreateNotification(ctx, &entity.Notification{
		ID:     uuid.New(),
		UserID: topup.UserID,
		Type:   entity.NotificationCreditTopupDone,
		Title:  "Top-up Berhasil",
		Body:   fmt.Sprintf("Top-up Rp %d berhasil, saldo bertambah %d credit.", topup.AmountIDR, topup.Credits),
	}); err != nil {
		fmt.Printf("wallet: stripe topup notification: %v\n", err)
	}

	if user, err := s.userRepo.FindByID(ctx, topup.UserID); err == nil {
		go s.mailer.SendTopupApproved(ctx, user.Email, topup.Credits)
	}
	sid := ""
	if topup.StripeSessionID != nil { sid = *topup.StripeSessionID }
	s.audit.Log(ctx, audit.Entry{
		ActorID: &topup.UserID, ActorRole: "system", Event: audit.EventTopupPaid,
		ReferenceType: "topup", ReferenceID: &topup.ID,
		AmountIDR: topup.AmountIDR, Credits: topup.Credits, Method: string(topup.Method),
		Detail: entity.JSONMap{"stripe_session_id": sid},
	})
	return nil
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
	if topup.Status != entity.PaymentStatusPending {
		return nil, fmt.Errorf("⚠ Topup sudah diproses, tidak bisa upload ulang")
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

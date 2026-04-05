package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/mailer"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
)

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

type CheckoutPostRequest struct {
	PostID   uuid.UUID `json:"post_id"   validate:"required"`
	Provider string    `json:"provider"  validate:"required,oneof=credits"` // TODO: add xendit paypal
}

type CheckoutProductRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Provider  string    `json:"provider"   validate:"required,oneof=credits"` // TODO: add xendit paypal
}

type CheckoutDonationRequest struct {
	CreatorID   uuid.UUID `json:"creator_id"   validate:"required"`
	AmountIDR   int64     `json:"amount_idr"   validate:"required,min=1000"`
	Message     *string   `json:"message"      validate:"omitempty,max=500"`
	DonorName   string    `json:"donor_name"   validate:"required,max=100"`
	IsAnonymous bool      `json:"is_anonymous"`
	MediaURL    *string   `json:"media_url"`
	Provider    string    `json:"provider"     validate:"required,oneof=credits"`
}

type CheckoutResponse struct {
	PaymentID uuid.UUID `json:"payment_id"`
	Status    string    `json:"status"`
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

type PaymentService interface {
	CheckoutPost(ctx context.Context, buyerID uuid.UUID, req CheckoutPostRequest) (*CheckoutResponse, error)
	CheckoutProduct(ctx context.Context, buyerID uuid.UUID, req CheckoutProductRequest) (*CheckoutResponse, error)
	CheckoutDonation(ctx context.Context, buyerID uuid.UUID, req CheckoutDonationRequest) (*CheckoutResponse, error)
	GetPaymentStatus(ctx context.Context, paymentID uuid.UUID) (*entity.Payment, error)
	ListCreatorSales(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, *uuid.UUID, error)
	ListMyTransactions(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, *uuid.UUID, error)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type paymentService struct {
	paymentRepo  repository.PaymentRepository
	postRepo     repository.PostRepository
	productRepo  repository.ProductRepository
	donationRepo repository.DonationRepository
	walletRepo   repository.WalletRepository
	userRepo     repository.UserRepository
	followRepo   repository.FollowRepository
	platformRepo repository.PlatformRepository
	mailer       mailer.Mailer
}

func NewPaymentService(
	paymentRepo repository.PaymentRepository,
	postRepo repository.PostRepository,
	productRepo repository.ProductRepository,
	donationRepo repository.DonationRepository,
	walletRepo repository.WalletRepository,
	userRepo repository.UserRepository,
	followRepo repository.FollowRepository,
	platformRepo repository.PlatformRepository,
	m mailer.Mailer,
) PaymentService {
	return &paymentService{
		paymentRepo:  paymentRepo,
		postRepo:     postRepo,
		productRepo:  productRepo,
		donationRepo: donationRepo,
		walletRepo:   walletRepo,
		userRepo:     userRepo,
		followRepo:   followRepo,
		platformRepo: platformRepo,
		mailer:       m,
	}
}

// ---------------------------------------------------------------------------
// CheckoutPost — buy a paid post using credits
// ---------------------------------------------------------------------------

// getCreatorFeePercent returns the fee % for a creator based on their tier
func (s *paymentService) getCreatorFeePercent(ctx context.Context, creatorID uuid.UUID) int {
	// M-01: Read default from platform settings
	defaultFee := 20
	if settings, err := s.platformRepo.GetSettings(ctx); err == nil && settings.FeePercent > 0 {
		defaultFee = settings.FeePercent
	}
	profile, err := s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if err != nil { return defaultFee }
	if profile.PromoFeePercent != nil && profile.PromoFeeExpiresAt != nil && profile.PromoFeeExpiresAt.After(time.Now()) {
		return *profile.PromoFeePercent
	}
	if profile.CustomFeePercent != nil { return *profile.CustomFeePercent }
	return defaultFee
}

func (s *paymentService) CheckoutPost(ctx context.Context, buyerID uuid.UUID, req CheckoutPostRequest) (*CheckoutResponse, error) {
	post, err := s.postRepo.FindByID(ctx, req.PostID)
	if err != nil {
		return nil, err
	}
	if post.AccessType != entity.PostAccessPaid || post.Price == nil {
		return nil, entity.ErrForbidden
	}
	if post.Status != entity.PostStatusPublished {
		return nil, fmt.Errorf("post belum dipublikasikan")
	}
	if post.CreatorID == buyerID {
		return nil, entity.ErrForbidden // can't buy own content
	}

	// Check already purchased.
	if _, err := s.postRepo.FindPurchase(ctx, req.PostID, buyerID); err == nil {
		return nil, entity.ErrAlreadyPurchased
	}

	amountIDR := *post.Price
	feePct := s.getCreatorFeePercent(ctx, post.CreatorID)
	feeIDR := amountIDR * int64(feePct) / 100
	netIDR := amountIDR - feeIDR

	if req.Provider == "credits" {
		return s.payWithCredits(ctx, buyerID, post.CreatorID, amountIDR, feeIDR, netIDR, entity.PaymentUsecasePostPurchase, req.PostID, func(paymentID uuid.UUID) error {
			purchase := &entity.PostPurchase{
				ID:          uuid.New(),
				PostID:      req.PostID,
				SupporterID: buyerID,
				PaymentID:   paymentID,
				AmountIDR:   amountIDR,
			}
			return s.postRepo.CreatePurchase(ctx, purchase)
		})
	}

	// TODO: xendit / paypal flow
	return nil, entity.ErrPaymentFailed
}

// ---------------------------------------------------------------------------
// CheckoutProduct — buy a digital product using credits
// ---------------------------------------------------------------------------

func (s *paymentService) CheckoutProduct(ctx context.Context, buyerID uuid.UUID, req CheckoutProductRequest) (*CheckoutResponse, error) {
	product, err := s.productRepo.FindByID(ctx, req.ProductID)
	if err != nil {
		return nil, err
	}
	if product.CreatorID == buyerID {
		return nil, entity.ErrForbidden
	}
	if !product.IsActive {
		return nil, fmt.Errorf("⚠ Produk tidak tersedia")
	}

	if _, err := s.productRepo.FindPurchase(ctx, req.ProductID, buyerID); err == nil {
		return nil, entity.ErrAlreadyPurchased
	}

	amountIDR := product.PriceIDR
	feePct := s.getCreatorFeePercent(ctx, product.CreatorID)
	feeIDR := amountIDR * int64(feePct) / 100
	netIDR := amountIDR - feeIDR

	if req.Provider == "credits" {
		return s.payWithCredits(ctx, buyerID, product.CreatorID, amountIDR, feeIDR, netIDR, entity.PaymentUsecaseProductPurchase, req.ProductID, func(paymentID uuid.UUID) error {
			purchase := &entity.ProductPurchase{
				ID:          uuid.New(),
				ProductID:   req.ProductID,
				SupporterID: buyerID,
				PaymentID:   paymentID,
				AmountIDR:   amountIDR,
			}
			if err := s.productRepo.CreatePurchase(ctx, purchase); err != nil {
				return err
			}
			return s.productRepo.IncrementSalesCount(ctx, req.ProductID)
		})
	}

	return nil, entity.ErrPaymentFailed
}

// ---------------------------------------------------------------------------
// CheckoutDonation — send donation using credits
// ---------------------------------------------------------------------------

func (s *paymentService) CheckoutDonation(ctx context.Context, buyerID uuid.UUID, req CheckoutDonationRequest) (*CheckoutResponse, error) {
	if buyerID == req.CreatorID {
		return nil, entity.ErrForbidden
	}

	feePct := s.getCreatorFeePercent(ctx, req.CreatorID)
	feeIDR := req.AmountIDR * int64(feePct) / 100
	netIDR := req.AmountIDR - feeIDR

	if req.Provider == "credits" {
		return s.payWithCredits(ctx, buyerID, req.CreatorID, req.AmountIDR, feeIDR, netIDR, entity.PaymentUsecaseDonation, uuid.Nil, func(paymentID uuid.UUID) error {
			donation := &entity.Donation{
				ID:           uuid.New(),
				CreatorID:    req.CreatorID,
				SupporterID:  &buyerID,
				PaymentID:    paymentID,
				AmountIDR:    req.AmountIDR,
				NetAmountIDR: netIDR,
				Message:      req.Message,
				DonorName:    req.DonorName,
				IsAnonymous:  req.IsAnonymous,
				MediaURL:     req.MediaURL,
				Status:       entity.PaymentStatusPaid,
			}
			return s.donationRepo.Create(ctx, donation)
		})
	}

	return nil, entity.ErrPaymentFailed
}

// ---------------------------------------------------------------------------
// GetPaymentStatus
// ---------------------------------------------------------------------------

func (s *paymentService) GetPaymentStatus(ctx context.Context, paymentID uuid.UUID) (*entity.Payment, error) {
	return s.paymentRepo.FindByID(ctx, paymentID)
}

// ---------------------------------------------------------------------------
// payWithCredits — shared credit payment logic
// ---------------------------------------------------------------------------

func (s *paymentService) payWithCredits(
	ctx context.Context,
	buyerID, creatorID uuid.UUID,
	amountIDR, feeIDR, netIDR int64,
	usecase entity.PaymentUsecase,
	referenceID uuid.UUID,
	fulfillFn func(paymentID uuid.UUID) error,
) (*CheckoutResponse, error) {
	// Convert IDR to credits (1 credit = Rp 1.000).
	settings, err := s.platformRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	if settings.CreditRateIDR <= 0 { settings.CreditRateIDR = 1000 }
	creditsNeeded := amountIDR / settings.CreditRateIDR
	if amountIDR%settings.CreditRateIDR != 0 {
		creditsNeeded++
	}

	// Check wallet balance (stored in Credits)
	walletBalance, err := s.walletRepo.GetBalance(ctx, buyerID)
	if err != nil {
		return nil, err
	}
	if walletBalance < creditsNeeded {
		return nil, entity.ErrInsufficientCredit
	}

	paymentID := uuid.New()
	uniqueCode := validator.GenerateUniqueCode()

	// Deduct Credits from wallet
	if err := s.walletRepo.DeductCredits(ctx, buyerID, creditsNeeded); err != nil {
		return nil, entity.ErrInsufficientCredit
	}

	// 2. Create payment record
	payment := &entity.Payment{
		ID: paymentID, ExternalID: fmt.Sprintf("CREDIT-%s", paymentID),
		Provider: entity.PaymentProviderCredits, Usecase: usecase,
		ReferenceID: referenceID, PayerID: &buyerID,
		AmountIDR: amountIDR, FeeIDR: feeIDR, NetAmountIDR: netIDR,
		Status: entity.PaymentStatusPaid, UniqueCode: uniqueCode,
	}
	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		// Refund credits on failure
		_ = s.walletRepo.AddCredits(ctx, buyerID, creditsNeeded)
		return nil, err
	}

	// 3. Fulfill (create purchase record)
	if err := fulfillFn(paymentID); err != nil {
		// Refund credits on failure
		_ = s.walletRepo.AddCredits(ctx, buyerID, creditsNeeded)
		_ = s.paymentRepo.UpdateStatus(ctx, paymentID, entity.PaymentStatusFailed, nil)
		return nil, err
	}

	// 4. Record spend transaction
	_ = s.walletRepo.CreateTransaction(ctx, &entity.CreditTransaction{
		ID: uuid.New(), UserID: buyerID, Type: entity.CreditTransactionSpend,
		Credits: creditsNeeded, IDRAmount: amountIDR,
		PaymentID: &paymentID, ReferenceID: &referenceID,
		Description: fmt.Sprintf("Payment for %s", usecase),
	})

	// 5. Credit creator wallet + update earnings + notify
	profile, err := s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if err == nil {
		// 4.8: Ensure creator wallet exists
		s.walletRepo.FindOrCreateWallet(ctx, creatorID)
		_ = s.walletRepo.AddCredits(ctx, creatorID, netIDR/settings.CreditRateIDR)
		profile.TotalEarnings += netIDR
		if usecase == entity.PaymentUsecaseDonation { profile.DonationGoalCurrent += netIDR }
		profile.Tier = nil
		_ = s.userRepo.UpdateCreatorProfile(ctx, profile)
		// Record earning transaction
		_ = s.walletRepo.CreateTransaction(ctx, &entity.CreditTransaction{
			ID: uuid.New(), UserID: creatorID, Type: entity.CreditTransactionEarning,
			Credits: netIDR / settings.CreditRateIDR, IDRAmount: netIDR,
			PaymentID: &paymentID, ReferenceID: &referenceID,
			Description: fmt.Sprintf("Pendapatan dari %s", usecase),
		})
		notifType := entity.NotificationPurchaseSuccess
		notifTitle := "Pembelian Baru!"
		notifBody := fmt.Sprintf("Seseorang membeli kontenmu. Kamu menerima %d Credit.", netIDR/1000)
		if usecase == entity.PaymentUsecaseDonation {
			notifType = entity.NotificationDonationReceived
			notifTitle = "Donasi Diterima! ☕"
			notifBody = fmt.Sprintf("Seseorang mengirim donasi %d Credit untukmu.", amountIDR/1000)
		}
		_ = s.followRepo.CreateNotification(ctx, &entity.Notification{
			ID: uuid.New(), UserID: creatorID, Type: notifType,
			Title: notifTitle, Body: notifBody, ReferenceID: &referenceID,
		})

		// Send emails
		if creatorUser, err := s.userRepo.FindByID(ctx, creatorID); err == nil {
			if usecase == entity.PaymentUsecaseDonation {
				go s.mailer.SendDonationReceived(ctx, creatorUser.Email, "Supporter", netIDR/1000, "")
			}
		}
		if buyer, err := s.userRepo.FindByID(ctx, buyerID); err == nil {
			go s.mailer.SendPurchaseReceipt(ctx, buyer.Email, string(usecase), creditsNeeded)
		}
	}

	return &CheckoutResponse{PaymentID: paymentID, Status: string(entity.PaymentStatusPaid)}, nil
}

func (s *paymentService) ListCreatorSales(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, *uuid.UUID, error) {
	items, err := s.paymentRepo.ListByReferenceCreator(ctx, creatorID, cursor, limit+1)
	if err != nil { return nil, nil, err }
	var next *uuid.UUID
	if len(items) > limit { next = &items[limit].ID; items = items[:limit] }
	return items, next, nil
}

func (s *paymentService) ListMyTransactions(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, *uuid.UUID, error) {
	items, err := s.paymentRepo.ListByPayer(ctx, userID, cursor, limit+1)
	if err != nil { return nil, nil, err }
	var next *uuid.UUID
	if len(items) > limit { next = &items[limit].ID; items = items[:limit] }
	return items, next, nil
}

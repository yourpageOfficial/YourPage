package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/mailer"
	"github.com/yourpage/be/internal/repository"
)

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

type UpdateWithdrawalStatusRequest struct {
	Status    entity.WithdrawalStatus `json:"status"     validate:"required,oneof=approved rejected processed"`
	AdminNote *string                 `json:"admin_note"`
}

type UpdateKYCStatusRequest struct {
	Status    entity.KYCStatus `json:"status"     validate:"required,oneof=approved rejected"`
	AdminNote *string          `json:"admin_note"`
}

type UpdateReportStatusRequest struct {
	Status    entity.ReportStatus `json:"status"     validate:"required,oneof=resolved dismissed"`
	AdminNote *string             `json:"admin_note"`
}

type ApproveTopupRequest struct {
	AdminNote *string `json:"admin_note"`
}

type UpdatePlatformSettingsRequest struct {
	FeePercent       *int    `json:"fee_percent"`
	MinWithdrawalIDR *int64  `json:"min_withdrawal_idr"`
	CreditRateIDR    *int64  `json:"credit_rate_idr"`
	PlatformQRISURL  *string `json:"platform_qris_url"`
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

type AdminService interface {
	// Users
	ListUsers(ctx context.Context, role string, cursor *uuid.UUID, limit int) ([]entity.User, *uuid.UUID, error)
	BanUser(ctx context.Context, userID uuid.UUID) error
	UnbanUser(ctx context.Context, userID uuid.UUID) error
	CreateFinanceUser(ctx context.Context, email, password, displayName string) error
	VerifyCreator(ctx context.Context, userID uuid.UUID) error
	SetCreatorPromo(ctx context.Context, userID uuid.UUID, promoFee *int, promoDays int, featured bool, note string) error
	ListFeaturedCreators(ctx context.Context) ([]entity.CreatorProfile, error)

	// Withdrawals
	ListWithdrawals(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, *uuid.UUID, error)
	UpdateWithdrawalStatus(ctx context.Context, id uuid.UUID, req UpdateWithdrawalStatusRequest) error

	// KYC
	ListKYC(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.UserKYC, *uuid.UUID, error)
	UpdateKYCStatus(ctx context.Context, id uuid.UUID, req UpdateKYCStatusRequest) error

	// Reports
	ListReports(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.ContentReport, *uuid.UUID, error)
	UpdateReportStatus(ctx context.Context, id uuid.UUID, req UpdateReportStatusRequest) error

	// Credit topups
	ListTopupRequests(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.CreditTopupRequest, *uuid.UUID, error)
	ApproveTopup(ctx context.Context, id uuid.UUID, req ApproveTopupRequest) error
	RejectTopup(ctx context.Context, id uuid.UUID, adminNote *string) error

	// Posts & Products (admin moderation)
	ListAllPosts(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Post, *uuid.UUID, error)
	DeletePost(ctx context.Context, postID uuid.UUID) error
	ListAllProducts(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Product, *uuid.UUID, error)
	DeleteProduct(ctx context.Context, productID uuid.UUID) error

	// Donations
	ListAllDonations(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Donation, *uuid.UUID, error)

	// Payments
	ListPayments(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Payment, *uuid.UUID, error)
	RefundPayment(ctx context.Context, id uuid.UUID, adminNote string) error
	UpdatePayment(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, adminNote string) error

	// Settings
	GetSettings(ctx context.Context) (*entity.PlatformSetting, error)
	UpdateSettings(ctx context.Context, req UpdatePlatformSettingsRequest) (*entity.PlatformSetting, error)

	// Profit
	CreateProfitWithdrawal(ctx context.Context, w *entity.PlatformWithdrawal) error

	// Analytics
	GetAnalytics(ctx context.Context) (map[string]interface{}, error)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type adminService struct {
	userRepo       repository.UserRepository
	postRepo       repository.PostRepository
	productRepo    repository.ProductRepository
	paymentRepo    repository.PaymentRepository
	donationRepo   repository.DonationRepository
	withdrawalRepo repository.WithdrawalRepository
	walletRepo     repository.WalletRepository
	kycRepo        repository.KYCRepository
	followRepo     repository.FollowRepository
	platformRepo   repository.PlatformRepository
	mailer         mailer.Mailer
	rdb            *redis.Client
}

func NewAdminService(
	userRepo repository.UserRepository,
	postRepo repository.PostRepository,
	productRepo repository.ProductRepository,
	paymentRepo repository.PaymentRepository,
	donationRepo repository.DonationRepository,
	withdrawalRepo repository.WithdrawalRepository,
	walletRepo repository.WalletRepository,
	kycRepo repository.KYCRepository,
	followRepo repository.FollowRepository,
	platformRepo repository.PlatformRepository,
	m mailer.Mailer,
	rdb *redis.Client,
) AdminService {
	return &adminService{
		userRepo:       userRepo,
		postRepo:       postRepo,
		productRepo:    productRepo,
		paymentRepo:    paymentRepo,
		donationRepo:   donationRepo,
		withdrawalRepo: withdrawalRepo,
		walletRepo:     walletRepo,
		kycRepo:        kycRepo,
		followRepo:     followRepo,
		platformRepo:   platformRepo,
		mailer:         m,
		rdb:            rdb,
	}
}

// ---- Users ----

func (s *adminService) ListUsers(ctx context.Context, role string, cursor *uuid.UUID, limit int) ([]entity.User, *uuid.UUID, error) {
	users, err := s.userRepo.List(ctx, role, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(users) > limit {
		next = &users[limit].ID
		users = users[:limit]
	}
	return users, next, nil
}

func (s *adminService) CreateFinanceUser(ctx context.Context, email, password, displayName string) error {
	if _, err := s.userRepo.FindByEmail(ctx, email); err == nil { return entity.ErrConflict }
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil { return err }
	return s.userRepo.Create(ctx, &entity.User{
		ID: uuid.New(), Email: email, Username: "finance_" + uuid.NewString()[:8],
		PasswordHash: string(hash), DisplayName: displayName, Role: entity.RoleFinance, EmailVerified: true,
	})
}

func (s *adminService) BanUser(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	user.IsBanned = true
	if err := s.userRepo.Update(ctx, user); err != nil { return err }
	// 7.2: Invalidate all refresh tokens
	iter := s.rdb.Scan(ctx, 0, "refresh:*", 100).Iterator()
	for iter.Next(ctx) {
		val, _ := s.rdb.Get(ctx, iter.Val()).Result()
		if val == userID.String() { s.rdb.Del(ctx, iter.Val()) }
	}
	// 12.9: Set ban flag for access token check (expires in 1 hour, covers max token lifetime)
	s.rdb.Set(ctx, "banned:"+userID.String(), "1", time.Hour)
	return nil
}

func (s *adminService) VerifyCreator(ctx context.Context, userID uuid.UUID) error {
	profile, err := s.userRepo.FindCreatorByUserID(ctx, userID)
	if err != nil { return err }
	profile.IsVerified = !profile.IsVerified
	profile.Tier = nil
	return s.userRepo.UpdateCreatorProfile(ctx, profile)
}

func (s *adminService) SetCreatorPromo(ctx context.Context, userID uuid.UUID, promoFee *int, promoDays int, featured bool, note string) error {
	profile, err := s.userRepo.FindCreatorByUserID(ctx, userID)
	if err != nil { return err }
	profile.PromoFeePercent = promoFee
	if promoFee != nil && promoDays > 0 {
		exp := time.Now().AddDate(0, 0, promoDays)
		profile.PromoFeeExpiresAt = &exp
	} else {
		profile.PromoFeeExpiresAt = nil
	}
	profile.IsFeatured = featured
	if note != "" { profile.AdminNote = &note }
	profile.Tier = nil
	return s.userRepo.UpdateCreatorProfile(ctx, profile)
}

func (s *adminService) ListFeaturedCreators(ctx context.Context) ([]entity.CreatorProfile, error) {
	return s.userRepo.ListFeaturedCreators(ctx)
}

func (s *adminService) UnbanUser(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	user.IsBanned = false
	s.rdb.Del(ctx, "banned:"+userID.String())
	return s.userRepo.Update(ctx, user)
}

// ---- Withdrawals ----

func (s *adminService) ListWithdrawals(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, *uuid.UUID, error) {
	items, err := s.withdrawalRepo.ListAll(ctx, status, cursor, limit+1)
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

func (s *adminService) UpdateWithdrawalStatus(ctx context.Context, id uuid.UUID, req UpdateWithdrawalStatusRequest) error {
	w, err := s.withdrawalRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// C-05 + 6.7: Status guard + state machine
	if w.Status == entity.WithdrawalStatusProcessed || w.Status == entity.WithdrawalStatusRejected {
		return fmt.Errorf("withdrawal sudah diproses sebelumnya")
	}
	validTransitions := map[entity.WithdrawalStatus][]entity.WithdrawalStatus{
		entity.WithdrawalStatusPending:  {entity.WithdrawalStatusApproved, entity.WithdrawalStatusRejected},
		entity.WithdrawalStatusApproved: {entity.WithdrawalStatusProcessed, entity.WithdrawalStatusRejected},
	}
	allowed := validTransitions[w.Status]
	valid := false
	for _, s := range allowed { if s == req.Status { valid = true; break } }
	if !valid { return fmt.Errorf("⚠ Tidak bisa ubah status dari %s ke %s", w.Status, req.Status) }

	// Deduct credits BEFORE updating status to keep state consistent.
	// If deduction fails, abort so status stays unchanged.
	if req.Status == entity.WithdrawalStatusProcessed {
		settings, err := s.platformRepo.GetSettings(ctx)
		if err != nil {
			return fmt.Errorf("admin: get settings: %w", err)
		}
		creditRate := settings.CreditRateIDR
		if creditRate <= 0 {
			creditRate = 1000 // default fallback
		}
		creditsToDeduct := w.AmountIDR / creditRate
		if err := s.walletRepo.DeductCredits(ctx, w.CreatorID, creditsToDeduct); err != nil {
			return fmt.Errorf("admin: deduct credits failed, withdrawal status not changed: %w", err)
		}
		// Record withdrawal transaction so it appears in creator's wallet history
		desc := fmt.Sprintf("Penarikan ke %s %s", w.BankName, w.AccountNumber)
		if err := s.walletRepo.CreateTransaction(ctx, &entity.CreditTransaction{
			ID: uuid.New(), UserID: w.CreatorID,
			Type: entity.CreditTransactionWithdrawal, Credits: creditsToDeduct,
			IDRAmount: w.AmountIDR, ReferenceID: &id, Description: desc,
		}); err != nil {
			fmt.Printf("admin: create withdrawal credit transaction: %v\n", err)
		}
	}

	if err := s.withdrawalRepo.UpdateStatus(ctx, id, req.Status, req.AdminNote); err != nil {
		return err
	}

	// Notify creator on any status change
	titles := map[entity.WithdrawalStatus]string{
		entity.WithdrawalStatusApproved:  "Penarikan Disetujui",
		entity.WithdrawalStatusRejected:  "Penarikan Ditolak",
		entity.WithdrawalStatusProcessed: "Penarikan Diproses",
	}
	bodies := map[entity.WithdrawalStatus]string{
		entity.WithdrawalStatusApproved:  fmt.Sprintf("Penarikan Rp %d telah disetujui dan akan segera diproses.", w.AmountIDR),
		entity.WithdrawalStatusRejected:  fmt.Sprintf("Penarikan Rp %d ditolak.", w.AmountIDR),
		entity.WithdrawalStatusProcessed: fmt.Sprintf("Penarikan Rp %d telah ditransfer ke rekening kamu.", w.AmountIDR),
	}
	if title, ok := titles[req.Status]; ok {
		body := bodies[req.Status]
		if req.AdminNote != nil && req.Status == entity.WithdrawalStatusRejected {
			body += " Alasan: " + *req.AdminNote
		}
		if err := s.followRepo.CreateNotification(ctx, &entity.Notification{
			ID: uuid.New(), UserID: w.CreatorID, Type: entity.NotificationWithdrawalUpdated,
			Title: title, Body: body, ReferenceID: &id,
		}); err != nil {
			// Non-fatal: log but do not fail the withdrawal update
			fmt.Printf("admin: create withdrawal notification: %v\n", err)
		}
	}

	// Send email
	if user, err := s.userRepo.FindByID(ctx, w.CreatorID); err == nil {
		switch req.Status {
		case entity.WithdrawalStatusProcessed:
			go s.mailer.SendWithdrawalProcessed(ctx, user.Email, w.AmountIDR, w.BankName)
		case entity.WithdrawalStatusRejected:
			reason := "Tidak memenuhi syarat"
			if req.AdminNote != nil { reason = *req.AdminNote }
			go s.mailer.SendWithdrawalRejected(ctx, user.Email, reason)
		}
	}

	return nil
}

// ---- KYC ----

func (s *adminService) ListKYC(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.UserKYC, *uuid.UUID, error) {
	items, err := s.kycRepo.ListKYC(ctx, status, cursor, limit+1)
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

func (s *adminService) UpdateKYCStatus(ctx context.Context, id uuid.UUID, req UpdateKYCStatusRequest) error {
	kyc, err := s.kycRepo.FindKYCByID(ctx, id)
	if err != nil { return entity.ErrNotFound }
	// 7.9: Idempotency
	if string(kyc.Status) == string(req.Status) { return nil }
	userID := kyc.UserID

	if err := s.kycRepo.UpdateKYCStatus(ctx, id, req.Status, req.AdminNote); err != nil {
		return err
	}

	if userID != uuid.Nil {
		body := "KYC kamu telah disetujui. Kamu sekarang bisa melakukan penarikan."
		if req.Status == entity.KYCStatusRejected {
			body = "KYC kamu ditolak."
			if req.AdminNote != nil { body += " Alasan: " + *req.AdminNote }
		}
		if err := s.followRepo.CreateNotification(ctx, &entity.Notification{
			ID: uuid.New(), UserID: userID, Type: entity.NotificationKYCUpdated,
			Title: "Status KYC Diperbarui", Body: body,
		}); err != nil {
			fmt.Printf("admin: create KYC notification: %v\n", err)
		}
	}

	// Send email
	if userID != uuid.Nil {
		if user, err := s.userRepo.FindByID(ctx, userID); err == nil {
			if req.Status == entity.KYCStatusApproved {
				go s.mailer.SendKYCApproved(ctx, user.Email)
			} else if req.Status == entity.KYCStatusRejected {
				reason := "Dokumen tidak valid"
				if req.AdminNote != nil { reason = *req.AdminNote }
				go s.mailer.SendKYCRejected(ctx, user.Email, reason)
			}
		}
	}
	return nil
}

// ---- Reports ----

func (s *adminService) ListReports(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.ContentReport, *uuid.UUID, error) {
	items, err := s.kycRepo.ListReports(ctx, status, cursor, limit+1)
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

func (s *adminService) UpdateReportStatus(ctx context.Context, id uuid.UUID, req UpdateReportStatusRequest) error {
	return s.kycRepo.UpdateReportStatus(ctx, id, req.Status, req.AdminNote)
}

// ---- Credit Topups ----

func (s *adminService) ListTopupRequests(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.CreditTopupRequest, *uuid.UUID, error) {
	items, err := s.walletRepo.ListTopupRequests(ctx, status, cursor, limit+1)
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

func (s *adminService) ApproveTopup(ctx context.Context, id uuid.UUID, req ApproveTopupRequest) error {
	topup, err := s.walletRepo.FindTopupRequest(ctx, id)
	if err != nil {
		return err
	}
	if topup.Status != entity.PaymentStatusPending {
		return entity.ErrConflict
	}

	status := entity.PaymentStatusPaid
	if err := s.walletRepo.UpdateTopupRequest(ctx, id, status, req.AdminNote); err != nil {
		return err
	}

	// Add credits to user wallet (1 Credit = Rp 1.000)
	if err := s.walletRepo.AddCredits(ctx, topup.UserID, topup.Credits); err != nil {
		return fmt.Errorf("admin: add credits: %w", err)
	}

	// Record transaction.
	tx := &entity.CreditTransaction{
		ID:          uuid.New(),
		UserID:      topup.UserID,
		Type:        entity.CreditTransactionTopup,
		Credits:     topup.Credits,
		IDRAmount:   topup.AmountIDR,
		ReferenceID: &id,
		Description: "Manual QRIS top-up (approved)",
	}
	if err := s.walletRepo.CreateTransaction(ctx, tx); err != nil {
		fmt.Printf("admin: create topup transaction record: %v\n", err)
	}

	// Notify user.
	notif := entity.Notification{
		ID:     uuid.New(),
		UserID: topup.UserID,
		Type:   entity.NotificationCreditTopupDone,
		Title:  "Top-up Berhasil",
		Body:   fmt.Sprintf("Top-up Rp %d berhasil, saldo bertambah %d credit.", topup.AmountIDR, topup.Credits),
	}
	if err := s.followRepo.CreateNotification(ctx, &notif); err != nil {
		fmt.Printf("admin: create topup notification: %v\n", err)
	}

	// Send email
	if user, err := s.userRepo.FindByID(ctx, topup.UserID); err == nil {
		go s.mailer.SendTopupApproved(ctx, user.Email, topup.Credits)
	}

	return nil
}

func (s *adminService) RejectTopup(ctx context.Context, id uuid.UUID, adminNote *string) error {
	topup, err := s.walletRepo.FindTopupRequest(ctx, id)
	if err != nil { return err }
	status := entity.PaymentStatusFailed
	if err := s.walletRepo.UpdateTopupRequest(ctx, id, status, adminNote); err != nil { return err }
	if user, err := s.userRepo.FindByID(ctx, topup.UserID); err == nil {
		reason := "Tidak memenuhi syarat"
		if adminNote != nil { reason = *adminNote }
		go s.mailer.SendTopupRejected(ctx, user.Email, reason)
	}
	return nil
}

// ---- Posts & Products ----

func (s *adminService) ListAllPosts(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Post, *uuid.UUID, error) {
	posts, err := s.postRepo.ListAll(ctx, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(posts) > limit {
		next = &posts[limit].ID
		posts = posts[:limit]
	}
	return posts, next, nil
}

func (s *adminService) DeletePost(ctx context.Context, postID uuid.UUID) error {
	return s.postRepo.SoftDelete(ctx, postID)
}

func (s *adminService) ListAllProducts(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Product, *uuid.UUID, error) {
	products, err := s.productRepo.ListAll(ctx, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(products) > limit {
		next = &products[limit].ID
		products = products[:limit]
	}
	return products, next, nil
}

func (s *adminService) DeleteProduct(ctx context.Context, productID uuid.UUID) error {
	return s.productRepo.SoftDelete(ctx, productID)
}

func (s *adminService) ListAllDonations(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Donation, *uuid.UUID, error) {
	items, err := s.donationRepo.ListAll(ctx, cursor, limit+1)
	if err != nil { return nil, nil, err }
	var next *uuid.UUID
	if len(items) > limit { next = &items[limit].ID; items = items[:limit] }
	return items, next, nil
}

// ---- Payments ----

func (s *adminService) ListPayments(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Payment, *uuid.UUID, error) {
	payments, err := s.paymentRepo.List(ctx, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(payments) > limit {
		next = &payments[limit].ID
		payments = payments[:limit]
	}
	return payments, next, nil
}

func (s *adminService) RefundPayment(ctx context.Context, id uuid.UUID, adminNote string) error {
	payment, err := s.paymentRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if payment.Status != entity.PaymentStatusPaid {
		return entity.ErrConflict
	}

	// Update payment status to refunded
	if err := s.paymentRepo.UpdateStatus(ctx, id, entity.PaymentStatusRefunded, nil); err != nil {
		return err
	}

	// Refund credits to buyer if paid via credits
	if payment.Provider == entity.PaymentProviderCredits && payment.PayerID != nil {
		settings, _ := s.platformRepo.GetSettings(ctx)
		rate := settings.CreditRateIDR
		if rate <= 0 { rate = 1000 } // 4.24: div-by-zero guard
		creditsToRefund := payment.AmountIDR / rate
		_ = s.walletRepo.AddCredits(ctx, *payment.PayerID, creditsToRefund)
		_ = s.walletRepo.CreateTransaction(ctx, &entity.CreditTransaction{
			ID: uuid.New(), UserID: *payment.PayerID, Type: entity.CreditTransactionRefund,
			Credits: creditsToRefund, IDRAmount: payment.AmountIDR, PaymentID: &id,
			Description: fmt.Sprintf("Refund: %s", adminNote),
		})
		_ = s.followRepo.CreateNotification(ctx, &entity.Notification{
			ID: uuid.New(), UserID: *payment.PayerID, Type: entity.NotificationPurchaseSuccess,
			Title: "Refund Diterima", Body: fmt.Sprintf("%d credit dikembalikan.", creditsToRefund),
		})
	}

	// Deduct from creator + revoke access
	settings, _ := s.platformRepo.GetSettings(ctx)
	rate := settings.CreditRateIDR
	if rate <= 0 { rate = 1000 }

	switch payment.Usecase {
	case entity.PaymentUsecasePostPurchase:
		if post, err := s.postRepo.FindByID(ctx, payment.ReferenceID); err == nil {
			_ = s.walletRepo.DeductCredits(ctx, post.CreatorID, payment.NetAmountIDR/rate)
			// 4.20: Delete purchase record to revoke access
			s.postRepo.DeletePurchase(ctx, payment.ReferenceID, *payment.PayerID)
			if p, err := s.userRepo.FindCreatorByUserID(ctx, post.CreatorID); err == nil {
				p.TotalEarnings -= payment.NetAmountIDR; p.Tier = nil; _ = s.userRepo.UpdateCreatorProfile(ctx, p)
			}
		}
	case entity.PaymentUsecaseProductPurchase:
		if product, err := s.productRepo.FindByID(ctx, payment.ReferenceID); err == nil {
			_ = s.walletRepo.DeductCredits(ctx, product.CreatorID, payment.NetAmountIDR/rate)
			// 4.21: Delete purchase record
			s.productRepo.DeletePurchase(ctx, payment.ReferenceID, *payment.PayerID)
			if p, err := s.userRepo.FindCreatorByUserID(ctx, product.CreatorID); err == nil {
				p.TotalEarnings -= payment.NetAmountIDR; p.Tier = nil; _ = s.userRepo.UpdateCreatorProfile(ctx, p)
			}
		}
	case entity.PaymentUsecaseDonation:
		// 4.22: Deduct donation from creator
		if donation, err := s.donationRepo.FindByID(ctx, payment.ReferenceID); err == nil {
			_ = s.walletRepo.DeductCredits(ctx, donation.CreatorID, payment.NetAmountIDR/rate)
			if p, err := s.userRepo.FindCreatorByUserID(ctx, donation.CreatorID); err == nil {
				p.TotalEarnings -= payment.NetAmountIDR; p.Tier = nil; _ = s.userRepo.UpdateCreatorProfile(ctx, p)
			}
		}
	}

	return nil
}

func (s *adminService) UpdatePayment(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, adminNote string) error {
	return s.paymentRepo.UpdateStatus(ctx, id, status, nil)
}

// ---- Settings ----

func (s *adminService) GetSettings(ctx context.Context) (*entity.PlatformSetting, error) {
	return s.platformRepo.GetSettings(ctx)
}

func (s *adminService) UpdateSettings(ctx context.Context, req UpdatePlatformSettingsRequest) (*entity.PlatformSetting, error) {
	settings, err := s.platformRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	if req.FeePercent != nil {
		settings.FeePercent = *req.FeePercent
	}
	if req.MinWithdrawalIDR != nil {
		settings.MinWithdrawalIDR = *req.MinWithdrawalIDR
	}
	if req.CreditRateIDR != nil {
		settings.CreditRateIDR = *req.CreditRateIDR
	}
	if req.PlatformQRISURL != nil {
		settings.PlatformQRISURL = req.PlatformQRISURL
	}
	if err := s.platformRepo.UpdateSettings(ctx, settings); err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *adminService) CreateProfitWithdrawal(ctx context.Context, w *entity.PlatformWithdrawal) error {
	w.ID = uuid.New()
	return s.platformRepo.CreatePlatformWithdrawal(ctx, w)
}

func (s *adminService) GetAnalytics(ctx context.Context) (map[string]interface{}, error) {
	counts, err := s.userRepo.GetAnalyticsCounts(ctx)
	if err != nil { return nil, err }
	result := make(map[string]interface{})
	for k, v := range counts { result[k] = v }
	return result, nil
}

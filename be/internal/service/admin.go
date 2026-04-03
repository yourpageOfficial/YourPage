package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
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

func (s *adminService) BanUser(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	user.IsBanned = true
	return s.userRepo.Update(ctx, user)
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
	// Get KYC to find user_id before updating
	kycs, _ := s.kycRepo.ListKYC(ctx, "", nil, 10000)
	var userID uuid.UUID
	for _, k := range kycs {
		if k.ID == id { userID = k.UserID; break }
	}

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

	return nil
}

func (s *adminService) RejectTopup(ctx context.Context, id uuid.UUID, adminNote *string) error {
	status := entity.PaymentStatusFailed
	return s.walletRepo.UpdateTopupRequest(ctx, id, status, adminNote)
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
		creditsToRefund := payment.AmountIDR / settings.CreditRateIDR
		if err := s.walletRepo.AddCredits(ctx, *payment.PayerID, creditsToRefund); err != nil {
			return err
		}

		// Record refund transaction
		tx := &entity.CreditTransaction{
			ID:          uuid.New(),
			UserID:      *payment.PayerID,
			Type:        entity.CreditTransactionRefund,
			Credits:     creditsToRefund,
			IDRAmount:   payment.AmountIDR,
			PaymentID:   &id,
			Description: fmt.Sprintf("Refund: %s", adminNote),
		}
		_ = s.walletRepo.CreateTransaction(ctx, tx)

		// Notify buyer
		notif := entity.Notification{
			ID:     uuid.New(),
			UserID: *payment.PayerID,
			Type:   entity.NotificationPurchaseSuccess,
			Title:  "Refund Diterima",
			Body:   fmt.Sprintf("Transaksi Rp %d telah di-refund. %d credit dikembalikan.", payment.AmountIDR, creditsToRefund),
		}
		_ = s.followRepo.CreateNotification(ctx, &notif)
	}

	// Deduct from creator balance
	if payment.Usecase != entity.PaymentUsecaseCreditTopup {
		// Find creator from reference
		switch payment.Usecase {
		case entity.PaymentUsecasePostPurchase:
			post, err := s.postRepo.FindByID(ctx, payment.ReferenceID)
			if err == nil {
				_ = s.walletRepo.DeductCredits(ctx, post.CreatorID, payment.NetAmountIDR/1000)
				if p, err := s.userRepo.FindCreatorByUserID(ctx, post.CreatorID); err == nil {
					p.TotalEarnings -= payment.NetAmountIDR; p.Tier = nil; _ = s.userRepo.UpdateCreatorProfile(ctx, p)
				}
			}
		case entity.PaymentUsecaseProductPurchase:
			product, err := s.productRepo.FindByID(ctx, payment.ReferenceID)
			if err == nil {
				_ = s.walletRepo.DeductCredits(ctx, product.CreatorID, payment.NetAmountIDR/1000)
				if p, err := s.userRepo.FindCreatorByUserID(ctx, product.CreatorID); err == nil {
					p.TotalEarnings -= payment.NetAmountIDR; p.Tier = nil; _ = s.userRepo.UpdateCreatorProfile(ctx, p)
				}
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
	result := make(map[string]interface{})

	// We need direct DB access — use userRepo's underlying queries via GORM
	// For now, use the repos we have

	// User counts by role
	allUsers, _ := s.userRepo.List(ctx, "", nil, 10000)
	creators := 0; supporters := 0; admins := 0; banned := 0
	for _, u := range allUsers {
		switch u.Role {
		case "creator": creators++
		case "supporter": supporters++
		case "admin": admins++
		}
		if u.IsBanned { banned++ }
	}
	result["total_users"] = len(allUsers)
	result["total_creators"] = creators
	result["total_supporters"] = supporters
	result["total_admins"] = admins
	result["total_banned"] = banned

	// Payment stats
	payments, _ := s.paymentRepo.List(ctx, nil, 10000)
	var gmv, revenue, paidCount, pendingCount, failedCount, refundedCount int64
	for _, p := range payments {
		switch p.Status {
		case "paid":
			gmv += p.AmountIDR
			revenue += p.FeeIDR
			paidCount++
		case "pending": pendingCount++
		case "failed": failedCount++
		case "refunded": refundedCount++
		}
	}
	result["total_payments"] = len(payments)
	result["gmv"] = gmv
	result["revenue"] = revenue
	result["paid_count"] = paidCount
	result["pending_count"] = pendingCount
	result["failed_count"] = failedCount
	result["refunded_count"] = refundedCount

	// Donation stats
	donations, _ := s.donationRepo.ListAll(ctx, nil, 10000)
	var totalDonations int64
	for _, d := range donations {
		if d.Status == "paid" { totalDonations += d.AmountIDR }
	}
	result["total_donations_count"] = len(donations)
	result["total_donations_amount"] = totalDonations

	// Post & product counts
	posts, _ := s.postRepo.ListAll(ctx, nil, 10000)
	products, _ := s.productRepo.ListAll(ctx, nil, 10000)
	result["total_posts"] = len(posts)
	result["total_products"] = len(products)

	// Withdrawal stats
	withdrawals, _ := s.withdrawalRepo.ListAll(ctx, "", nil, 10000)
	var wdPending, wdProcessed, wdTotal int64
	for _, w := range withdrawals {
		switch w.Status {
		case "pending": wdPending++
		case "processed": wdProcessed++; wdTotal += w.AmountIDR
		case "approved": wdTotal += w.AmountIDR
		}
	}
	result["total_withdrawals"] = len(withdrawals)
	result["withdrawals_pending"] = wdPending
	result["withdrawals_processed_amount"] = wdTotal

	// KYC stats
	kycs, _ := s.kycRepo.ListKYC(ctx, "", nil, 10000)
	kycPending := 0
	for _, k := range kycs {
		if k.Status == "pending" { kycPending++ }
	}
	result["total_kyc"] = len(kycs)
	result["kyc_pending"] = kycPending

	// Report stats
	reports, _ := s.kycRepo.ListReports(ctx, "", nil, 10000)
	reportPending := 0
	for _, r := range reports {
		if r.Status == "pending" { reportPending++ }
	}
	result["total_reports"] = len(reports)
	result["reports_pending"] = reportPending

	// Platform profit withdrawals
	pws, _ := s.platformRepo.ListPlatformWithdrawals(ctx)
	var totalProfitWithdrawn int64
	for _, pw := range pws { totalProfitWithdrawn += pw.AmountIDR }
	result["platform_withdrawals"] = pws
	result["profit_withdrawn"] = totalProfitWithdrawn
	result["profit_available"] = revenue - totalProfitWithdrawn

	return result, nil
}

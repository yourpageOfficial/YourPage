package handler

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"strings"
	"time"

	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
)

type AdminHandler struct {
	svc      service.AdminService
	validate *validator.Validator
	storage  storage.StorageService
	cfg      *config.Config
}

func NewAdminHandler(svc service.AdminService, storageSvc storage.StorageService, cfg *config.Config) *AdminHandler {
	return &AdminHandler{svc: svc, validate: validator.New(), storage: storageSvc, cfg: cfg}
}

// ---- middleware ----

func (h *AdminHandler) RequireAdmin(c *gin.Context) {
	role := getUserRole(c)
	if role != entity.RoleAdmin && role != entity.RoleFinance {
		response.Forbidden(c)
		c.Abort()
		return
	}
	c.Next()
}

func (h *AdminHandler) RequireAdminOnly(c *gin.Context) {
	role := getUserRole(c)
	if role != entity.RoleAdmin {
		response.Forbidden(c)
		c.Abort()
		return
	}
	c.Next()
}

// ---- Users ----

func (h *AdminHandler) ListUsers(c *gin.Context) {
	cursor, limit := parsePagination(c)
	role := c.Query("role")
	users, next, err := h.svc.ListUsers(c.Request.Context(), role, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, users, uuidToString(next))
}

func (h *AdminHandler) CreateFinanceUser(c *gin.Context) {
	var body struct {
		Email       string `json:"email" validate:"required,email"`
		Password    string `json:"password" validate:"required,min=8"`
		DisplayName string `json:"display_name" validate:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil { response.BadRequest(c, "invalid body"); return }
	if errs := h.validate.Validate(body); errs != nil { response.BadRequest(c, formatValidationErrors(errs)); return }
	if err := h.svc.CreateFinanceUser(c.Request.Context(), body.Email, body.Password, body.DisplayName); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "finance user created")
}

func (h *AdminHandler) BanUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}
	if err := h.svc.BanUser(c.Request.Context(), id); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "user banned")
}

func (h *AdminHandler) VerifyCreator(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid user id"); return }
	if err := h.svc.VerifyCreator(c.Request.Context(), id); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "verification toggled")
}

func (h *AdminHandler) SetCreatorPromo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid user id"); return }
	var body struct {
		PromoFeePercent *int   `json:"promo_fee_percent"`
		PromoDays       int    `json:"promo_days"`
		Featured        bool   `json:"featured"`
		Note            string `json:"note"`
	}
	if err := c.ShouldBindJSON(&body); err != nil { response.BadRequest(c, "invalid body"); return }
	if err := h.svc.SetCreatorPromo(c.Request.Context(), id, body.PromoFeePercent, body.PromoDays, body.Featured, body.Note); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "promo updated")
}

func (h *AdminHandler) UnbanUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}
	if err := h.svc.UnbanUser(c.Request.Context(), id); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "user unbanned")
}

// ---- Withdrawals ----

func (h *AdminHandler) ListWithdrawals(c *gin.Context) {
	cursor, limit := parsePagination(c)
	status := c.Query("status")
	items, next, err := h.svc.ListWithdrawals(c.Request.Context(), status, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, items, uuidToString(next))
}

func (h *AdminHandler) UpdateWithdrawalStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid withdrawal id")
		return
	}
	var req service.UpdateWithdrawalStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := h.svc.UpdateWithdrawalStatus(c.Request.Context(), id, req); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "withdrawal status updated")
}

// ---- KYC ----

// kycReviewItem carries the signed document link deliberately. UserKYC keeps
// KTPImageURL as json:"-" so it can never be serialised by accident elsewhere.
type kycReviewItem struct {
	entity.UserKYC
	KTPImageURL string `json:"ktp_image_url,omitempty"`
}

func (h *AdminHandler) ListKYC(c *gin.Context) {
	cursor, limit := parsePagination(c)
	status := c.Query("status")
	items, next, err := h.svc.ListKYC(c.Request.Context(), status, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	// Sign any private KYC images for admin viewing
	for i := range items {
		if strings.Contains(items[i].KTPImageURL, "private-media") || strings.HasPrefix(items[i].KTPImageURL, "/storage/private-media/") || strings.HasPrefix(items[i].KTPImageURL, "kyc/") {
			if signed, err := h.storage.GetPresignedURL(c.Request.Context(), h.cfg.MinIO.PrivateBucket, items[i].KTPImageURL, 30*time.Minute); err == nil {
				items[i].KTPImageURL = signed
			}
		}
	}
	response.Paginated(c, items, uuidToString(next))
	out := make([]kycReviewItem, 0, len(items))
	for _, it := range items {
		out = append(out, kycReviewItem{UserKYC: it, KTPImageURL: it.KTPImageURL})
	}
	response.Paginated(c, out, uuidToString(next))
}

func (h *AdminHandler) UpdateKYCStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid kyc id")
		return
	}
	var req service.UpdateKYCStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := h.svc.UpdateKYCStatus(c.Request.Context(), id, req); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "kyc status updated")
}

// ---- Reports ----

func (h *AdminHandler) ListReports(c *gin.Context) {
	cursor, limit := parsePagination(c)
	status := c.Query("status")
	items, next, err := h.svc.ListReports(c.Request.Context(), status, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, items, uuidToString(next))
}

func (h *AdminHandler) UpdateReportStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid report id")
		return
	}
	var req service.UpdateReportStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := h.svc.UpdateReportStatus(c.Request.Context(), id, req); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "report status updated")
}

// ---- Credit Topups ----

func (h *AdminHandler) ListTopupRequests(c *gin.Context) {
	cursor, limit := parsePagination(c)
	status := c.Query("status")
	items, next, err := h.svc.ListTopupRequests(c.Request.Context(), status, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, items, uuidToString(next))
}

func (h *AdminHandler) ApproveTopup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid topup id")
		return
	}
	var req service.ApproveTopupRequest
	_ = c.ShouldBindJSON(&req)
	if err := h.svc.ApproveTopup(c.Request.Context(), id, req); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "topup approved")
}

func (h *AdminHandler) RejectTopup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid topup id")
		return
	}
	var body struct {
		AdminNote *string `json:"admin_note"`
	}
	_ = c.ShouldBindJSON(&body)
	if err := h.svc.RejectTopup(c.Request.Context(), id, body.AdminNote); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "topup rejected")
}

// ---- Posts & Products ----

func (h *AdminHandler) ListAllPosts(c *gin.Context) {
	cursor, limit := parsePagination(c)
	posts, next, err := h.svc.ListAllPosts(c.Request.Context(), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, posts, uuidToString(next))
}

func (h *AdminHandler) DeletePost(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid post id")
		return
	}
	if err := h.svc.DeletePost(c.Request.Context(), id); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "post deleted")
}

func (h *AdminHandler) ListAllProducts(c *gin.Context) {
	cursor, limit := parsePagination(c)
	products, next, err := h.svc.ListAllProducts(c.Request.Context(), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, products, uuidToString(next))
}

func (h *AdminHandler) DeleteProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}
	if err := h.svc.DeleteProduct(c.Request.Context(), id); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "product deleted")
}

// ---- Payments ----

func (h *AdminHandler) ListPayments(c *gin.Context) {
	cursor, limit := parsePagination(c)
	payments, next, err := h.svc.ListPayments(c.Request.Context(), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, payments, uuidToString(next))
}

func (h *AdminHandler) RefundPayment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid payment id"); return }
	var body struct{ AdminNote string `json:"admin_note"` }
	_ = c.ShouldBindJSON(&body)
	if err := h.svc.RefundPayment(c.Request.Context(), id, body.AdminNote); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "payment refunded")
}

func (h *AdminHandler) UpdatePaymentStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid payment id"); return }
	var body struct{ Status string `json:"status"`; AdminNote string `json:"admin_note"` }
	if err := c.ShouldBindJSON(&body); err != nil { response.BadRequest(c, "status required"); return }
	if err := h.svc.UpdatePayment(c.Request.Context(), id, entity.PaymentStatus(body.Status), body.AdminNote); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "payment updated")
}

// ---- Settings ----

func (h *AdminHandler) GetAnalytics(c *gin.Context) {
	data, err := h.svc.GetAnalytics(c.Request.Context())
	if err != nil { handleServiceError(c, err); return }
	response.OK(c, data)
}

func (h *AdminHandler) ListDonations(c *gin.Context) {
	cursor, limit := parsePagination(c)
	items, next, err := h.svc.ListAllDonations(c.Request.Context(), cursor, limit)
	if err != nil { handleServiceError(c, err); return }
	response.Paginated(c, items, uuidToString(next))
}

func (h *AdminHandler) GetProfitSummary(c *gin.Context) {
	analytics, err := h.svc.GetAnalytics(c.Request.Context())
	if err != nil { handleServiceError(c, err); return }

	// Get total already withdrawn
	var withdrawals []entity.PlatformWithdrawal
	// Use admin service to query
	totalWithdrawn := int64(0)
	if wds, ok := analytics["platform_withdrawals"].([]entity.PlatformWithdrawal); ok {
		for _, w := range wds { totalWithdrawn += w.AmountIDR }
		withdrawals = wds
	}

	revenue, _ := analytics["revenue"].(int64)
	available := revenue - totalWithdrawn

	response.OK(c, gin.H{
		"total_revenue":   revenue,
		"total_withdrawn": totalWithdrawn,
		"available":       available,
		"withdrawals":     withdrawals,
	})
}

func (h *AdminHandler) CreateProfitWithdrawal(c *gin.Context) {
	var body struct {
		AmountIDR     int64  `json:"amount_idr" validate:"required,min=1"`
		BankName      string `json:"bank_name" validate:"required"`
		AccountNumber string `json:"account_number" validate:"required"`
		AccountName   string `json:"account_name" validate:"required"`
		Note          string `json:"note"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "Data tidak lengkap")
		return
	}

	w := &entity.PlatformWithdrawal{
		AdminID:       getUserID(c),
		AmountIDR:     body.AmountIDR,
		BankName:      body.BankName,
		AccountNumber: body.AccountNumber,
		AccountName:   body.AccountName,
	}
	if body.Note != "" { w.Note = &body.Note }

	if err := h.svc.CreateProfitWithdrawal(c.Request.Context(), w); err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, w)
}

func (h *AdminHandler) ExportPayments(c *gin.Context) {
	payments, _, _ := h.svc.ListPayments(c.Request.Context(), nil, 10000)
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=payments.csv")
	c.Writer.WriteString("id,provider,usecase,amount_idr,fee_idr,net_amount_idr,status,unique_code,created_at\n")
	for _, p := range payments {
		c.Writer.WriteString(fmt.Sprintf("%s,%s,%s,%d,%d,%d,%s,%d,%s\n",
			p.ID, p.Provider, p.Usecase, p.AmountIDR, p.FeeIDR, p.NetAmountIDR, p.Status, p.UniqueCode, p.CreatedAt.Format("2006-01-02 15:04:05")))
	}
}

// maskSecret keeps only the last 4 chars so admins can recognize a stored key
// without the API ever returning the full secret.
func maskSecret(s string) string {
	if s == "" {
		return ""
	}
	if len(s) <= 4 {
		return "••••"
	}
	return "••••••••" + s[len(s)-4:]
}

// settingsResponse is the only shape in which platform settings leave the API.
// The secret fields on entity.PlatformSetting are json:"-", so they can only
// ever be exposed deliberately, in masked form, through this DTO.
type settingsResponse struct {
	*entity.PlatformSetting
	StripeSecretKeyMasked     string `json:"stripe_secret_key"`
	StripeWebhookSecretMasked string `json:"stripe_webhook_secret"`
}

func maskedSettings(s *entity.PlatformSetting) settingsResponse {
	return settingsResponse{
		PlatformSetting:           s,
		StripeSecretKeyMasked:     maskSecret(s.StripeSecretKey),
		StripeWebhookSecretMasked: maskSecret(s.StripeWebhookSecret),
	}
}

func (h *AdminHandler) GetSettings(c *gin.Context) {
	settings, err := h.svc.GetSettings(c.Request.Context())
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, maskedSettings(settings))
}

func (h *AdminHandler) UpdateSettings(c *gin.Context) {
	var req service.UpdatePlatformSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	settings, err := h.svc.UpdateSettings(c.Request.Context(), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, maskedSettings(settings))
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

func (h *AdminHandler) CreateAnnouncement(c *gin.Context) {
	var body struct {
		Title      string  `json:"title"       validate:"required,max=200"`
		Body       string  `json:"body"        validate:"required"`
		TargetRole string  `json:"target_role" validate:"omitempty,oneof=all creator supporter"`
		ExpiresAt  *string `json:"expires_at"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(body); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	var expiresAt *time.Time
	if body.ExpiresAt != nil && *body.ExpiresAt != "" {
		t, err := time.Parse(time.RFC3339, *body.ExpiresAt)
		if err != nil {
			response.BadRequest(c, "expires_at harus format RFC3339")
			return
		}
		expiresAt = &t
	}
	if err := h.svc.CreateAnnouncement(c.Request.Context(), getUserID(c), body.Title, body.Body, body.TargetRole, expiresAt); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "announcement created")
}

func (h *AdminHandler) ListAnnouncements(c *gin.Context) {
	items, err := h.svc.ListAllAnnouncements(c.Request.Context())
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, items)
}

func (h *AdminHandler) DeleteAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	if err := h.svc.DeleteAnnouncement(c.Request.Context(), id); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "announcement deleted")
}

// ---------------------------------------------------------------------------
// Bulk Actions
// ---------------------------------------------------------------------------

func (h *AdminHandler) BulkBanUsers(c *gin.Context) {
	var body struct {
		UserIDs []string `json:"user_ids" validate:"required,min=1,max=50"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "user_ids required")
		return
	}
	ids := parseUUIDs(body.UserIDs)
	if len(ids) == 0 {
		response.BadRequest(c, "no valid user_ids")
		return
	}
	success, failed := h.svc.BulkBanUsers(c.Request.Context(), ids)
	response.OK(c, gin.H{"success": success, "failed": failed})
}

func (h *AdminHandler) BulkUnbanUsers(c *gin.Context) {
	var body struct {
		UserIDs []string `json:"user_ids" validate:"required,min=1,max=50"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "user_ids required")
		return
	}
	ids := parseUUIDs(body.UserIDs)
	success, failed := h.svc.BulkUnbanUsers(c.Request.Context(), ids)
	response.OK(c, gin.H{"success": success, "failed": failed})
}

func (h *AdminHandler) BulkApproveWithdrawals(c *gin.Context) {
	var body struct {
		WithdrawalIDs []string `json:"withdrawal_ids" validate:"required,min=1,max=50"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "withdrawal_ids required")
		return
	}
	ids := parseUUIDs(body.WithdrawalIDs)
	success, failed := h.svc.BulkApproveWithdrawals(c.Request.Context(), ids)
	response.OK(c, gin.H{"success": success, "failed": failed})
}

func (h *AdminHandler) BulkRejectWithdrawals(c *gin.Context) {
	var body struct {
		WithdrawalIDs []string `json:"withdrawal_ids" validate:"required,min=1,max=50"`
		Note          string   `json:"note"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "withdrawal_ids required")
		return
	}
	ids := parseUUIDs(body.WithdrawalIDs)
	success, failed := h.svc.BulkRejectWithdrawals(c.Request.Context(), ids, body.Note)
	response.OK(c, gin.H{"success": success, "failed": failed})
}

// ---------------------------------------------------------------------------
// Realtime Stats
// ---------------------------------------------------------------------------

func (h *AdminHandler) GetRealtimeStats(c *gin.Context) {
	stats, err := h.svc.GetRealtimeStats(c.Request.Context())
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, stats)
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

func parseUUIDs(strs []string) []uuid.UUID {
	ids := make([]uuid.UUID, 0, len(strs))
	for _, s := range strs {
		if id, err := uuid.Parse(s); err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

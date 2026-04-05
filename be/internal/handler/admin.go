package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
)

type AdminHandler struct {
	svc      service.AdminService
	validate *validator.Validator
}

func NewAdminHandler(svc service.AdminService) *AdminHandler {
	return &AdminHandler{svc: svc, validate: validator.New()}
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

func (h *AdminHandler) ListKYC(c *gin.Context) {
	cursor, limit := parsePagination(c)
	status := c.Query("status")
	items, next, err := h.svc.ListKYC(c.Request.Context(), status, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, items, uuidToString(next))
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

	revenue := analytics["revenue"].(int64)
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

func (h *AdminHandler) GetSettings(c *gin.Context) {
	settings, err := h.svc.GetSettings(c.Request.Context())
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, settings)
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
	response.OK(c, settings)
}

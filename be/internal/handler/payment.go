package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
	"github.com/yourpage/be/internal/service"
)

type PaymentHandler struct {
	svc      service.PaymentService
	userRepo repository.UserRepository
	validate *validator.Validator
}

func NewPaymentHandler(svc service.PaymentService, userRepo repository.UserRepository) *PaymentHandler {
	return &PaymentHandler{svc: svc, userRepo: userRepo, validate: validator.New()}
}

func (h *PaymentHandler) CheckoutPost(c *gin.Context) {
	var req service.CheckoutPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	resp, err := h.svc.CheckoutPost(c.Request.Context(), getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, resp)
}

func (h *PaymentHandler) CheckoutProduct(c *gin.Context) {
	var req service.CheckoutProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	resp, err := h.svc.CheckoutProduct(c.Request.Context(), getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, resp)
}

func (h *PaymentHandler) CheckoutDonation(c *gin.Context) {
	var req service.CheckoutDonationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	resp, err := h.svc.CheckoutDonation(c.Request.Context(), getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, resp)
}

func (h *PaymentHandler) ListCreatorSales(c *gin.Context) {
	cursor, limit := parsePagination(c)
	sales, next, err := h.svc.ListCreatorSales(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil { handleServiceError(c, err); return }
	response.Paginated(c, sales, uuidToString(next))
}

func (h *PaymentHandler) ExportCreatorSales(c *gin.Context) {
	// Business tier only
	cp, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), getUserID(c))
	if err != nil || cp.Tier == nil || cp.Tier.Name != "Business" {
		response.Forbidden(c); return
	}
	sales, _, _ := h.svc.ListCreatorSales(c.Request.Context(), getUserID(c), nil, 10000)
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=sales.csv")
	c.Writer.WriteString("id,usecase,amount_idr,fee_idr,net_amount_idr,status,created_at\n")
	for _, s := range sales {
		c.Writer.WriteString(fmt.Sprintf("%s,%s,%d,%d,%d,%s,%s\n",
			s.ID, s.Usecase, s.AmountIDR, s.FeeIDR, s.NetAmountIDR, s.Status, s.CreatedAt.Format("2006-01-02 15:04:05")))
	}
}

func (h *PaymentHandler) ListMyTransactions(c *gin.Context) {
	cursor, limit := parsePagination(c)
	txs, next, err := h.svc.ListMyTransactions(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil { handleServiceError(c, err); return }
	response.Paginated(c, txs, uuidToString(next))
}

func (h *PaymentHandler) GetStatus(c *gin.Context) {
	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid payment id")
		return
	}
	payment, err := h.svc.GetPaymentStatus(c.Request.Context(), paymentID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, payment)
}

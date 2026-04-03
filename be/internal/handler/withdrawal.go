package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
)

type WithdrawalHandler struct {
	svc      service.WithdrawalService
	validate *validator.Validator
}

func NewWithdrawalHandler(svc service.WithdrawalService) *WithdrawalHandler {
	return &WithdrawalHandler{svc: svc, validate: validator.New()}
}

func (h *WithdrawalHandler) Create(c *gin.Context) {
	var req service.CreateWithdrawalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	w, err := h.svc.Create(c.Request.Context(), getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, w)
}

func (h *WithdrawalHandler) ListMine(c *gin.Context) {
	cursor, limit := parsePagination(c)
	items, next, err := h.svc.ListByCreator(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, items, uuidToString(next))
}

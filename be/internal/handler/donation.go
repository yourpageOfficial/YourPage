package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
)

type DonationHandler struct {
	svc      service.DonationService
	validate *validator.Validator
}

func NewDonationHandler(svc service.DonationService) *DonationHandler {
	return &DonationHandler{svc: svc, validate: validator.New()}
}

func (h *DonationHandler) Create(c *gin.Context) {
	var req service.CreateDonationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	supporterID := optionalUserID(c)
	donation, err := h.svc.Create(c.Request.Context(), supporterID, req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, donation)
}

func (h *DonationHandler) ListByCreator(c *gin.Context) {
	creatorID := getUserID(c) // QA-2: use auth user, not URL param
	cursor, limit := parsePagination(c)
	donations, next, err := h.svc.ListByCreator(c.Request.Context(), creatorID, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, donations, uuidToString(next))
}

func (h *DonationHandler) ListMySent(c *gin.Context) {
	cursor, limit := parsePagination(c)
	donations, next, err := h.svc.ListBySupporter(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, donations, uuidToString(next))
}

func (h *DonationHandler) GetLatest(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil { response.BadRequest(c, "invalid creator id"); return }
	donation, err := h.svc.GetLatestDonation(c.Request.Context(), creatorID)
	if err != nil { response.OK(c, nil); return }
	response.OK(c, donation)
}

func (h *DonationHandler) GetTopSupporters(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil { response.BadRequest(c, "invalid creator id"); return }
	top, err := h.svc.GetTopSupporters(c.Request.Context(), creatorID)
	if err != nil { response.OK(c, []interface{}{}); return }
	response.OK(c, top)
}

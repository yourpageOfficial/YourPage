package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
)

type OverlayHandler struct {
	userRepo repository.UserRepository
	validate *validator.Validator
}

func NewOverlayHandler(userRepo repository.UserRepository) *OverlayHandler {
	return &OverlayHandler{userRepo: userRepo, validate: validator.New()}
}

type createOverlayTierRequest struct {
	MinCredits int     `json:"min_credits" validate:"required,min=1"`
	ImageURL   string  `json:"image_url" validate:"required,url"`
	SoundURL   *string `json:"sound_url" validate:"omitempty,url"`
	Label      *string `json:"label" validate:"omitempty,max=100"`
}

func (h *OverlayHandler) ListTiers(c *gin.Context) {
	cid, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	tiers, _ := h.userRepo.ListOverlayTiers(c.Request.Context(), cid)
	overlayStyle := "bounce"
	overlayTextTemplate := "{donor} donated {amount} Credit!"
	if profile, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), cid); err == nil {
		if profile.OverlayStyle != "" {
			overlayStyle = profile.OverlayStyle
		}
		if profile.OverlayTextTemplate != "" {
			overlayTextTemplate = profile.OverlayTextTemplate
		}
	}
	c.JSON(200, gin.H{"success": true, "data": tiers, "overlay_style": overlayStyle, "overlay_text_template": overlayTextTemplate})
}

func (h *OverlayHandler) CreateTier(c *gin.Context) {
	var req createOverlayTierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	uid := getUserID(c)
	existing, _ := h.userRepo.ListOverlayTiers(c.Request.Context(), uid)
	cp, _ := h.userRepo.FindCreatorByUserID(c.Request.Context(), uid)
	maxTiers := 3
	if cp != nil && cp.Tier != nil {
		maxTiers = cp.Tier.MaxOverlayTiers
	}
	if maxTiers > 0 && len(existing) >= maxTiers {
		response.UnprocessableEntity(c, fmt.Sprintf("Batas overlay tier untuk tier kamu adalah %d. Upgrade untuk menambah.", maxTiers))
		return
	}
	t := &entity.OverlayTier{ID: uuid.New(), CreatorID: uid, MinCredits: req.MinCredits, ImageURL: req.ImageURL, SoundURL: req.SoundURL, Label: req.Label}
	if err := h.userRepo.CreateOverlayTier(c.Request.Context(), t); err != nil {
		response.InternalError(c)
		return
	}
	response.Created(c, t)
}

func (h *OverlayHandler) DeleteTier(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	if err := h.userRepo.DeleteOverlayTier(c.Request.Context(), id, getUserID(c)); err != nil {
		response.NotFound(c, "Tier tidak ditemukan")
		return
	}
	response.OKMessage(c, "deleted")
}

package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
)

type LeaderboardHandler struct {
	donationRepo repository.DonationRepository
	userRepo     repository.UserRepository
	validate     *validator.Validator
}

func NewLeaderboardHandler(dr repository.DonationRepository, ur repository.UserRepository) *LeaderboardHandler {
	return &LeaderboardHandler{donationRepo: dr, userRepo: ur, validate: validator.New()}
}

// GetPublic returns the leaderboard for OBS overlay / creator page.
// GET /leaderboard/:creatorId
func (h *LeaderboardHandler) GetPublic(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}

	settings, err := h.donationRepo.GetLeaderboardSettings(c.Request.Context(), creatorID)
	if err != nil {
		response.InternalError(c)
		return
	}

	if !settings.IsEnabled {
		response.OK(c, gin.H{"entries": []entity.LeaderboardEntry{}, "settings": settings})
		return
	}

	entries, err := h.donationRepo.GetLeaderboard(c.Request.Context(), creatorID, settings.Period, settings.MaxEntries)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"entries":  entries,
		"settings": settings,
	})
}

// GetSettings returns leaderboard settings for the authenticated creator.
// GET /leaderboard/:creatorId/settings
func (h *LeaderboardHandler) GetSettings(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}

	// Ownership check
	userID := getUserID(c)
	cp, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), userID)
	if err != nil || cp.UserID != userID {
		response.Forbidden(c)
		return
	}
	if cp.ID != creatorID && cp.UserID != creatorID {
		response.Forbidden(c)
		return
	}

	settings, err := h.donationRepo.GetLeaderboardSettings(c.Request.Context(), creatorID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, settings)
}

type upsertLeaderboardRequest struct {
	IsEnabled  *bool   `json:"is_enabled"`
	Period     *string `json:"period" validate:"omitempty,oneof=all_time monthly weekly"`
	MaxEntries *int    `json:"max_entries" validate:"omitempty,min=1,max=50"`
	ShowAmount *bool   `json:"show_amount"`
	Title      *string `json:"title" validate:"omitempty,max=100"`
}

// UpsertSettings updates leaderboard display settings.
// PUT /leaderboard/:creatorId/settings
func (h *LeaderboardHandler) UpsertSettings(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}

	var req upsertLeaderboardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}

	// Load existing or use defaults
	settings, _ := h.donationRepo.GetLeaderboardSettings(c.Request.Context(), creatorID)
	if settings == nil {
		settings = &entity.LeaderboardSettings{CreatorID: creatorID}
	}
	settings.CreatorID = creatorID

	if req.IsEnabled != nil {
		settings.IsEnabled = *req.IsEnabled
	}
	if req.Period != nil {
		settings.Period = *req.Period
	}
	if req.MaxEntries != nil {
		settings.MaxEntries = *req.MaxEntries
	}
	if req.ShowAmount != nil {
		settings.ShowAmount = *req.ShowAmount
	}
	if req.Title != nil {
		settings.Title = *req.Title
	}

	if err := h.donationRepo.UpsertLeaderboardSettings(c.Request.Context(), settings); err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, settings)
}

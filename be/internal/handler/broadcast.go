package handler

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type BroadcastHandler struct {
	db       *gorm.DB
	userRepo repository.UserRepository
	validate *validator.Validator
}

func NewBroadcastHandler(db *gorm.DB, userRepo repository.UserRepository) *BroadcastHandler {
	return &BroadcastHandler{db: db, userRepo: userRepo, validate: validator.New()}
}

type broadcastRequest struct {
	Message string `json:"message" validate:"required,min=1,max=2000"`
}

func (h *BroadcastHandler) Send(c *gin.Context) {
	var req broadcastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "message required")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}

	uid := getUserID(c)
	cp, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), uid)
	if err != nil {
		response.NotFound(c, "not found")
		return
	}
	if cp.Tier == nil || cp.Tier.PriceIDR == 0 {
		response.Forbidden(c)
		return
	}

	// Rate limit: Pro 1x/week, Business 1x/day
	limit := 7 * 24 * time.Hour
	if cp.Tier.PriceIDR >= 149000 {
		limit = 24 * time.Hour
	}
	result := h.db.Model(&entity.CreatorProfile{}).
		Where("id = ? AND (last_broadcast_at IS NULL OR last_broadcast_at < ?)", cp.ID, time.Now().Add(-limit)).
		Update("last_broadcast_at", time.Now())
	if result.RowsAffected == 0 {
		c.JSON(429, gin.H{"success": false, "error": "rate_limited", "message": "Kamu sudah broadcast baru-baru ini. Coba lagi nanti."})
		return
	}

	// Send notifications in background with error handling, batching, and timeout
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		followers, err := h.userRepo.ListFollowerIDs(ctx, uid)
		if err != nil {
			log.Error().Err(err).Str("creator_id", uid.String()).Msg("broadcast: failed to list followers")
			return
		}
		const batchSize = 100
		for i := 0; i < len(followers); i += batchSize {
			end := i + batchSize
			if end > len(followers) {
				end = len(followers)
			}
			for _, fid := range followers[i:end] {
				if err := h.userRepo.CreateNotification(ctx, fid, "broadcast", "📢 Broadcast", req.Message, &uid); err != nil {
					log.Warn().Err(err).Str("follower_id", fid.String()).Msg("broadcast: notification failed")
				}
			}
		}
		log.Info().Str("creator_id", uid.String()).Int("followers", len(followers)).Msg("broadcast sent")
	}()

	response.OKMessage(c, "Broadcast sedang dikirim ke semua follower")
}

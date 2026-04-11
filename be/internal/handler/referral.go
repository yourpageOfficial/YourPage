package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type ReferralHandler struct {
	db       *gorm.DB
	userRepo repository.UserRepository
}

func NewReferralHandler(db *gorm.DB, userRepo repository.UserRepository) *ReferralHandler {
	return &ReferralHandler{db: db, userRepo: userRepo}
}

func (h *ReferralHandler) GetMyCode(c *gin.Context) {
	uid := getUserID(c)
	var codes []entity.ReferralCode
	h.db.Where("user_id = ?", uid).Find(&codes)
	if len(codes) == 0 {
		reward := 10
		var ps entity.PlatformSetting
		if err := h.db.First(&ps).Error; err == nil && ps.FeePercent > 0 { reward = 10 } // extensible via settings
		code := &entity.ReferralCode{ID: uuid.New(), UserID: uid, Code: uuid.NewString()[:8], RewardCredits: reward}
		h.userRepo.CreateReferralCode(c.Request.Context(), code)
		codes = append(codes, *code)
	}
	response.OK(c, codes[0])
}

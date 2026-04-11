package handler

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MembershipHandler struct {
	db       *gorm.DB
	userRepo repository.UserRepository
	validate *validator.Validator
}

func NewMembershipHandler(db *gorm.DB, userRepo repository.UserRepository) *MembershipHandler {
	return &MembershipHandler{db: db, userRepo: userRepo, validate: validator.New()}
}

type createMembershipTierRequest struct {
	Name         string  `json:"name" validate:"required,max=100"`
	PriceCredits int     `json:"price_credits" validate:"required,min=1,max=100000"`
	Description  *string `json:"description" validate:"omitempty,max=500"`
	Perks        *string `json:"perks" validate:"omitempty,max=1000"`
}

type subscribeMembershipRequest struct {
	TierID string `json:"tier_id" validate:"required,uuid"`
}

func (h *MembershipHandler) ListTiers(c *gin.Context) {
	cid, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	var tiers []entity.MembershipTier
	h.db.Where("creator_id = ?", cid).Order("sort_order").Find(&tiers)
	response.OK(c, tiers)
}

func (h *MembershipHandler) CreateTier(c *gin.Context) {
	var req createMembershipTierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	uid := getUserID(c)
	var count int64
	h.db.Model(&entity.MembershipTier{}).Where("creator_id = ?", uid).Count(&count)
	if count >= 5 {
		response.UnprocessableEntity(c, "Maksimal 5 tier membership")
		return
	}
	t := entity.MembershipTier{ID: uuid.New(), CreatorID: uid, Name: req.Name, PriceCredits: req.PriceCredits, Description: req.Description, Perks: req.Perks}
	if err := h.db.Create(&t).Error; err != nil {
		response.InternalError(c)
		return
	}
	response.Created(c, t)
}

func (h *MembershipHandler) DeleteTier(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	var memberCount int64
	h.db.Model(&entity.Membership{}).Where("tier_id = ? AND status = 'active'", id).Count(&memberCount)
	if memberCount > 0 {
		response.UnprocessableEntity(c, fmt.Sprintf("Tidak bisa hapus tier yang masih punya %d member aktif", memberCount))
		return
	}
	result := h.db.Where("id = ? AND creator_id = ?", id, getUserID(c)).Delete(&entity.MembershipTier{})
	if result.RowsAffected == 0 {
		response.NotFound(c, "Tier tidak ditemukan")
		return
	}
	response.OKMessage(c, "deleted")
}

func (h *MembershipHandler) Subscribe(c *gin.Context) {
	var req subscribeMembershipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "tier_id required")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	tierID, _ := uuid.Parse(req.TierID)
	var tier entity.MembershipTier
	if err := h.db.Where("id = ?", tierID).First(&tier).Error; err != nil {
		response.NotFound(c, "tier not found")
		return
	}
	uid := getUserID(c)
	if uid == tier.CreatorID {
		response.BadRequest(c, "Tidak bisa subscribe ke diri sendiri")
		return
	}

	// QA-16: Check existing active membership — prevent double charge
	var existingMem entity.Membership
	if err := h.db.Where("supporter_id = ? AND creator_id = ? AND status = 'active' AND expires_at > NOW()", uid, tier.CreatorID).First(&existingMem).Error; err == nil {
		response.UnprocessableEntity(c, "Kamu sudah punya membership aktif ke creator ini")
		return
	}

	// Get creator fee percent
	feePct := 20
	if profile, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), tier.CreatorID); err == nil {
		if profile.PromoFeePercent != nil && profile.PromoFeeExpiresAt != nil && profile.PromoFeeExpiresAt.After(time.Now()) {
			feePct = *profile.PromoFeePercent
		} else if profile.CustomFeePercent != nil {
			feePct = *profile.CustomFeePercent
		}
	}

	totalCredits := int64(tier.PriceCredits)
	feeCredits := totalCredits * int64(feePct) / 100
	netCredits := totalCredits - feeCredits

	// Atomic deduct from supporter
	result := h.db.Model(&entity.UserWallet{}).Where("user_id = ? AND balance_credits >= ?", uid, totalCredits).
		Update("balance_credits", gorm.Expr("balance_credits - ?", totalCredits))
	if result.RowsAffected == 0 {
		response.UnprocessableEntity(c, "Credit tidak cukup")
		return
	}

	// Log spend transaction
	var creditRate int64 = 1000
	var ps entity.PlatformSetting
	if err := h.db.First(&ps).Error; err == nil && ps.CreditRateIDR > 0 {
		creditRate = ps.CreditRateIDR
	}
	h.db.Create(&entity.CreditTransaction{ID: uuid.New(), UserID: uid, Type: "spend", Credits: -totalCredits, IDRAmount: totalCredits * creditRate, Description: fmt.Sprintf("Subscribe membership %s", tier.Name)})

	// Credit creator (net after fee)
	h.db.Exec("INSERT INTO user_wallets (user_id, balance_credits) VALUES (?, 0) ON CONFLICT (user_id) DO NOTHING", tier.CreatorID)
	h.db.Model(&entity.UserWallet{}).Where("user_id = ?", tier.CreatorID).Update("balance_credits", gorm.Expr("balance_credits + ?", netCredits))

	// Log earning transaction
	h.db.Create(&entity.CreditTransaction{ID: uuid.New(), UserID: tier.CreatorID, Type: "earning", Credits: netCredits, IDRAmount: netCredits * creditRate, Description: fmt.Sprintf("Member subscribe tier %s (fee %d%%)", tier.Name, feePct)})

	now := time.Now()
	mem := entity.Membership{ID: uuid.New(), SupporterID: uid, CreatorID: tier.CreatorID, TierID: tierID, Status: "active", StartedAt: now, ExpiresAt: now.AddDate(0, 1, 0)}
	h.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "supporter_id"}, {Name: "creator_id"}}, DoUpdates: clause.AssignmentColumns([]string{"tier_id", "status", "started_at", "expires_at"})}).Create(&mem)

	h.userRepo.CreateNotification(c.Request.Context(), tier.CreatorID, "membership", "Member Baru! ⭐", fmt.Sprintf("Seseorang subscribe tier %s (%d Credit/bulan)", tier.Name, tier.PriceCredits), nil)

	response.OK(c, gin.H{
		"membership":       mem,
		"total_credits":    totalCredits,
		"platform_fee":     feeCredits,
		"creator_receives": netCredits,
	})
}

func (h *MembershipHandler) ListMy(c *gin.Context) {
	var mems []entity.Membership
	h.db.Preload("Tier").Where("supporter_id = ? AND status = 'active'", getUserID(c)).Find(&mems)
	response.OK(c, mems)
}

func (h *MembershipHandler) ListCreatorMembers(c *gin.Context) {
	var mems []entity.Membership
	h.db.Preload("Tier").Where("creator_id = ? AND status = 'active'", getUserID(c)).Find(&mems)
	response.OK(c, mems)
}

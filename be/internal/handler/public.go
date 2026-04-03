package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/repository"
)

type PublicHandler struct {
	userRepo repository.UserRepository
}

func NewPublicHandler(userRepo repository.UserRepository) *PublicHandler {
	return &PublicHandler{userRepo: userRepo}
}

// GetCreatorPage returns the public creator profile by slug.
func (h *PublicHandler) GetCreatorPage(c *gin.Context) {
	slug := c.Param("slug")
	profile, err := h.userRepo.FindCreatorBySlug(c.Request.Context(), slug)
	if err != nil {
		response.NotFound(c, "creator not found")
		return
	}

	user, err := h.userRepo.FindByID(c.Request.Context(), profile.UserID)
	if err != nil {
		response.NotFound(c, "creator not found")
		return
	}

	tierBadge := ""
	if profile.Tier != nil { tierBadge = profile.Tier.Badge }

	response.OK(c, gin.H{
		"user_id":        user.ID,
		"username":       user.Username,
		"display_name":   user.DisplayName,
		"avatar_url":     user.AvatarURL,
		"bio":            user.Bio,
		"page_slug":      profile.PageSlug,
		"header_image":   profile.HeaderImageURL,
		"social_links":   profile.SocialLinks,
		"follower_count": profile.FollowerCount,
		"is_verified":    profile.IsVerified,
		"tier_badge":     tierBadge,
		"page_color":    profile.PageColor,
		"is_priority":    profile.Tier != nil && profile.Tier.Name == "Business",
		"chat_price_idr": profile.ChatPriceIDR,
	})
}

// GetMyEarnings returns the authenticated creator's earnings info.
func (h *PublicHandler) GetMyEarnings(c *gin.Context) {
	userID := getUserID(c)
	profile, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "creator profile not found")
		return
	}
	tierName := "Free"
	if profile.Tier != nil { tierName = profile.Tier.Name }
	feePct := 20
	if profile.PromoFeePercent != nil && profile.PromoFeeExpiresAt != nil && profile.PromoFeeExpiresAt.After(time.Now()) {
		feePct = *profile.PromoFeePercent
	} else if profile.CustomFeePercent != nil {
		feePct = *profile.CustomFeePercent
	}

	response.OK(c, gin.H{
		"total_earnings":     profile.TotalEarnings,
		"balance_idr":        0, // deprecated, use wallet
		"follower_count":     profile.FollowerCount,
		"storage_used_bytes": profile.StorageUsedBytes,
		"storage_quota_bytes": profile.StorageQuotaBytes,
		"tier_name":          tierName,
		"tier_id":            profile.TierID,
		"tier_expires_at":    profile.TierExpiresAt,
		"fee_percent":        feePct,
		"page_color":         profile.PageColor,
		"header_image":       profile.HeaderImageURL,
		"social_links":      profile.SocialLinks,
		"chat_price_idr":    profile.ChatPriceIDR,
		"auto_reply":        profile.AutoReply,
	})
}

// GetCreatorAnalytics returns advanced analytics for Pro+ creators.
func (h *PublicHandler) GetCreatorAnalytics(c *gin.Context) {
	userID := getUserID(c)
	profile, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "creator profile not found")
		return
	}

	// Gate: Pro+ only
	if profile.Tier == nil || profile.Tier.PriceIDR == 0 {
		response.Forbidden(c)
		return
	}

	// Get counts
	postCount, _ := h.userRepo.CountCreatorPosts(c.Request.Context(), userID)
	productCount, _ := h.userRepo.CountCreatorProducts(c.Request.Context(), userID)
	donationCount, totalDonations, _ := h.userRepo.CountCreatorDonations(c.Request.Context(), userID)
	salesCount, totalSales, _ := h.userRepo.CountCreatorSales(c.Request.Context(), userID)

	response.OK(c, gin.H{
		"post_count":       postCount,
		"product_count":    productCount,
		"donation_count":   donationCount,
		"total_donations":  totalDonations,
		"sales_count":      salesCount,
		"total_sales":      totalSales,
		"total_earnings":   profile.TotalEarnings,
		"balance_idr":      0, // deprecated, use wallet
		"follower_count":   profile.FollowerCount,
		"fee_percent":      profile.CustomFeePercent,
	})
}

func (h *PublicHandler) ListFeaturedCreators(c *gin.Context) {
	profiles, err := h.userRepo.ListFeaturedCreators(c.Request.Context())
	if err != nil { response.InternalError(c); return }
	var result []gin.H
	for _, p := range profiles {
		u, _ := h.userRepo.FindByID(c.Request.Context(), p.UserID)
		if u == nil { continue }
		result = append(result, gin.H{
			"user_id": u.ID, "username": u.Username, "display_name": u.DisplayName,
			"avatar_url": u.AvatarURL, "page_slug": p.PageSlug, "bio": u.Bio,
			"follower_count": p.FollowerCount, "is_verified": p.IsVerified,
		})
	}
	response.OK(c, result)
}

// SearchCreators returns a paginated list of creators matching a query.
func (h *PublicHandler) SearchCreators(c *gin.Context) {
	query := c.Query("q")
	var cursor *uuid.UUID
	if s := c.Query("cursor"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			cursor = &id
		}
	}
	limit := 20
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	profiles, err := h.userRepo.SearchCreators(c.Request.Context(), query, cursor, limit+1)
	if err != nil {
		response.InternalError(c)
		return
	}

	var nextCursor *string
	if len(profiles) > limit {
		s := profiles[limit].ID.String()
		nextCursor = &s
		profiles = profiles[:limit]
	}

	type creatorItem struct {
		UserID        uuid.UUID `json:"user_id"`
		Username      string    `json:"username"`
		DisplayName   string    `json:"display_name"`
		AvatarURL     *string   `json:"avatar_url"`
		PageSlug      string    `json:"page_slug"`
		FollowerCount int64     `json:"follower_count"`
		IsVerified    bool      `json:"is_verified"`
	}

	var items []creatorItem
	for _, p := range profiles {
		items = append(items, creatorItem{
			UserID:        p.UserID,
			Username:      p.User.Username,
			DisplayName:   p.User.DisplayName,
			AvatarURL:     p.User.AvatarURL,
			PageSlug:      p.PageSlug,
			FollowerCount: p.FollowerCount,
			IsVerified:    p.IsVerified,
		})
	}

	response.Paginated(c, items, nextCursor)
}

// CreatorRequiredMiddleware ensures the user has creator role.
func CreatorRequiredMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := getUserRole(c)
		if role != entity.RoleCreator && role != entity.RoleAdmin {
			response.Forbidden(c)
			c.Abort()
			return
		}
		c.Next()
	}
}

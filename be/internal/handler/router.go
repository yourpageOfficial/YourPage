package handler

import (
	"context"
	"fmt"
	"strings"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/handler/middleware"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"os"
	"time"
)

type Handlers struct {
	Auth       *AuthHandler
	Post       *PostHandler
	Product    *ProductHandler
	Donation   *DonationHandler
	Wallet     *WalletHandler
	Follow     *FollowHandler
	Withdrawal *WithdrawalHandler
	KYC        *KYCHandler
	Admin      *AdminHandler
	Public     *PublicHandler
	Payment    *PaymentHandler
	Webhook    *WebhookHandler
	Chat       *ChatHandler
	PlatformRepo repository.PlatformRepository
	UserRepo     repository.UserRepository
	AuditDB      *gorm.DB
}

func NewRouter(cfg *config.Config, rdb *redis.Client, h Handlers) *gin.Engine {
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.Metrics())
	r.Use(middleware.AccessLog())

	// Prometheus metrics (internal only - check header)
	r.GET("/metrics", func(c *gin.Context) {
		ip := c.ClientIP()
		// Strip IPv6-mapped prefix
		if strings.HasPrefix(ip, "::ffff:") { ip = strings.TrimPrefix(ip, "::ffff:") }
		if c.GetHeader("X-Internal") == "true" || ip == "127.0.0.1" || ip == "::1" ||
			strings.HasPrefix(ip, "172.") || strings.HasPrefix(ip, "10.") || strings.HasPrefix(ip, "192.168.") {
			promhttp.Handler().ServeHTTP(c.Writer, c.Request)
			return
		}
		c.AbortWithStatus(403)
	})

	// CORS — restrict in production
	allowedOrigins := []string{"http://localhost:3000", "http://localhost"}
	if domain := os.Getenv("DOMAIN"); domain != "" && domain != "_" {
		allowedOrigins = append(allowedOrigins, "https://"+domain, "http://"+domain)
	}
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			for _, o := range allowedOrigins {
				if o == origin { return true }
			}
			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Rate limiters
	rl := middleware.NewRateLimiter(10, 20)       // public endpoints
	authRL := middleware.NewRateLimiter(5, 10)     // auth endpoints (stricter)
	actionRL := middleware.NewRateLimiter(30, 60)  // user actions (like, comment)
	shortCache := middleware.Cache(rdb, 30*time.Second)  // 30s cache for public reads
	longCache := middleware.Cache(rdb, 300*time.Second)  // 5min cache for static data

	// Max upload size (500MB)
	r.MaxMultipartMemory = 500 << 20

	auth := middleware.AuthRequired(cfg.JWT, rdb)
	optAuth := middleware.OptionalAuth(cfg.JWT, rdb)
	creatorOnly := CreatorRequiredMiddleware()

	api := r.Group("/api/v1")

	// ---- Health ----
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// ---- Auth ----
	authG := api.Group("/auth")
	{
		authG.POST("/register", authRL.Middleware(), h.Auth.Register)
		authG.POST("/login", authRL.Middleware(), h.Auth.Login)
		authG.POST("/refresh", authRL.Middleware(), h.Auth.RefreshToken)
		authG.POST("/forgot-password", authRL.Middleware(), h.Auth.ForgotPassword)
		authG.POST("/reset-password", authRL.Middleware(), h.Auth.ResetPassword)
		authG.POST("/logout", auth, h.Auth.Logout)
		authG.GET("/me", auth, h.Auth.GetMe)
		authG.PUT("/me", auth, h.Auth.UpdateMe)
		authG.POST("/upgrade-creator", auth, h.Auth.UpgradeToCreator)
		authG.POST("/change-password", auth, h.Auth.ChangePassword)
		authG.POST("/verify-email", h.Auth.VerifyEmail)
		authG.POST("/resend-verification", auth, h.Auth.ResendVerification)
		authG.POST("/subscribe-tier", auth, creatorOnly, h.Auth.SubscribeTier)
	}

	// ---- Public creator page ----
	api.GET("/creators/search", rl.Middleware(), shortCache, h.Public.SearchCreators)
	api.GET("/creators/featured", rl.Middleware(), shortCache, h.Public.ListFeaturedCreators)
	// optAuth: inject user ID if logged in (for is_following), no shortCache since response is user-specific
	api.GET("/creators/:slug", rl.Middleware(), optAuth, h.Public.GetCreatorPage)

	// Platform QRIS (public, for topup page)
	api.GET("/platform/qris", func(c *gin.Context) {
		settings, err := h.Admin.svc.GetSettings(c.Request.Context())
		if err != nil { c.JSON(500, gin.H{"error": "internal"}); return }
		c.JSON(200, gin.H{"success": true, "data": gin.H{"platform_qris_url": settings.PlatformQRISURL}})
	})

	// ---- Posts ----
	postsG := api.Group("/posts")
	{
		postsG.GET("/:id", optAuth, shortCache, h.Post.GetByID)
		postsG.GET("/creator/:creatorId", optAuth, rl.Middleware(), shortCache, h.Post.ListByCreator)
		postsG.POST("", auth, creatorOnly, h.Post.Create)
		postsG.PUT("/:id", auth, creatorOnly, h.Post.Update)
		postsG.DELETE("/:id", auth, creatorOnly, h.Post.Delete)
		postsG.POST("/:id/media", auth, creatorOnly, h.Post.AddMedia)
		postsG.DELETE("/:id/media/:mediaId", auth, creatorOnly, h.Post.DeleteMedia)
		postsG.POST("/:id/like", auth, actionRL.Middleware(), h.Post.LikePost)
		postsG.DELETE("/:id/like", auth, actionRL.Middleware(), h.Post.UnlikePost)
		postsG.GET("/:id/comments", h.Post.ListComments)
		postsG.POST("/:id/comments", auth, actionRL.Middleware(), h.Post.CreateComment)
	}

	// ---- Feed ----
	api.GET("/feed", auth, h.Post.Feed)

	// ---- Products ----
	productsG := api.Group("/products")
	{
		productsG.GET("/:id", optAuth, shortCache, h.Product.GetByID)
		productsG.GET("/creator/:creatorId", rl.Middleware(), shortCache, h.Product.ListByCreator)
		productsG.POST("", auth, creatorOnly, h.Product.Create)
		productsG.PUT("/:id", auth, creatorOnly, h.Product.Update)
		productsG.DELETE("/:id", auth, creatorOnly, h.Product.Delete)
		productsG.POST("/:id/assets", auth, creatorOnly, h.Product.AddAsset)
		productsG.DELETE("/:id/assets/:assetId", auth, creatorOnly, h.Product.DeleteAsset)
		productsG.GET("/:id/download", auth, h.Product.GetDownloadURL)
	}

	// ---- Donations ----
	donationsG := api.Group("/donations")
	{
		donationsG.GET("/creator/:creatorId/latest", h.Donation.GetLatest)
		donationsG.GET("/creator/:creatorId/top", h.Donation.GetTopSupporters)
		donationsG.POST("", optAuth, h.Donation.Create)
		donationsG.GET("/creator/:creatorId", auth, creatorOnly, h.Donation.ListByCreator)
		donationsG.GET("/sent", auth, h.Donation.ListMySent)
	}

	// ---- Creator Earnings + Sales ----
	api.GET("/creator/earnings", auth, creatorOnly, h.Public.GetMyEarnings)
	api.GET("/creator/sales", auth, creatorOnly, h.Payment.ListCreatorSales)
	api.GET("/creator/analytics", auth, creatorOnly, h.Public.GetCreatorAnalytics)
	api.GET("/creator/sales/export", auth, creatorOnly, h.Payment.ExportCreatorSales)
	api.GET("/tiers", longCache, func(c *gin.Context) {
		tiers, err := h.PlatformRepo.ListTiers(c.Request.Context())
		if err != nil { c.JSON(500, gin.H{"error": "internal"}); return }
		c.JSON(200, gin.H{"success": true, "data": tiers})
	})

	// ---- Supporter Transactions ----
	api.GET("/my/transactions", auth, h.Payment.ListMyTransactions)

	// ---- Checkout / Payments ----
	checkoutG := api.Group("/checkout", auth)
	{
		checkoutG.POST("/post", h.Payment.CheckoutPost)
		checkoutG.POST("/product", h.Payment.CheckoutProduct)
		checkoutG.POST("/donation", h.Payment.CheckoutDonation)
	}
	api.GET("/payments/:id", auth, h.Payment.GetStatus)

	// ---- Webhooks (no auth — verified by provider token/signature) ----
	webhooks := api.Group("/webhooks")
	{
		webhooks.POST("/xendit", h.Webhook.XenditCallback)
		webhooks.POST("/paypal", h.Webhook.PayPalWebhook)
	}

	// ---- Wallet ----
	walletG := api.Group("/wallet", auth)
	{
		walletG.GET("/balance", h.Wallet.GetBalance)
		walletG.GET("/transactions", h.Wallet.ListTransactions)
		walletG.POST("/topup", h.Wallet.CreateTopup)
		walletG.POST("/topup/:id/proof", h.Wallet.UploadTopupProof)
	}

	// ---- Library (supporter purchased items) ----
	libraryG := api.Group("/library", auth)
	{
		libraryG.GET("/posts", h.Post.ListPurchased)
		libraryG.GET("/products", h.Product.ListPurchased)
	}

	// ---- Follow & Notifications ----
	followG := api.Group("/follow", auth)
	{
		followG.POST("/:creatorId", h.Follow.Follow)
		followG.DELETE("/:creatorId", h.Follow.Unfollow)
		followG.GET("/:creatorId", h.Follow.IsFollowing)
	}

	notifsG := api.Group("/notifications", auth)
	{
		notifsG.GET("", h.Follow.ListNotifications)
		notifsG.GET("/unread-count", h.Follow.CountUnread)
		notifsG.PATCH("/:id/read", h.Follow.MarkRead)
		notifsG.PATCH("/read-all", h.Follow.MarkAllRead)
	}

	// ---- Withdrawal ----
	withdrawalG := api.Group("/withdrawals", auth, creatorOnly)
	{
		withdrawalG.POST("", h.Withdrawal.Create)
		withdrawalG.GET("", h.Withdrawal.ListMine)
	}

	// ---- Overlay Tiers (public read, auth write) ----
	api.GET("/overlay-tiers/:creatorId", func(c *gin.Context) {
		cid, err := uuid.Parse(c.Param("creatorId"))
		if err != nil { c.JSON(400, gin.H{"error": "invalid id"}); return }
		tiers, _ := h.UserRepo.ListOverlayTiers(c.Request.Context(), cid)
		// Also return overlay style settings for the creator
		overlayStyle := "bounce"
		overlayTextTemplate := "{donor} donated {amount} Credit!"
		if profile, err := h.UserRepo.FindCreatorByUserID(c.Request.Context(), cid); err == nil {
			if profile.OverlayStyle != "" { overlayStyle = profile.OverlayStyle }
			if profile.OverlayTextTemplate != "" { overlayTextTemplate = profile.OverlayTextTemplate }
		}
		c.JSON(200, gin.H{"success": true, "data": tiers, "overlay_style": overlayStyle, "overlay_text_template": overlayTextTemplate})
	})
	api.POST("/overlay-tiers", auth, creatorOnly, func(c *gin.Context) {
		var body struct {
			MinCredits int     `json:"min_credits"`
			ImageURL   string  `json:"image_url"`
			SoundURL   *string `json:"sound_url"`
			Label      *string `json:"label"`
		}
		if err := c.ShouldBindJSON(&body); err != nil { c.JSON(400, gin.H{"error": "invalid body"}); return }
		uid := getUserID(c)
		// Check overlay tier limit
		existing, _ := h.UserRepo.ListOverlayTiers(c.Request.Context(), uid)
		cp, _ := h.UserRepo.FindCreatorByUserID(c.Request.Context(), uid)
		maxTiers := 3
		if cp != nil && cp.Tier != nil { maxTiers = cp.Tier.MaxOverlayTiers }
		if maxTiers > 0 && len(existing) >= maxTiers {
			c.JSON(422, gin.H{"error": fmt.Sprintf("Batas overlay tier untuk tier kamu adalah %d. Upgrade untuk menambah.", maxTiers)}); return
		}
		t := &entity.OverlayTier{ID: uuid.New(), CreatorID: uid, MinCredits: body.MinCredits, ImageURL: body.ImageURL, SoundURL: body.SoundURL, Label: body.Label}
		if err := h.UserRepo.CreateOverlayTier(c.Request.Context(), t); err != nil { c.JSON(500, gin.H{"error": "internal"}); return }
		c.JSON(201, gin.H{"success": true, "data": t})
	})
	api.DELETE("/overlay-tiers/:id", auth, creatorOnly, func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil { c.JSON(400, gin.H{"error": "invalid id"}); return }
		h.UserRepo.DeleteOverlayTier(c.Request.Context(), id, getUserID(c))
		c.JSON(200, gin.H{"success": true, "message": "deleted"})
	})

	// ---- Membership ----
	api.GET("/membership-tiers/:creatorId", func(c *gin.Context) {
		cid, err := uuid.Parse(c.Param("creatorId"))
		if err != nil { c.JSON(400, gin.H{"error": "invalid id"}); return }
		var tiers []entity.MembershipTier
		h.AuditDB.Where("creator_id = ?", cid).Order("sort_order").Find(&tiers)
		c.JSON(200, gin.H{"success": true, "data": tiers})
	})
	api.POST("/membership-tiers", auth, creatorOnly, func(c *gin.Context) {
		var body struct {
			Name string `json:"name"`; PriceCredits int `json:"price_credits"`
			Description *string `json:"description"`; Perks *string `json:"perks"`
		}
		if err := c.ShouldBindJSON(&body); err != nil || body.Name == "" || body.PriceCredits < 1 { c.JSON(400, gin.H{"error": "name and price_credits required"}); return }
		// 8.4: Limit tiers
		var count int64
		h.AuditDB.Model(&entity.MembershipTier{}).Where("creator_id = ?", getUserID(c)).Count(&count)
		if count >= 5 { c.JSON(422, gin.H{"error": "Maksimal 5 tier membership"}); return }
		t := entity.MembershipTier{ID: uuid.New(), CreatorID: getUserID(c), Name: body.Name, PriceCredits: body.PriceCredits, Description: body.Description, Perks: body.Perks}
		if err := h.AuditDB.Create(&t).Error; err != nil { c.JSON(500, gin.H{"error": "Gagal membuat tier"}); return }
		c.JSON(201, gin.H{"success": true, "data": t})
	})
	api.DELETE("/membership-tiers/:id", auth, creatorOnly, func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil { c.JSON(400, gin.H{"error": "invalid id"}); return }
		// 8.6: Check active members
		var memberCount int64
		h.AuditDB.Model(&entity.Membership{}).Where("tier_id = ? AND status = 'active'", id).Count(&memberCount)
		if memberCount > 0 { c.JSON(422, gin.H{"error": fmt.Sprintf("Tidak bisa hapus tier yang masih punya %d member aktif", memberCount)}); return }
		result := h.AuditDB.Where("id = ? AND creator_id = ?", id, getUserID(c)).Delete(&entity.MembershipTier{})
		if result.RowsAffected == 0 { c.JSON(404, gin.H{"error": "Tier tidak ditemukan"}); return }
		c.JSON(200, gin.H{"success": true})
	})
	api.POST("/memberships/subscribe", auth, func(c *gin.Context) {
		var body struct { TierID string `json:"tier_id"` }
		if err := c.ShouldBindJSON(&body); err != nil { c.JSON(400, gin.H{"error": "tier_id required"}); return }
		tierID, _ := uuid.Parse(body.TierID)
		var tier entity.MembershipTier
		if err := h.AuditDB.Where("id = ?", tierID).First(&tier).Error; err != nil { c.JSON(404, gin.H{"error": "tier not found"}); return }
		uid := getUserID(c)
		if uid == tier.CreatorID { c.JSON(400, gin.H{"error": "Tidak bisa subscribe ke diri sendiri"}); return }
		bal := int64(0)
		var w entity.UserWallet
		if err := h.AuditDB.Where("user_id = ?", uid).First(&w).Error; err == nil { bal = w.BalanceCredits }
		if bal < int64(tier.PriceCredits) { c.JSON(422, gin.H{"error": "Credit tidak cukup"}); return }
		// Deduct + create membership
		result := h.AuditDB.Model(&entity.UserWallet{}).Where("user_id = ? AND balance_credits >= ?", uid, tier.PriceCredits).Update("balance_credits", gorm.Expr("balance_credits - ?", tier.PriceCredits))
		if result.RowsAffected == 0 { c.JSON(422, gin.H{"error": "Credit tidak cukup (atomic check)"}); return }
		// Ensure creator wallet exists + credit
		h.AuditDB.Exec("INSERT INTO user_wallets (user_id, balance_credits) VALUES (?, 0) ON CONFLICT (user_id) DO NOTHING", tier.CreatorID)
		h.AuditDB.Model(&entity.UserWallet{}).Where("user_id = ?", tier.CreatorID).Update("balance_credits", gorm.Expr("balance_credits + ?", tier.PriceCredits))
		now := time.Now()
		mem := entity.Membership{ID: uuid.New(), SupporterID: uid, CreatorID: tier.CreatorID, TierID: tierID, Status: "active", StartedAt: now, ExpiresAt: now.AddDate(0, 1, 0)}
		h.AuditDB.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "supporter_id"}, {Name: "creator_id"}}, DoUpdates: clause.AssignmentColumns([]string{"tier_id", "status", "started_at", "expires_at"})}).Create(&mem)
		// 8.21: Notify creator
		h.UserRepo.CreateNotification(c.Request.Context(), tier.CreatorID, "membership", "Member Baru! ⭐", fmt.Sprintf("Seseorang subscribe tier %s (%d Credit/bulan)", tier.Name, tier.PriceCredits), nil)
		c.JSON(200, gin.H{"success": true, "data": mem})
	})
	api.GET("/memberships/my", auth, func(c *gin.Context) {
		var mems []entity.Membership
		h.AuditDB.Preload("Tier").Where("supporter_id = ? AND status = 'active'", getUserID(c)).Find(&mems)
		c.JSON(200, gin.H{"success": true, "data": mems})
	})
	api.GET("/memberships/creator", auth, creatorOnly, func(c *gin.Context) {
		var mems []entity.Membership
		h.AuditDB.Preload("Tier").Where("creator_id = ? AND status = 'active'", getUserID(c)).Find(&mems)
		c.JSON(200, gin.H{"success": true, "data": mems})
	})

	// ---- Referral ----
	api.GET("/referral", auth, func(c *gin.Context) {
		uid := getUserID(c)
		ref, err := h.UserRepo.FindReferralCode(c.Request.Context(), "")
		_ = ref; _ = err
		// Find by user_id instead
		var codes []entity.ReferralCode
		h.AuditDB.Where("user_id = ?", uid).Find(&codes)
		if len(codes) == 0 {
			code := &entity.ReferralCode{ID: uuid.New(), UserID: uid, Code: uuid.NewString()[:8], RewardCredits: 10}
			h.UserRepo.CreateReferralCode(c.Request.Context(), code)
			codes = append(codes, *code)
		}
		c.JSON(200, gin.H{"success": true, "data": codes[0]})
	})

	// ---- Broadcast ----
	api.POST("/creator/broadcast", auth, creatorOnly, func(c *gin.Context) {
		var body struct { Message string `json:"message"` }
		if err := c.ShouldBindJSON(&body); err != nil || body.Message == "" { c.JSON(400, gin.H{"error": "message required"}); return }
		uid := getUserID(c)
		cp, err := h.UserRepo.FindCreatorByUserID(c.Request.Context(), uid)
		if err != nil { c.JSON(404, gin.H{"error": "not found"}); return }
		// 11.4: Check tier by price, not name
		if cp.Tier == nil || cp.Tier.PriceIDR == 0 { c.JSON(403, gin.H{"error": "Broadcast hanya untuk Pro ke atas"}); return }
		// 11.5: Atomic update LastBroadcastAt with rate limit check
		limit := 7 * 24 * time.Hour // Pro: 1x/week
		if cp.Tier.PriceIDR >= 149000 { limit = 24 * time.Hour } // Business: 1x/day
		result := h.AuditDB.Model(&entity.CreatorProfile{}).
			Where("id = ? AND (last_broadcast_at IS NULL OR last_broadcast_at < ?)", cp.ID, time.Now().Add(-limit)).
			Update("last_broadcast_at", time.Now())
		if result.RowsAffected == 0 { c.JSON(429, gin.H{"error": "Kamu sudah broadcast baru-baru ini. Coba lagi nanti."}); return }
		// 11.6: Send notifications in background
		go func() {
			ctx := context.Background()
			followers, _ := h.UserRepo.ListFollowerIDs(ctx, uid)
			for _, fid := range followers {
				h.UserRepo.CreateNotification(ctx, fid, "broadcast", "📢 Broadcast", body.Message, &uid)
			}
		}()
		c.JSON(200, gin.H{"success": true, "message": "Broadcast sedang dikirim ke semua follower"})
	})

	// ---- Chat ----
	chatG := api.Group("/chat", auth)
	{
		chatG.GET("", h.Chat.ListConversations)
		chatG.GET("/:id", h.Chat.GetMessages)
		chatG.POST("", h.Chat.SendMessage)
		chatG.POST("/:id/read", h.Chat.MarkRead)
	}

	// ---- KYC & Reports ----
	api.POST("/kyc", auth, h.KYC.SubmitKYC)
	api.GET("/kyc", auth, h.KYC.GetMyKYC)
	api.POST("/upload", auth, h.KYC.UploadFile)
	api.POST("/reports", optAuth, h.KYC.CreateReport)

	// ---- Admin ----
	adminG := api.Group("/admin", auth, h.Admin.RequireAdmin, middleware.AdminAudit(h.AuditDB))
	adminOnly := h.Admin.RequireAdminOnly
	{
		adminG.GET("/users", adminOnly, h.Admin.ListUsers)
		adminG.GET("/analytics", h.Admin.GetAnalytics)
		adminG.POST("/users/:id/ban", adminOnly, h.Admin.BanUser)
		adminG.POST("/users/:id/unban", adminOnly, h.Admin.UnbanUser)
		adminG.POST("/users/:id/verify", adminOnly, h.Admin.VerifyCreator)
		adminG.POST("/users/:id/promo", adminOnly, h.Admin.SetCreatorPromo)
		adminG.POST("/users/finance", adminOnly, h.Admin.CreateFinanceUser)

		adminG.GET("/withdrawals", h.Admin.ListWithdrawals)
		adminG.PATCH("/withdrawals/:id", h.Admin.UpdateWithdrawalStatus)

		adminG.GET("/kyc", h.Admin.ListKYC)
		adminG.PATCH("/kyc/:id", h.Admin.UpdateKYCStatus)

		adminG.GET("/reports", adminOnly, h.Admin.ListReports)
		adminG.PATCH("/reports/:id", adminOnly, h.Admin.UpdateReportStatus)

		adminG.GET("/credit-topups", h.Admin.ListTopupRequests)
		adminG.POST("/credit-topups/:id/approve", h.Admin.ApproveTopup)
		adminG.POST("/credit-topups/:id/reject", h.Admin.RejectTopup)

		adminG.GET("/posts", adminOnly, h.Admin.ListAllPosts)
		adminG.DELETE("/posts/:id", adminOnly, h.Admin.DeletePost)
		adminG.GET("/products", adminOnly, h.Admin.ListAllProducts)
		adminG.DELETE("/products/:id", adminOnly, h.Admin.DeleteProduct)

		adminG.GET("/payments", h.Admin.ListPayments)
		adminG.POST("/payments/:id/refund", h.Admin.RefundPayment)
		adminG.PATCH("/payments/:id", h.Admin.UpdatePaymentStatus)
		adminG.GET("/donations", h.Admin.ListDonations)

		adminG.GET("/settings", h.Admin.GetSettings)
		adminG.PUT("/settings", adminOnly, h.Admin.UpdateSettings)
		adminG.GET("/export/payments", h.Admin.ExportPayments)
		adminG.GET("/profit", h.Admin.GetProfitSummary)
		adminG.POST("/profit/withdraw", h.Admin.CreateProfitWithdrawal)
	}

	return r
}

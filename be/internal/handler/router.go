package handler

import (
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
		if c.GetHeader("X-Internal") != "true" && c.ClientIP() != "127.0.0.1" {
			// Allow from docker network (172.x) and localhost
			ip := c.ClientIP()
			if len(ip) < 3 || (ip[:3] != "172" && ip[:3] != "10." && ip != "::1") {
				c.AbortWithStatus(403)
				return
			}
		}
		promhttp.Handler().ServeHTTP(c.Writer, c.Request)
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
		t := &entity.OverlayTier{ID: uuid.New(), CreatorID: getUserID(c), MinCredits: body.MinCredits, ImageURL: body.ImageURL, SoundURL: body.SoundURL, Label: body.Label}
		if err := h.UserRepo.CreateOverlayTier(c.Request.Context(), t); err != nil { c.JSON(500, gin.H{"error": "internal"}); return }
		c.JSON(201, gin.H{"success": true, "data": t})
	})
	api.DELETE("/overlay-tiers/:id", auth, creatorOnly, func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil { c.JSON(400, gin.H{"error": "invalid id"}); return }
		h.UserRepo.DeleteOverlayTier(c.Request.Context(), id, getUserID(c))
		c.JSON(200, gin.H{"success": true, "message": "deleted"})
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
	{
		adminG.GET("/users", h.Admin.ListUsers)
		adminG.GET("/analytics", h.Admin.GetAnalytics)
		adminG.POST("/users/:id/ban", h.Admin.BanUser)
		adminG.POST("/users/:id/unban", h.Admin.UnbanUser)
		adminG.POST("/users/:id/verify", h.Admin.VerifyCreator)
		adminG.POST("/users/:id/promo", h.Admin.SetCreatorPromo)

		adminG.GET("/withdrawals", h.Admin.ListWithdrawals)
		adminG.PATCH("/withdrawals/:id", h.Admin.UpdateWithdrawalStatus)

		adminG.GET("/kyc", h.Admin.ListKYC)
		adminG.PATCH("/kyc/:id", h.Admin.UpdateKYCStatus)

		adminG.GET("/reports", h.Admin.ListReports)
		adminG.PATCH("/reports/:id", h.Admin.UpdateReportStatus)

		adminG.GET("/credit-topups", h.Admin.ListTopupRequests)
		adminG.POST("/credit-topups/:id/approve", h.Admin.ApproveTopup)
		adminG.POST("/credit-topups/:id/reject", h.Admin.RejectTopup)

		adminG.GET("/posts", h.Admin.ListAllPosts)
		adminG.DELETE("/posts/:id", h.Admin.DeletePost)
		adminG.GET("/products", h.Admin.ListAllProducts)
		adminG.DELETE("/products/:id", h.Admin.DeleteProduct)

		adminG.GET("/payments", h.Admin.ListPayments)
		adminG.POST("/payments/:id/refund", h.Admin.RefundPayment)
		adminG.PATCH("/payments/:id", h.Admin.UpdatePaymentStatus)
		adminG.GET("/donations", h.Admin.ListDonations)

		adminG.GET("/settings", h.Admin.GetSettings)
		adminG.PUT("/settings", h.Admin.UpdateSettings)
		adminG.GET("/export/payments", h.Admin.ExportPayments)
		adminG.GET("/profit", h.Admin.GetProfitSummary)
		adminG.POST("/profit/withdraw", h.Admin.CreateProfitWithdrawal)
	}

	return r
}

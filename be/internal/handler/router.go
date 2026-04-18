package handler

import (
	"strings"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/handler/middleware"
	"github.com/yourpage/be/internal/pkg/i18n"
	"github.com/yourpage/be/internal/pkg/response"
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
	Membership *MembershipHandler
	Overlay    *OverlayHandler
	Broadcast  *BroadcastHandler
	Referral   *ReferralHandler
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
	r.Use(i18n.AcceptLanguageMiddleware())

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

	// QA-45: Limit JSON body size to 1MB (prevents DoS via huge payloads)
	r.Use(func(c *gin.Context) {
		if c.Request.ContentLength > 1<<20 && c.ContentType() == "application/json" {
			c.AbortWithStatusJSON(413, gin.H{"error": "request body too large"})
			return
		}
		c.Next()
	})

	auth := middleware.AuthRequired(cfg.JWT, rdb)
	optAuth := middleware.OptionalAuth(cfg.JWT, rdb)
	creatorOnly := CreatorRequiredMiddleware()

	api := r.Group("/api/v1")

	// ---- Health ----
	api.GET("/health", func(c *gin.Context) {
		status := gin.H{"status": "ok"}
		code := 200

		// Check Postgres
		sqlDB, err := h.AuditDB.DB()
		if err != nil || sqlDB.PingContext(c.Request.Context()) != nil {
			status["postgres"] = "down"
			code = 503
		} else {
			status["postgres"] = "up"
		}

		// Check Redis
		if rdb.Ping(c.Request.Context()).Err() != nil {
			status["redis"] = "down"
			code = 503
		} else {
			status["redis"] = "up"
		}

		if code != 200 {
			status["status"] = "degraded"
		}
		c.JSON(code, status)
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
		postsG.GET("/:id", optAuth, h.Post.GetByID)
		postsG.GET("/creator/:creatorId", optAuth, rl.Middleware(), h.Post.ListByCreator)
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
		productsG.GET("/:id", optAuth, h.Product.GetByID)
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
		donationsG.POST("", auth, h.Payment.CheckoutDonation) // QA-9: redirect to checkout flow
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

	// Public platform settings (non-sensitive)
	api.GET("/settings/public", func(c *gin.Context) {
		s, err := h.PlatformRepo.GetSettings(c.Request.Context())
		if err != nil { c.JSON(200, gin.H{"success": true, "data": gin.H{"min_withdrawal_idr": 100000, "credit_rate_idr": 1000}}); return }
		c.JSON(200, gin.H{"success": true, "data": gin.H{"min_withdrawal_idr": s.MinWithdrawalIDR, "credit_rate_idr": s.CreditRateIDR, "fee_percent": s.FeePercent}})
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
	api.GET("/overlay-tiers/:creatorId", h.Overlay.ListTiers)
	api.POST("/overlay-tiers", auth, creatorOnly, h.Overlay.CreateTier)
	api.DELETE("/overlay-tiers/:id", auth, creatorOnly, h.Overlay.DeleteTier)

	// ---- Membership ----
	api.GET("/membership-tiers/:creatorId", h.Membership.ListTiers)
	api.POST("/membership-tiers", auth, creatorOnly, h.Membership.CreateTier)
	api.DELETE("/membership-tiers/:id", auth, creatorOnly, h.Membership.DeleteTier)
	api.POST("/memberships/subscribe", auth, h.Membership.Subscribe)
	api.GET("/memberships/my", auth, h.Membership.ListMy)
	api.GET("/memberships/creator", auth, creatorOnly, h.Membership.ListCreatorMembers)

	// ---- Referral ----
	api.GET("/referral", auth, h.Referral.GetMyCode)

	// ---- Broadcast ----
	api.POST("/creator/broadcast", auth, creatorOnly, h.Broadcast.Send)

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
	api.POST("/upload", auth, actionRL.Middleware(), h.KYC.UploadFile)
	api.POST("/reports", auth, actionRL.Middleware(), h.KYC.CreateReport)

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
		adminG.GET("/audit-log", adminOnly, func(c *gin.Context) {
			cursor, limit := parsePagination(c)
			var logs []middleware.AuditLog
			q := h.AuditDB.Model(&middleware.AuditLog{})
			if cursor != nil { q = q.Where("id < ?", *cursor) } // QA-23: fix cursor direction for DESC
			q.Order("created_at DESC").Limit(limit + 1).Find(&logs)
			var next *string
			if len(logs) > limit { s := logs[limit].ID.String(); next = &s; logs = logs[:limit] }
			response.Paginated(c, logs, next)
		})
	}

	return r
}

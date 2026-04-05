package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/handler"
	infraredis "github.com/yourpage/be/internal/infrastructure/redis"
	"github.com/yourpage/be/internal/pkg/logger"
	"github.com/yourpage/be/internal/pkg/mailer"
	"github.com/yourpage/be/internal/pkg/payment/xendit"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/repository"
	"github.com/yourpage/be/internal/repository/postgres"
	"github.com/yourpage/be/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger.Init(cfg.App.Env)

	// ---- Database ----
	db, err := postgres.NewDB(cfg.DB.URL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	// ---- Redis ----
	redisClient, err := infraredis.NewClient(cfg.Redis.URL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to redis")
	}
	rdb := redisClient.Unwrap()

	// ---- MinIO ----
	storageSvc, err := storage.NewMinIO(cfg.MinIO)
	if err != nil {
		log.Warn().Err(err).Msg("minio not available, file uploads will fail")
	}

	// ---- Mailer ----
	mailSvc := mailer.New(cfg.SMTP, cfg.App.FrontendURL)

	// ---- Xendit (stub) ----
	xenditClient := xendit.New(cfg.Xendit.SecretKey, cfg.Xendit.WebhookToken)

	// ---- Repositories ----
	userRepo := postgres.NewUserRepository(db)
	postRepo := postgres.NewPostRepository(db)
	productRepo := postgres.NewProductRepository(db)
	paymentRepo := postgres.NewPaymentRepository(db)
	donationRepo := postgres.NewDonationRepository(db)
	withdrawalRepo := postgres.NewWithdrawalRepository(db)
	walletRepo := postgres.NewWalletRepository(db)
	followRepo := postgres.NewFollowRepository(db)
	kycRepo := postgres.NewKYCRepository(db)
	platformRepo := postgres.NewPlatformRepository(db)

	// ---- Services ----
	authSvc := service.NewAuthService(userRepo, walletRepo, platformRepo, rdb, cfg.JWT, mailSvc)
	postSvc := service.NewPostService(postRepo, userRepo, followRepo, storageSvc, cfg)
	productSvc := service.NewProductService(productRepo, userRepo, storageSvc, cfg)
	donationSvc := service.NewDonationService(donationRepo, paymentRepo, userRepo, platformRepo)
	walletSvc := service.NewWalletService(walletRepo, platformRepo, userRepo, storageSvc, cfg, mailSvc, os.Getenv("ADMIN_EMAIL"))
	followSvc := service.NewFollowService(followRepo, userRepo)
	withdrawalSvc := service.NewWithdrawalService(withdrawalRepo, userRepo, walletRepo, kycRepo, platformRepo)
	kycSvc := service.NewKYCService(kycRepo)
	adminSvc := service.NewAdminService(
		userRepo, postRepo, productRepo, paymentRepo, donationRepo,
		withdrawalRepo, walletRepo, kycRepo, followRepo, platformRepo, mailSvc,
	)
	chatRepo := postgres.NewChatRepo(db)

	// Seed/update admin from env
	if adminEmail := os.Getenv("ADMIN_EMAIL"); adminEmail != "" {
		adminPass := os.Getenv("ADMIN_PASSWORD")
		if adminPass == "" { adminPass = "changeme123" }
		hash, _ := bcrypt.GenerateFromPassword([]byte(adminPass), 12)
		existing, err := userRepo.FindByEmail(context.Background(), adminEmail)
		if err != nil {
			// Create new admin
			userRepo.Create(context.Background(), &entity.User{
				ID: uuid.New(), Email: adminEmail, Username: "admin",
				PasswordHash: string(hash), DisplayName: "Admin", Role: entity.RoleAdmin,
			})
			log.Info().Str("email", adminEmail).Msg("admin user created")
		} else {
			// Update password if ADMIN_PASSWORD is set
			existing.PasswordHash = string(hash)
			userRepo.Update(context.Background(), existing)
			log.Info().Str("email", adminEmail).Msg("admin password updated from env")
		}
	}

	// Seed/update finance user from env
	if financeEmail := os.Getenv("FINANCE_EMAIL"); financeEmail != "" {
		financePass := os.Getenv("FINANCE_PASSWORD")
		if financePass == "" { financePass = "changeme123" }
		hash, _ := bcrypt.GenerateFromPassword([]byte(financePass), 12)
		existing, err := userRepo.FindByEmail(context.Background(), financeEmail)
		if err != nil {
			userRepo.Create(context.Background(), &entity.User{
				ID: uuid.New(), Email: financeEmail, Username: "finance",
				PasswordHash: string(hash), DisplayName: "Finance", Role: entity.RoleFinance,
			})
			log.Info().Str("email", financeEmail).Msg("finance user created")
		} else {
			existing.PasswordHash = string(hash)
			existing.Role = entity.RoleFinance
			userRepo.Update(context.Background(), existing)
		}
	}

	chatSvc := service.NewChatService(chatRepo, userRepo, walletRepo, followRepo, paymentRepo)

	paymentSvc := service.NewPaymentService(
		paymentRepo, postRepo, productRepo, donationRepo,
		walletRepo, userRepo, followRepo, platformRepo, mailSvc,
	)

	// ---- Handlers ----
	h := handler.Handlers{
		Auth:       handler.NewAuthHandler(authSvc),
		Post:       handler.NewPostHandler(postSvc),
		Product:    handler.NewProductHandler(productSvc),
		Donation:   handler.NewDonationHandler(donationSvc),
		Wallet:     handler.NewWalletHandler(walletSvc),
		Follow:     handler.NewFollowHandler(followSvc),
		Withdrawal: handler.NewWithdrawalHandler(withdrawalSvc),
		KYC:        handler.NewKYCHandler(kycSvc, storageSvc, cfg),
		Admin:      handler.NewAdminHandler(adminSvc),
		Public:     handler.NewPublicHandler(userRepo, followRepo),
		Payment:    handler.NewPaymentHandler(paymentSvc, userRepo),
		Webhook:    handler.NewWebhookHandler(paymentRepo, xenditClient),
		Chat:       handler.NewChatHandler(chatSvc),
		PlatformRepo: platformRepo,
		UserRepo:     userRepo,
		AuditDB:      db,
	}

	// ---- Router ----
	router := handler.NewRouter(cfg, rdb, h)

	port := cfg.App.Port
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Scheduled post publisher
	go func() {
		ticker := time.NewTicker(60 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			postRepo.PublishScheduled(context.Background())
		}
	}()

	// Tier expiry checker — every minute
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			handleTierExpiry(context.Background(), userRepo, productRepo, platformRepo)
			handleMembershipRenewal(context.Background(), db)
		}
	}()

	// Admin pending digest — every 5 minutes, send to finance
	go func() {
		financeEmail := os.Getenv("FINANCE_EMAIL")
		adminEmail := os.Getenv("ADMIN_EMAIL")
		if financeEmail == "" && adminEmail == "" { return }
		recipient := financeEmail
		if recipient == "" { recipient = adminEmail }
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			ctx := context.Background()
			pendingTopups, _ := walletRepo.CountPendingTopups(ctx)
			pendingWithdrawals, _ := withdrawalRepo.CountPending(ctx)
			pendingKYC, _ := kycRepo.CountPending(ctx)
			if pendingTopups+pendingWithdrawals+pendingKYC > 0 {
				mailSvc.SendAdminPendingDigest(ctx, recipient, int(pendingWithdrawals), int(pendingTopups), int(pendingKYC))
			}
		}
	}()

	// Admin pending digest — every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			handleAdminDigest(context.Background(), withdrawalRepo, walletRepo, kycRepo, mailSvc, cfg.App.AdminEmail)
		}
	}()

	go func() {
		log.Info().Str("port", port).Msg("server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server failed")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("server forced to shutdown")
	}

	log.Info().Msg("server exited")
}

func handleAdminDigest(
	ctx context.Context,
	withdrawalRepo repository.WithdrawalRepository,
	walletRepo repository.WalletRepository,
	kycRepo repository.KYCRepository,
	mailSvc mailer.Mailer,
	adminEmail string,
) {
	if adminEmail == "" {
		return
	}

	withdrawals, _ := withdrawalRepo.ListAll(ctx, "pending", nil, 1000)
	topups, _ := walletRepo.ListTopupRequests(ctx, "pending", nil, 1000)
	kycs, _ := kycRepo.ListKYC(ctx, "pending", nil, 1000)

	total := len(withdrawals) + len(topups) + len(kycs)
	if total == 0 {
		return
	}

	if err := mailSvc.SendAdminPendingDigest(ctx, adminEmail, len(withdrawals), len(topups), len(kycs)); err != nil {
		log.Warn().Err(err).Msg("admin digest email failed")
	}
}

func handleTierExpiry(ctx context.Context, userRepo repository.UserRepository, productRepo repository.ProductRepository, platformRepo repository.PlatformRepository) {
	expired, err := userRepo.ListExpiredTierCreators(ctx)
	if err != nil || len(expired) == 0 {
		return
	}

	freeTiers, _ := platformRepo.ListTiers(ctx)
	var freeTierID *uuid.UUID
	var freeMaxProducts int
	var freeStorageBytes int64
	for _, t := range freeTiers {
		if t.PriceIDR == 0 {
			id := t.ID
			freeTierID = &id
			freeMaxProducts = t.MaxProducts
			freeStorageBytes = t.StorageBytes
			break
		}
	}
	if freeTierID == nil {
		return
	}

	for _, cp := range expired {
		log.Info().Str("user_id", cp.UserID.String()).Msg("tier expired, downgrading to Free")

		// Downgrade tier
		cp.TierID = freeTierID
		cp.TierExpiresAt = nil
		fee := 20
		cp.CustomFeePercent = &fee
		cp.StorageQuotaBytes = freeStorageBytes
		cp.Tier = nil
		_ = userRepo.UpdateCreatorProfile(ctx, &cp)

		// Deactivate excess products
		if freeMaxProducts > 0 {
			productRepo.DeactivateExcess(ctx, cp.UserID, freeMaxProducts)
		}
	}
}

func handleMembershipRenewal(ctx context.Context, db *gorm.DB) {
	var expired []entity.Membership
	db.Preload("Tier").Where("status = 'active' AND expires_at < NOW()").Find(&expired)
	for _, m := range expired {
		if !m.AutoRenew || m.Tier == nil {
			db.Model(&m).Update("status", "expired")
			continue
		}
		// Try auto-renew
		result := db.Model(&entity.UserWallet{}).Where("user_id = ? AND balance_credits >= ?", m.SupporterID, m.Tier.PriceCredits).
			Update("balance_credits", gorm.Expr("balance_credits - ?", m.Tier.PriceCredits))
		if result.RowsAffected == 0 {
			db.Model(&m).Update("status", "expired")
			continue
		}
		// Credit creator
		db.Model(&entity.UserWallet{}).Where("user_id = ?", m.CreatorID).Update("balance_credits", gorm.Expr("balance_credits + ?", m.Tier.PriceCredits))
		// Extend 1 month
		db.Model(&m).Updates(map[string]interface{}{"started_at": time.Now(), "expires_at": time.Now().AddDate(0, 1, 0)})
		log.Info().Str("supporter", m.SupporterID.String()).Msg("membership renewed")
	}
}

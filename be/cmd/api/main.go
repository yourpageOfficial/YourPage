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
	"github.com/yourpage/be/internal/config"
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
	mailSvc := mailer.New(cfg.SMTP)

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
	walletSvc := service.NewWalletService(walletRepo, platformRepo, storageSvc, cfg)
	followSvc := service.NewFollowService(followRepo, userRepo)
	withdrawalSvc := service.NewWithdrawalService(withdrawalRepo, userRepo, kycRepo, platformRepo)
	kycSvc := service.NewKYCService(kycRepo)
	adminSvc := service.NewAdminService(
		userRepo, postRepo, productRepo, paymentRepo, donationRepo,
		withdrawalRepo, walletRepo, kycRepo, followRepo, platformRepo,
	)
	paymentSvc := service.NewPaymentService(
		paymentRepo, postRepo, productRepo, donationRepo,
		walletRepo, userRepo, followRepo, platformRepo,
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
		Public:     handler.NewPublicHandler(userRepo),
		Payment:    handler.NewPaymentHandler(paymentSvc, userRepo),
		Webhook:    handler.NewWebhookHandler(paymentRepo, xenditClient),
		PlatformRepo: platformRepo,
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

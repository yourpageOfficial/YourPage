package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

func TestMagicLinkAndSecurityAlert(t *testing.T) {
	ctx := context.Background()

	userRepo := testutil.NewMockUserRepo()
	walletRepo := testutil.NewMockWalletRepo()
	platformRepo := testutil.NewMockPlatformRepo()
	jwtCfg := config.JWTConfig{
		Secret:     "test-secret-key-32-chars-long!!",
		AccessTTL:  15 * time.Minute,
		RefreshTTL: 7 * 24 * time.Hour,
	}
	oauthCfg := config.OAuthConfig{}

	svc := service.NewAuthService(userRepo, walletRepo, platformRepo, nil, jwtCfg, oauthCfg, testutil.MockMailer{})

	t.Run("SendMagicLink silent success for non-existent email", func(t *testing.T) {
		err := svc.SendMagicLink(ctx, "nonexistent@example.com")
		if err != nil {
			t.Fatalf("expected nil error to prevent email enumeration, got: %v", err)
		}
	})

	t.Run("SendMagicLink succeeds for registered user", func(t *testing.T) {
		u := &entity.User{
			ID:          uuid.New(),
			Email:       "member@example.com",
			Username:    "member1",
			DisplayName: "Member One",
			Role:        entity.RoleSupporter,
		}
		if err := userRepo.Create(ctx, u); err != nil {
			t.Fatalf("failed to create user: %v", err)
		}

		err := svc.SendMagicLink(ctx, u.Email)
		if err != nil {
			t.Fatalf("expected nil error on valid user, got: %v", err)
		}
	})

	t.Run("VerifyMagicLink rejects invalid or missing token", func(t *testing.T) {
		_, err := svc.VerifyMagicLink(ctx, "invalid-token-12345")
		if err == nil {
			t.Fatal("expected error for invalid token, got nil")
		}
	})

	t.Run("CheckSuspiciousLogin executes safely with local or nil redis", func(t *testing.T) {
		u := &entity.User{
			ID:    uuid.New(),
			Email: "alert@example.com",
		}
		// Should execute safely without panic
		svc.CheckSuspiciousLogin(ctx, u, "103.21.244.2", "Mozilla/5.0")
	})
}

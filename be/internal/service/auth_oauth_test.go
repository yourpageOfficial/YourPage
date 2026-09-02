package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

func TestOAuth(t *testing.T) {
	ctx := context.Background()

	userRepo := testutil.NewMockUserRepo()
	walletRepo := testutil.NewMockWalletRepo()
	platformRepo := testutil.NewMockPlatformRepo()
	jwtCfg := config.JWTConfig{
		Secret:     "test-secret-key-32-chars-long!!",
		AccessTTL:  15 * time.Minute,
		RefreshTTL: 7 * 24 * time.Hour,
	}
	oauthCfg := config.OAuthConfig{
		GoogleClientID:     "test-google-id",
		GoogleClientSecret: "test-google-secret",
		GoogleRedirectURI:  "http://localhost:3000/auth/callback/google",
		FacebookClientID:   "test-fb-id",
		FacebookRedirectURI: "http://localhost:3000/auth/callback/facebook",
	}

	svc := service.NewAuthService(userRepo, walletRepo, platformRepo, nil, jwtCfg, oauthCfg, testutil.MockMailer{})

	t.Run("GetOAuthURL generates google url with parameters", func(t *testing.T) {
		u, err := svc.GetOAuthURL(ctx, "google")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if u == "" {
			t.Fatal("expected non-empty oauth url")
		}
	})

	t.Run("GetOAuthURL generates facebook url with parameters", func(t *testing.T) {
		u, err := svc.GetOAuthURL(ctx, "facebook")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if u == "" {
			t.Fatal("expected non-empty oauth url")
		}
	})

	t.Run("GetOAuthURL rejects unknown provider", func(t *testing.T) {
		_, err := svc.GetOAuthURL(ctx, "github")
		if err == nil {
			t.Fatal("expected error for unsupported provider, got nil")
		}
	})

	t.Run("ListOAuthAccounts returns empty initially", func(t *testing.T) {
		uid := uuid.New()
		accs, err := svc.ListOAuthAccounts(ctx, uid)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(accs) != 0 {
			t.Fatalf("expected 0 accounts, got %d", len(accs))
		}
	})

	t.Run("UnlinkOAuthAccount succeeds", func(t *testing.T) {
		uid := uuid.New()
		if err := svc.UnlinkOAuthAccount(ctx, uid, "google"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}

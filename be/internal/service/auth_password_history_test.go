package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

func TestPasswordHistory(t *testing.T) {
	ctx := context.Background()
	userRepo := testutil.NewMockUserRepo()
	walletRepo := testutil.NewMockWalletRepo()
	platformRepo := testutil.NewMockPlatformRepo()
	jwtCfg := config.JWTConfig{
		Secret:     "test-secret-key-32-chars-long!!",
		AccessTTL:  15 * time.Minute,
		RefreshTTL: 7 * 24 * time.Hour,
	}
	mailerMock := testutil.MockMailer{}
	authSvc := service.NewAuthService(userRepo, walletRepo, platformRepo, nil, jwtCfg, config.OAuthConfig{}, mailerMock)

	// 1. Register a user with password "initial_password_123"
	regResp, err := authSvc.Register(ctx, service.RegisterRequest{
		Email:    "test@example.com",
		Username: "testuser",
		Password: "initial_password_123",
		Role:     entity.RoleSupporter,
	})
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	userID := regResp.ID

	// Verify initial password history was recorded
	histories, err := userRepo.GetPasswordHistories(ctx, userID, 5)
	if err != nil || len(histories) != 1 {
		t.Fatalf("expected 1 initial password history, got %d (err: %v)", len(histories), err)
	}

	// 2. Attempt to change password to the SAME current password -> should fail
	err = authSvc.ChangePassword(ctx, userID, "initial_password_123", "initial_password_123")
	if !errors.Is(err, entity.ErrPasswordRecentlyUsed) {
		t.Fatalf("expected ErrPasswordRecentlyUsed on same password, got: %v", err)
	}

	// 3. Change password to password #2 -> should succeed
	err = authSvc.ChangePassword(ctx, userID, "initial_password_123", "second_password_456")
	if err != nil {
		t.Fatalf("change password #2 failed: %v", err)
	}

	// 4. Attempt to change back to password #1 -> should fail
	err = authSvc.ChangePassword(ctx, userID, "second_password_456", "initial_password_123")
	if !errors.Is(err, entity.ErrPasswordRecentlyUsed) {
		t.Fatalf("expected ErrPasswordRecentlyUsed on reused password #1, got: %v", err)
	}

	// 5. Change password to #3, #4, #5, #6
	passwords := []string{
		"third_password_789",
		"fourth_password_abc",
		"fifth_password_def",
		"sixth_password_ghi",
	}
	currentPw := "second_password_456"
	for _, nextPw := range passwords {
		err = authSvc.ChangePassword(ctx, userID, currentPw, nextPw)
		if err != nil {
			t.Fatalf("failed changing to %s: %v", nextPw, err)
		}
		currentPw = nextPw
	}

	// Now history has (up to 5 recent):
	// Attempt to change to "fifth_password_def" -> should fail (it's in recent 5)
	err = authSvc.ChangePassword(ctx, userID, currentPw, "fifth_password_def")
	if !errors.Is(err, entity.ErrPasswordRecentlyUsed) {
		t.Fatalf("expected ErrPasswordRecentlyUsed on recent password #5, got: %v", err)
	}

	// Attempt to change to "third_password_789" -> should fail (it's in recent 5)
	err = authSvc.ChangePassword(ctx, userID, currentPw, "third_password_789")
	if !errors.Is(err, entity.ErrPasswordRecentlyUsed) {
		t.Fatalf("expected ErrPasswordRecentlyUsed on recent password #3, got: %v", err)
	}

	// Change to a completely fresh password -> should succeed
	err = authSvc.ChangePassword(ctx, userID, currentPw, "fresh_seventh_password_xyz")
	if err != nil {
		t.Fatalf("failed changing to fresh password: %v", err)
	}

	// Verify user's updated password hash
	updatedUser, _ := userRepo.FindByID(ctx, userID)
	if err := bcrypt.CompareHashAndPassword([]byte(updatedUser.PasswordHash), []byte("fresh_seventh_password_xyz")); err != nil {
		t.Fatalf("new password hash does not match: %v", err)
	}
}

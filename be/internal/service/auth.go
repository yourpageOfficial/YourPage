package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"

	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	pkgjwt "github.com/yourpage/be/internal/pkg/jwt"
	"github.com/yourpage/be/internal/pkg/mailer"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
)

// ------------------------------------------------------------------ requests

type RegisterRequest struct {
	Email    string          `json:"email"    validate:"required,email"`
	Username string          `json:"username" validate:"required,min=3,max=30,alphanum"`
	Password string          `json:"password" validate:"required,min=8"`
	Role     entity.UserRole `json:"role"     validate:"required,oneof=creator supporter"`
	ReferralCode string          `json:"referral_code"`
}

type LoginRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type UpgradeCreatorRequest struct {
	PageSlug    string `json:"page_slug"    validate:"required,min=3,max=50,alphanum"`
	DisplayName string `json:"display_name" validate:"required,min=1,max=100"`
}

// ------------------------------------------------------------------ responses

// RegisterResponse intentionally omits email (PII).
type RegisterResponse struct {
	ID          uuid.UUID       `json:"id"`
	Username    string          `json:"username"`
	DisplayName string          `json:"display_name"`
	Role        entity.UserRole `json:"role"`
}

type LoginResponse struct {
	AccessToken    string `json:"access_token,omitempty"`
	RefreshToken   string `json:"refresh_token,omitempty"`
	Requires2FA    bool   `json:"requires_2fa,omitempty"`
	ChallengeToken string `json:"challenge_token,omitempty"`
}

// UserProfileResponse intentionally omits email (PII).
type UserProfileResponse struct {
	ID          uuid.UUID        `json:"id"`
	Username    string           `json:"username"`
	DisplayName string           `json:"display_name"`
	AvatarURL   *string          `json:"avatar_url"`
	Bio         *string          `json:"bio"`
	Role          entity.UserRole  `json:"role"`
	EmailVerified bool             `json:"email_verified"`
	Creator       *creatorSnapshot `json:"creator_profile,omitempty"`
}

type creatorSnapshot struct {
	PageSlug      string     `json:"page_slug"`
	IsMonetized   bool       `json:"is_monetized"`
	IsVerified    bool       `json:"is_verified"`
	FollowerCount int64      `json:"follower_count"`
	TierID        *uuid.UUID `json:"tier_id,omitempty"`
	TierName      string     `json:"tier_name,omitempty"`
	TierExpiresAt *time.Time `json:"tier_expires_at,omitempty"`
}

// ------------------------------------------------------------------ interface

// AuthService defines the auth domain operations.
type AuthService interface {
	Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error)
	Login(ctx context.Context, req LoginRequest) (*LoginResponse, error)
	Logout(ctx context.Context, userID uuid.UUID, refreshToken, accessToken string) error
	RefreshToken(ctx context.Context, refreshToken string) (*LoginResponse, error)
	GetMe(ctx context.Context, userID uuid.UUID) (*UserProfileResponse, error)
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
	UpgradeToCreator(ctx context.Context, userID uuid.UUID, req UpgradeCreatorRequest) error
	UpdateProfile(ctx context.Context, userID uuid.UUID, displayName, bio, avatarURL, pageColor, headerImage *string, chatPrice *int64, chatAllowFrom *string, autoReply *string, socialLinks map[string]interface{}, goalTitle *string, goalAmount *int64, welcomeMsg, overlayStyle, overlayText, category *string) error
	ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, userID uuid.UUID) error
	SubscribeTier(ctx context.Context, userID uuid.UUID, tierID uuid.UUID) error
	RequestDeleteAccount(ctx context.Context, userID uuid.UUID, password string) error
	CancelDeleteAccount(ctx context.Context, userID uuid.UUID) error
	ExportData(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)

	// 2FA
	EnableTwoFA(ctx context.Context, userID uuid.UUID) error
	VerifyTwoFA(ctx context.Context, userID uuid.UUID, otp string) error
	DisableTwoFA(ctx context.Context, userID uuid.UUID, password string) error
	LoginWithTwoFA(ctx context.Context, challengeToken, otp string) (*LoginResponse, error)

	// QR Login
	GenerateQRLogin(ctx context.Context) (string, error)
	ConfirmQRLogin(ctx context.Context, qrToken string, userID uuid.UUID, role string) error
	PollQRLogin(ctx context.Context, qrToken string) (*LoginResponse, error)

	// Referral
	GetMyReferralCode(ctx context.Context, userID uuid.UUID) (*entity.ReferralCode, error)
	ListMyReferrals(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.ReferralUse, *uuid.UUID, error)
	GetReferralStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)

	// Donation settings
	UpdateDonationSettings(ctx context.Context, userID uuid.UUID, enabled *bool, minAmount *int, presets []int64) error

	// Tags
	UpdateTags(ctx context.Context, userID uuid.UUID, tags []string) error
}

// ------------------------------------------------------------------ Redis key helpers

const (
	refreshKeyPrefix = "refresh:"
	resetKeyPrefix   = "reset:"
	refreshTTL       = 7 * 24 * time.Hour
	resetTTL         = 15 * time.Minute
)

func refreshKey(token string) string { return refreshKeyPrefix + token }
func userRefreshSet(userID uuid.UUID) string { return "user_refresh:" + userID.String() }
func resetKey(token string) string   { return resetKeyPrefix + token }

// invalidateAllRefreshTokens deletes all refresh tokens for a user using per-user set.
func (s *authService) invalidateAllRefreshTokens(ctx context.Context, userID uuid.UUID) {
	tokens, err := s.rdb.SMembers(ctx, userRefreshSet(userID)).Result()
	if err != nil { return }
	for _, t := range tokens {
		s.rdb.Del(ctx, refreshKey(t))
	}
	s.rdb.Del(ctx, userRefreshSet(userID))
}

// ------------------------------------------------------------------ implementation

type authService struct {
	userRepo     repository.UserRepository
	walletRepo   repository.WalletRepository
	platformRepo repository.PlatformRepository
	rdb          *redis.Client
	jwtCfg       config.JWTConfig
	mailer       mailer.Mailer
}

func NewAuthService(
	userRepo repository.UserRepository,
	walletRepo repository.WalletRepository,
	platformRepo repository.PlatformRepository,
	rdb *redis.Client,
	jwtCfg config.JWTConfig,
	m mailer.Mailer,
) AuthService {
	return &authService{
		userRepo:     userRepo,
		walletRepo:   walletRepo,
		platformRepo: platformRepo,
		rdb:          rdb,
		jwtCfg:       jwtCfg,
		mailer:       m,
	}
}

// Register creates a new user. For creators it also auto-creates the CreatorProfile.
func (s *authService) Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, fmt.Errorf("register: hash password: %w", err)
	}

	user := &entity.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hash),
		DisplayName:  req.Username,
		Role:         req.Role,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		if errors.Is(err, entity.ErrConflict) {
			return nil, entity.ErrConflict
		}
		return nil, fmt.Errorf("register: create user: %w", err)
	}

	if req.Role == entity.RoleCreator {
		profile := &entity.CreatorProfile{
			ID:       uuid.New(),
			UserID:   user.ID,
			PageSlug: user.Username,
		}
		if err := s.userRepo.CreateCreatorProfile(ctx, profile); err != nil {
			// 1.5: Hard delete user on rollback so email/username can be reused
			_ = s.userRepo.HardDelete(ctx, user.ID)
			return nil, fmt.Errorf("register: create creator profile: %w", err)
		}
	}

	// Process referral code
	if req.ReferralCode != "" {
		if ref, err := s.userRepo.FindReferralCode(ctx, req.ReferralCode); err == nil {
			user.ReferredBy = &ref.UserID
			s.userRepo.Update(ctx, user)
			s.walletRepo.FindOrCreateWallet(ctx, ref.UserID)
			s.walletRepo.AddCredits(ctx, ref.UserID, int64(ref.RewardCredits))
			s.walletRepo.FindOrCreateWallet(ctx, user.ID)
			s.walletRepo.AddCredits(ctx, user.ID, int64(ref.RewardCredits))
			s.userRepo.IncrementReferralUsed(ctx, ref.ID)
		}
	}

	// Send welcome + verification email
	go s.mailer.SendWelcome(context.Background(), user.Email, user.DisplayName)
	verifyToken, _ := randomHex(32)
	s.rdb.Set(ctx, "verify:"+verifyToken, user.Email, 24*time.Hour)
	go s.mailer.SendEmailVerification(context.Background(), user.Email, verifyToken)

	return &RegisterResponse{
		ID:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Role:        user.Role,
	}, nil
}

// Login verifies credentials and issues a token pair.
func (s *authService) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	// 1.15: Account lockout — 5 failed attempts = 15 min lock
	lockKey := "login_fail:" + req.Email
	failCount, _ := s.rdb.Get(ctx, lockKey).Int()
	if failCount >= 5 {
		return nil, fmt.Errorf("⚠ Terlalu banyak percobaan login. Coba lagi dalam 15 menit.")
	}

	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, entity.ErrNotFound) {
			s.rdb.Incr(ctx, lockKey); s.rdb.Expire(ctx, lockKey, 15*time.Minute)
			return nil, entity.ErrUnauthorized
		}
		return nil, fmt.Errorf("login: find user: %w", err)
	}

	if user.IsBanned {
		return nil, entity.ErrBanned
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		s.rdb.Incr(ctx, lockKey); s.rdb.Expire(ctx, lockKey, 15*time.Minute)
		return nil, entity.ErrUnauthorized
	}

	// Reset fail counter on success
	s.rdb.Del(ctx, lockKey)

	// 2FA check: if enabled, send OTP and return challenge token
	if user.TwoFAEnabled {
		challengeToken, err := randomHex(16)
		if err != nil {
			return nil, fmt.Errorf("login: generate 2fa challenge: %w", err)
		}
		val := user.ID.String() + ":" + string(user.Role)
		if err := s.rdb.Set(ctx, twoFAChallengePrefix+challengeToken, val, twoFAChallengeTTL).Err(); err != nil {
			return nil, fmt.Errorf("login: store 2fa challenge: %w", err)
		}
		// Generate and send OTP
		otp, err := generateOTP()
		if err != nil {
			return nil, fmt.Errorf("login: generate otp: %w", err)
		}
		s.rdb.Set(ctx, twoFAOTPPrefix+user.ID.String(), otp, twoFAOTPTTL)
		go s.mailer.SendTwoFAOTP(context.Background(), user.Email, otp)
		// Return special response — no token yet
		return &LoginResponse{
			Requires2FA:    true,
			ChallengeToken: challengeToken,
		}, nil
	}

	return s.issueTokenPair(ctx, user.ID, string(user.Role))
}

// Logout invalidates the refresh token stored in Redis.
func (s *authService) Logout(ctx context.Context, userID uuid.UUID, refreshToken, accessToken string) error {
	// Remove from per-user set
	s.rdb.SRem(ctx, userRefreshSet(userID), refreshToken)
	// Delete refresh token
	if err := s.rdb.Del(ctx, refreshKey(refreshToken)).Err(); err != nil {
		return fmt.Errorf("logout: del refresh token: %w", err)
	}
	// Blacklist access token until it expires (15 min)
	if accessToken != "" {
		s.rdb.Set(ctx, "blacklist:"+accessToken, "1", s.jwtCfg.AccessTTL)
	}
	return nil
}

// RefreshToken validates the old refresh token, issues a new pair (rotation).
func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*LoginResponse, error) {
	userIDStr, err := s.rdb.Get(ctx, refreshKey(refreshToken)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, entity.ErrInvalidToken
		}
		return nil, fmt.Errorf("refresh: get from redis: %w", err)
	}

	// Also validate the JWT signature / expiry.
	claims, err := pkgjwt.ParseToken(s.jwtCfg, refreshToken)
	if err != nil {
		_ = s.rdb.Del(ctx, refreshKey(refreshToken))
		return nil, entity.ErrInvalidToken
	}
	if claims.TokenType != pkgjwt.TokenTypeRefresh {
		return nil, entity.ErrInvalidToken
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, entity.ErrInvalidToken
	}

	// Delete old token before issuing new one (rotation).
	_ = s.rdb.Del(ctx, refreshKey(refreshToken))

	return s.issueTokenPair(ctx, userID, claims.Role)
}

// GetMe returns the profile for userID without exposing PII.
func (s *authService) GetMe(ctx context.Context, userID uuid.UUID) (*UserProfileResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get_me: find user: %w", err)
	}

	resp := &UserProfileResponse{
		ID:            user.ID,
		Username:      user.Username,
		DisplayName:   user.DisplayName,
		AvatarURL:     user.AvatarURL,
		Bio:           user.Bio,
		Role:          user.Role,
		EmailVerified: user.EmailVerified,
	}

	if user.Role == entity.RoleCreator || user.Role == entity.RoleAdmin {
		cp, err := s.userRepo.FindCreatorByUserID(ctx, userID)
		if err == nil && cp != nil {
			tierName := "Free"
			if cp.Tier != nil { tierName = cp.Tier.Name }
			resp.Creator = &creatorSnapshot{
				PageSlug:      cp.PageSlug,
				IsMonetized:   cp.IsMonetized,
				IsVerified:    cp.IsVerified,
				FollowerCount: cp.FollowerCount,
				TierID:        cp.TierID,
				TierName:      tierName,
				TierExpiresAt: cp.TierExpiresAt,
			}
		}
	}

	return resp, nil
}

// ForgotPassword generates a reset token and sends an email.
func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	// Verify user exists (silently succeed to prevent email enumeration).
	_, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, entity.ErrNotFound) {
			return nil // Do not reveal whether the email is registered.
		}
		return fmt.Errorf("forgot_password: find user: %w", err)
	}

	token, err := randomHex(32)
	if err != nil {
		return fmt.Errorf("forgot_password: generate token: %w", err)
	}

	if err := s.rdb.Set(ctx, resetKey(token), email, resetTTL).Err(); err != nil {
		return fmt.Errorf("forgot_password: store token: %w", err)
	}

	if err := s.mailer.SendPasswordReset(ctx, email, token); err != nil {
		// Don't expose mailer failures to the caller; log-worthy but not fatal from UX perspective.
		return fmt.Errorf("forgot_password: send email: %w", err)
	}

	return nil
}

// ResetPassword validates the reset token and updates the password hash.
func (s *authService) ResetPassword(ctx context.Context, token, newPassword string) error {
	email, err := s.rdb.Get(ctx, resetKey(token)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return entity.ErrInvalidToken
		}
		return fmt.Errorf("reset_password: get token: %w", err)
	}

	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return fmt.Errorf("reset_password: find user: %w", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return fmt.Errorf("reset_password: hash password: %w", err)
	}

	user.PasswordHash = string(hash)
	if err := s.userRepo.Update(ctx, user); err != nil {
		return fmt.Errorf("reset_password: update user: %w", err)
	}

	_ = s.rdb.Del(ctx, resetKey(token))

	// H-06: Invalidate all existing refresh tokens for this user
	s.invalidateAllRefreshTokens(ctx, user.ID)

	return nil
}

// UpgradeToCreator promotes a supporter to creator and creates their profile.
func (s *authService) UpgradeToCreator(ctx context.Context, userID uuid.UUID, req UpgradeCreatorRequest) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("upgrade_creator: find user: %w", err)
	}

	if user.Role == entity.RoleCreator {
		return nil // Already a creator, idempotent.
	}

	user.Role = entity.RoleCreator
	if req.DisplayName != "" {
		user.DisplayName = req.DisplayName
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return fmt.Errorf("upgrade_creator: update user: %w", err)
	}

	// Create CreatorProfile only if it doesn't already exist.
	_, err = s.userRepo.FindCreatorByUserID(ctx, userID)
	if errors.Is(err, entity.ErrNotFound) {
		profile := &entity.CreatorProfile{
			ID:       uuid.New(),
			UserID:   userID,
			PageSlug: req.PageSlug,
		}
		if err := s.userRepo.CreateCreatorProfile(ctx, profile); err != nil {
			return fmt.Errorf("upgrade_creator: create creator profile: %w", err)
		}
	}

	return nil
}

// UpdateProfile updates display name, bio, and avatar.
func (s *authService) UpdateProfile(ctx context.Context, userID uuid.UUID, displayName, bio, avatarURL, pageColor, headerImage *string, chatPrice *int64, chatAllowFrom *string, autoReply *string, socialLinks map[string]interface{}, goalTitle *string, goalAmount *int64, welcomeMsg, overlayStyle, overlayText, category *string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	if displayName != nil {
		user.DisplayName = validator.SanitizeString(*displayName)
	}
	if bio != nil {
		clean := validator.SanitizeString(*bio)
		user.Bio = &clean
	}
	if avatarURL != nil {
		user.AvatarURL = avatarURL
	}
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}
	// Save page_color to creator profile
	// Save creator-specific fields
	if user.Role == entity.RoleCreator && (pageColor != nil || headerImage != nil || chatPrice != nil || chatAllowFrom != nil || autoReply != nil || socialLinks != nil || goalTitle != nil || goalAmount != nil || welcomeMsg != nil || overlayStyle != nil || overlayText != nil) {
		cp, err := s.userRepo.FindCreatorByUserID(ctx, userID)
		if err == nil {
			if pageColor != nil { cp.PageColor = pageColor }
			if headerImage != nil { cp.HeaderImageURL = headerImage }
			if chatPrice != nil { cp.ChatPriceIDR = *chatPrice }
			if chatAllowFrom != nil {
				switch *chatAllowFrom {
				case "all", "supporter_only", "creator_only", "none":
					cp.ChatAllowFrom = *chatAllowFrom
				}
			}
			if autoReply != nil { cp.AutoReply = autoReply }
			if socialLinks != nil { cp.SocialLinks = entity.JSONMap(socialLinks) }
			if goalTitle != nil { cp.DonationGoalTitle = goalTitle }
			if goalAmount != nil { cp.DonationGoalAmount = *goalAmount }
			if welcomeMsg != nil { cp.WelcomeMessage = welcomeMsg }
			if overlayStyle != nil { cp.OverlayStyle = *overlayStyle }
			if overlayText != nil { cp.OverlayTextTemplate = *overlayText }
			cp.Tier = nil
			return s.userRepo.UpdateCreatorProfile(ctx, cp)
		}
	}
	return nil
}

// ChangePassword verifies old password and sets new one.
func (s *authService) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return entity.ErrUnauthorized
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return fmt.Errorf("change_password: hash: %w", err)
	}
	user.PasswordHash = string(hash)
	if err := s.userRepo.Update(ctx, user); err != nil { return err }

	// 1.17: Invalidate all refresh tokens
	s.invalidateAllRefreshTokens(ctx, userID)
	return nil
}

// ------------------------------------------------------------------ helpers

// issueTokenPair generates access + refresh tokens and persists the refresh token.
func (s *authService) issueTokenPair(ctx context.Context, userID uuid.UUID, role string) (*LoginResponse, error) {
	accessToken, err := pkgjwt.GenerateAccessToken(s.jwtCfg, userID, role)
	if err != nil {
		return nil, fmt.Errorf("issue_tokens: generate access: %w", err)
	}

	refreshToken, err := pkgjwt.GenerateRefreshToken(s.jwtCfg, userID, role)
	if err != nil {
		return nil, fmt.Errorf("issue_tokens: generate refresh: %w", err)
	}

	if err := s.rdb.Set(ctx, refreshKey(refreshToken), userID.String(), refreshTTL).Err(); err != nil {
		return nil, fmt.Errorf("issue_tokens: store refresh: %w", err)
	}
	// QA-15: Track token in per-user set for efficient invalidation
	s.rdb.SAdd(ctx, userRefreshSet(userID), refreshToken)
	s.rdb.Expire(ctx, userRefreshSet(userID), refreshTTL)

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// randomHex returns n random bytes encoded as a hex string (2n chars).
func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *authService) VerifyEmail(ctx context.Context, token string) error {
	email, err := s.rdb.Get(ctx, "verify:"+token).Result()
	if err != nil { return entity.ErrInvalidToken }
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil { return entity.ErrNotFound }
	user.EmailVerified = true
	if err := s.userRepo.Update(ctx, user); err != nil { return err }
	s.rdb.Del(ctx, "verify:"+token)
	return nil
}

func (s *authService) ResendVerification(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil { return err }
	if user.EmailVerified { return fmt.Errorf("⚠ Email sudah terverifikasi") }
	token, _ := randomHex(32)
	s.rdb.Set(ctx, "verify:"+token, user.Email, 24*time.Hour)
	go s.mailer.SendEmailVerification(context.Background(), user.Email, token)
	return nil
}

// SubscribeTier upgrades a creator's tier by deducting credits.
func (s *authService) SubscribeTier(ctx context.Context, userID uuid.UUID, tierID uuid.UUID) error {
	profile, err := s.userRepo.FindCreatorByUserID(ctx, userID)
	if err != nil {
		return entity.ErrNotFound
	}

	tier, err := s.platformRepo.FindTier(ctx, tierID)
	if err != nil {
		return entity.ErrNotFound
	}

	// 1.26: Idempotency — if already on this tier and not expired, skip
	if profile.TierID != nil && *profile.TierID == tierID && profile.TierExpiresAt != nil && profile.TierExpiresAt.After(time.Now()) {
		return fmt.Errorf("⚠ Kamu sudah berlangganan tier ini. Berlaku sampai %s", profile.TierExpiresAt.Format("2 Jan 2006"))
	}

	// Downgrade to Free
	if tier.PriceIDR == 0 {
		profile.TierID = &tier.ID
		profile.Tier = nil
		profile.TierExpiresAt = nil
		feeP := tier.FeePercent
		profile.CustomFeePercent = &feeP
		profile.StorageQuotaBytes = tier.StorageBytes
		return s.userRepo.UpdateCreatorProfile(ctx, profile)
	}

	// 1.29: Use platform settings for credit rate, not hardcode
	settings, err := s.platformRepo.GetSettings(ctx)
	if err != nil { return err }
	creditRate := settings.CreditRateIDR
	if creditRate <= 0 { creditRate = 1000 }
	tierCredits := tier.PriceIDR / creditRate

	wallet, err := s.walletRepo.FindOrCreateWallet(ctx, userID)
	if err != nil { return entity.ErrNotFound }
	if wallet.BalanceCredits < tierCredits {
		return entity.ErrInsufficientCredit
	}

	// 1.30: Deduct + update in sequence, refund on failure
	if err := s.walletRepo.DeductCredits(ctx, userID, tierCredits); err != nil {
		return err
	}

	profile.TierID = &tier.ID
	profile.Tier = nil
	expires := time.Now().AddDate(0, 1, 0)
	profile.TierExpiresAt = &expires
	feeP := tier.FeePercent
	profile.CustomFeePercent = &feeP
	profile.StorageQuotaBytes = tier.StorageBytes
	if err := s.userRepo.UpdateCreatorProfile(ctx, profile); err != nil {
		// Refund on failure
		_ = s.walletRepo.AddCredits(ctx, userID, tierCredits)
		return err
	}

	// Send tier upgrade email
	if user, err := s.userRepo.FindByID(ctx, userID); err == nil {
		go s.mailer.SendTierUpgrade(context.Background(), user.Email, tier.Name)
	}
	return nil
}

func (s *authService) RequestDeleteAccount(ctx context.Context, userID uuid.UUID, password string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil { return err }
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return entity.ErrUnauthorized
	}
	scheduledAt := time.Now().AddDate(0, 0, 30)
	user.DeletionScheduledAt = &scheduledAt
	return s.userRepo.Update(ctx, user)
}

func (s *authService) CancelDeleteAccount(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil { return err }
	user.DeletionScheduledAt = nil
	return s.userRepo.Update(ctx, user)
}

func (s *authService) ExportData(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil { return nil, err }
	data := map[string]interface{}{
		"user": map[string]interface{}{
			"id": user.ID, "username": user.Username, "display_name": user.DisplayName,
			"role": user.Role, "created_at": user.CreatedAt,
		},
	}
	if profile, err := s.userRepo.FindCreatorByUserID(ctx, userID); err == nil {
		data["creator_profile"] = map[string]interface{}{
			"page_slug": profile.PageSlug, "follower_count": profile.FollowerCount,
			"total_earnings": profile.TotalEarnings,
		}
	}
	return data, nil
}

// ---------------------------------------------------------------------------
// 2FA
// ---------------------------------------------------------------------------

const (
	twoFAChallengePrefix = "2fa_challenge:"
	twoFAOTPPrefix       = "2fa_otp:"
	twoFAChallengeTTL    = 10 * time.Minute
	twoFAOTPTTL          = 5 * time.Minute
)

func (s *authService) EnableTwoFA(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	otp, err := generateOTP()
	if err != nil {
		return fmt.Errorf("enable_2fa: generate otp: %w", err)
	}
	if err := s.rdb.Set(ctx, twoFAOTPPrefix+userID.String(), otp, twoFAOTPTTL).Err(); err != nil {
		return fmt.Errorf("enable_2fa: store otp: %w", err)
	}
	go s.mailer.SendTwoFAOTP(context.Background(), user.Email, otp)
	return nil
}

func (s *authService) VerifyTwoFA(ctx context.Context, userID uuid.UUID, otp string) error {
	stored, err := s.rdb.Get(ctx, twoFAOTPPrefix+userID.String()).Result()
	if err != nil {
		return entity.ErrInvalidToken
	}
	if stored != otp {
		return entity.ErrUnauthorized
	}
	s.rdb.Del(ctx, twoFAOTPPrefix+userID.String())
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	user.TwoFAEnabled = true
	return s.userRepo.Update(ctx, user)
}

func (s *authService) DisableTwoFA(ctx context.Context, userID uuid.UUID, password string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return entity.ErrUnauthorized
	}
	user.TwoFAEnabled = false
	return s.userRepo.Update(ctx, user)
}

func (s *authService) LoginWithTwoFA(ctx context.Context, challengeToken, otp string) (*LoginResponse, error) {
	key := twoFAChallengePrefix + challengeToken
	val, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		return nil, entity.ErrInvalidToken
	}
	// val format: "userID:role"
	parts := splitTwo(val, ":")
	if len(parts) != 2 {
		return nil, entity.ErrInvalidToken
	}
	userID, err := uuid.Parse(parts[0])
	if err != nil {
		return nil, entity.ErrInvalidToken
	}
	role := parts[1]
	// Verify OTP
	stored, err := s.rdb.Get(ctx, twoFAOTPPrefix+userID.String()).Result()
	if err != nil || stored != otp {
		return nil, entity.ErrUnauthorized
	}
	s.rdb.Del(ctx, key)
	s.rdb.Del(ctx, twoFAOTPPrefix+userID.String())
	return s.issueTokenPair(ctx, userID, role)
}

// generateOTP creates a 6-digit numeric OTP.
func generateOTP() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	n := (int(b[0])<<16 | int(b[1])<<8 | int(b[2])) % 1_000_000
	return fmt.Sprintf("%06d", n), nil
}

func splitTwo(s, sep string) []string {
	idx := len(s)
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] == sep[0] {
			idx = i
			break
		}
	}
	if idx == len(s) {
		return []string{s}
	}
	return []string{s[:idx], s[idx+1:]}
}

// ---------------------------------------------------------------------------
// QR Login
// ---------------------------------------------------------------------------

const (
	qrLoginPrefix = "qr_login:"
	qrLoginTTL    = 5 * time.Minute
)

func (s *authService) GenerateQRLogin(ctx context.Context) (string, error) {
	token, err := randomHex(16)
	if err != nil {
		return "", fmt.Errorf("qr_login: generate token: %w", err)
	}
	if err := s.rdb.Set(ctx, qrLoginPrefix+token, "pending", qrLoginTTL).Err(); err != nil {
		return "", fmt.Errorf("qr_login: store token: %w", err)
	}
	return token, nil
}

func (s *authService) ConfirmQRLogin(ctx context.Context, qrToken string, userID uuid.UUID, role string) error {
	key := qrLoginPrefix + qrToken
	existing, err := s.rdb.Get(ctx, key).Result()
	if err != nil || existing != "pending" {
		return entity.ErrInvalidToken
	}
	val := userID.String() + ":" + role
	return s.rdb.Set(ctx, key, val, qrLoginTTL).Err()
}

func (s *authService) PollQRLogin(ctx context.Context, qrToken string) (*LoginResponse, error) {
	key := qrLoginPrefix + qrToken
	val, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		return nil, entity.ErrNotFound
	}
	if val == "pending" {
		return nil, entity.ErrNotFound // still waiting
	}
	parts := splitTwo(val, ":")
	if len(parts) != 2 {
		return nil, entity.ErrInvalidToken
	}
	userID, err := uuid.Parse(parts[0])
	if err != nil {
		return nil, entity.ErrInvalidToken
	}
	s.rdb.Del(ctx, key)
	return s.issueTokenPair(ctx, userID, parts[1])
}

// ---------------------------------------------------------------------------
// Referral
// ---------------------------------------------------------------------------

func (s *authService) GetMyReferralCode(ctx context.Context, userID uuid.UUID) (*entity.ReferralCode, error) {
	return s.userRepo.GetOrCreateReferralCode(ctx, userID)
}

func (s *authService) ListMyReferrals(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.ReferralUse, *uuid.UUID, error) {
	ref, err := s.userRepo.GetOrCreateReferralCode(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	uses, err := s.userRepo.ListReferralUses(ctx, ref.ID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(uses) > limit {
		next = &uses[limit].ID
		uses = uses[:limit]
	}
	return uses, next, nil
}

func (s *authService) GetReferralStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	ref, err := s.userRepo.GetOrCreateReferralCode(ctx, userID)
	if err != nil {
		return nil, err
	}
	totalEarned, err := s.userRepo.CountReferralEarnings(ctx, userID)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"code":                 ref.Code,
		"total_referred":       ref.UsedCount,
		"total_credits_earned": totalEarned,
		"reward_per_referral":  ref.RewardCredits,
	}, nil
}

// ---------------------------------------------------------------------------
// Donation Settings
// ---------------------------------------------------------------------------

func (s *authService) UpdateDonationSettings(ctx context.Context, userID uuid.UUID, enabled *bool, minAmount *int, presets []int64) error {
	cp, err := s.userRepo.FindCreatorByUserID(ctx, userID)
	if err != nil {
		return entity.ErrNotFound
	}
	if enabled != nil {
		cp.DonationEnabled = *enabled
	}
	if minAmount != nil && *minAmount >= 0 {
		cp.DonationMinAmount = *minAmount
	}
	if len(presets) > 0 {
		// Stored as a plain JSON array, matching the column's default shape.
		cp.DonationPresetAmounts = entity.Int64Array(presets)
	}
	cp.Tier = nil
	return s.userRepo.UpdateCreatorProfile(ctx, cp)
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

func (s *authService) UpdateTags(ctx context.Context, userID uuid.UUID, tags []string) error {
	cp, err := s.userRepo.FindCreatorByUserID(ctx, userID)
	if err != nil {
		return entity.ErrNotFound
	}
	// Sanitize tags: max 5, max 20 chars each
	sanitized := make([]string, 0, 5)
	for _, t := range tags {
		t = validator.SanitizeString(t)
		if t == "" || len(t) > 20 {
			continue
		}
		sanitized = append(sanitized, t)
		if len(sanitized) == 5 {
			break
		}
	}
	cp.Tags = sanitized
	cp.Tier = nil
	return s.userRepo.UpdateCreatorProfile(ctx, cp)
}

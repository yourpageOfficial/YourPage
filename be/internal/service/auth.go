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
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
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
	UpdateProfile(ctx context.Context, userID uuid.UUID, displayName, bio, avatarURL, pageColor, headerImage *string, chatPrice *int64, chatAllowFrom *string, autoReply *string, socialLinks map[string]interface{}, goalTitle *string, goalAmount *int64, welcomeMsg, overlayStyle, overlayText *string) error
	ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, userID uuid.UUID) error
	SubscribeTier(ctx context.Context, userID uuid.UUID, tierID uuid.UUID) error
}

// ------------------------------------------------------------------ Redis key helpers

const (
	refreshKeyPrefix = "refresh:"
	resetKeyPrefix   = "reset:"
	refreshTTL       = 7 * 24 * time.Hour
	resetTTL         = 15 * time.Minute
)

func refreshKey(token string) string { return refreshKeyPrefix + token }
func resetKey(token string) string   { return resetKeyPrefix + token }

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
	go s.mailer.SendWelcome(ctx, user.Email, user.DisplayName)
	verifyToken, _ := randomHex(32)
	s.rdb.Set(ctx, "verify:"+verifyToken, user.Email, 24*time.Hour)
	go s.mailer.SendEmailVerification(ctx, user.Email, verifyToken)

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
		return nil, fmt.Errorf("Terlalu banyak percobaan login. Coba lagi dalam 15 menit.")
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
	return s.issueTokenPair(ctx, user.ID, string(user.Role))
}

// Logout invalidates the refresh token stored in Redis.
func (s *authService) Logout(ctx context.Context, _ uuid.UUID, refreshToken, accessToken string) error {
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
	iter := s.rdb.Scan(ctx, 0, refreshKeyPrefix+"*", 100).Iterator()
	for iter.Next(ctx) {
		val, _ := s.rdb.Get(ctx, iter.Val()).Result()
		if val == user.ID.String() {
			s.rdb.Del(ctx, iter.Val())
		}
	}

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
func (s *authService) UpdateProfile(ctx context.Context, userID uuid.UUID, displayName, bio, avatarURL, pageColor, headerImage *string, chatPrice *int64, chatAllowFrom *string, autoReply *string, socialLinks map[string]interface{}, goalTitle *string, goalAmount *int64, welcomeMsg, overlayStyle, overlayText *string) error {
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
	iter := s.rdb.Scan(ctx, 0, refreshKeyPrefix+"*", 100).Iterator()
	for iter.Next(ctx) {
		val, _ := s.rdb.Get(ctx, iter.Val()).Result()
		if val == userID.String() { s.rdb.Del(ctx, iter.Val()) }
	}
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
	if user.EmailVerified { return fmt.Errorf("Email sudah terverifikasi") }
	token, _ := randomHex(32)
	s.rdb.Set(ctx, "verify:"+token, user.Email, 24*time.Hour)
	go s.mailer.SendEmailVerification(ctx, user.Email, token)
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
		return fmt.Errorf("Kamu sudah berlangganan tier ini. Berlaku sampai %s", profile.TierExpiresAt.Format("2 Jan 2006"))
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
		go s.mailer.SendTierUpgrade(ctx, user.Email, tier.Name)
	}
	return nil
}

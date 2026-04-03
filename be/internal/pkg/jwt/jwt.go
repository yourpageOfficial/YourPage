package jwt

import (
	"errors"
	"fmt"
	"time"

	gojwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
)

const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// Claims is the JWT payload used by this application.
type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	Role      string    `json:"role"`
	TokenType string    `json:"token_type"`
	gojwt.RegisteredClaims
}

// GenerateAccessToken creates a signed access JWT.
func GenerateAccessToken(cfg config.JWTConfig, userID uuid.UUID, role string) (string, error) {
	return generate(cfg, userID, role, TokenTypeAccess, cfg.AccessTTL)
}

// GenerateRefreshToken creates a signed refresh JWT.
func GenerateRefreshToken(cfg config.JWTConfig, userID uuid.UUID, role string) (string, error) {
	return generate(cfg, userID, role, TokenTypeRefresh, cfg.RefreshTTL)
}

// ParseToken validates tokenStr and returns the claims on success.
func ParseToken(cfg config.JWTConfig, tokenStr string) (*Claims, error) {
	token, err := gojwt.ParseWithClaims(tokenStr, &Claims{}, func(t *gojwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*gojwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("jwt: unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(cfg.Secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("jwt: parse: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("jwt: invalid token")
	}

	return claims, nil
}

// generate is the shared token creation helper.
func generate(cfg config.JWTConfig, userID uuid.UUID, role, tokenType string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID:    userID,
		Role:      role,
		TokenType: tokenType,
		RegisteredClaims: gojwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  gojwt.NewNumericDate(now),
			ExpiresAt: gojwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := gojwt.NewWithClaims(gojwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(cfg.Secret))
	if err != nil {
		return "", fmt.Errorf("jwt: sign: %w", err)
	}

	return signed, nil
}

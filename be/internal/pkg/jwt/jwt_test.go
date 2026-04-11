package jwt_test

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	pkgjwt "github.com/yourpage/be/internal/pkg/jwt"
)

var testCfg = config.JWTConfig{Secret: "test-secret", AccessTTL: 15 * time.Minute, RefreshTTL: 7 * 24 * time.Hour}

func TestGenerateAndParseAccessToken(t *testing.T) {
	uid := uuid.New()
	token, err := pkgjwt.GenerateAccessToken(testCfg, uid, "creator")
	if err != nil { t.Fatal(err) }
	claims, err := pkgjwt.ParseToken(testCfg, token)
	if err != nil { t.Fatal(err) }
	if claims.UserID != uid { t.Errorf("got %s, want %s", claims.UserID, uid) }
	if claims.Role != "creator" { t.Errorf("got %s, want creator", claims.Role) }
	if claims.TokenType != pkgjwt.TokenTypeAccess { t.Errorf("got %s, want access", claims.TokenType) }
}

func TestGenerateAndParseRefreshToken(t *testing.T) {
	uid := uuid.New()
	token, err := pkgjwt.GenerateRefreshToken(testCfg, uid, "supporter")
	if err != nil { t.Fatal(err) }
	claims, err := pkgjwt.ParseToken(testCfg, token)
	if err != nil { t.Fatal(err) }
	if claims.TokenType != pkgjwt.TokenTypeRefresh { t.Errorf("got %s, want refresh", claims.TokenType) }
}

func TestInvalidSecret(t *testing.T) {
	uid := uuid.New()
	token, _ := pkgjwt.GenerateAccessToken(testCfg, uid, "admin")
	badCfg := config.JWTConfig{Secret: "wrong-secret", AccessTTL: 15 * time.Minute}
	_, err := pkgjwt.ParseToken(badCfg, token)
	if err == nil { t.Error("expected error for wrong secret") }
}

func TestExpiredToken(t *testing.T) {
	cfg := config.JWTConfig{Secret: "test-secret", AccessTTL: -1 * time.Second}
	uid := uuid.New()
	token, _ := pkgjwt.GenerateAccessToken(cfg, uid, "supporter")
	_, err := pkgjwt.ParseToken(testCfg, token)
	if err == nil { t.Error("expected error for expired token") }
}

func TestInvalidRole(t *testing.T) {
	cfg := testCfg
	uid := uuid.New()
	token, _ := pkgjwt.GenerateAccessToken(cfg, uid, "hacker")
	_, err := pkgjwt.ParseToken(cfg, token)
	if err == nil { t.Error("expected error for invalid role") }
}

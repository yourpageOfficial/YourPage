package testutil

import (
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	pkgjwt "github.com/yourpage/be/internal/pkg/jwt"
	"time"
)

var TestJWTConfig = config.JWTConfig{
	Secret:     "test-secret-key-for-unit-tests",
	AccessTTL:  15 * time.Minute,
	RefreshTTL: 7 * 24 * time.Hour,
}

// GenerateTestToken creates a valid access token for testing.
func GenerateTestToken(userID uuid.UUID, role string) string {
	token, _ := pkgjwt.GenerateAccessToken(TestJWTConfig, userID, role, "id")
	return token
}

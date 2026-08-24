package middleware

import (
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/audit"
	pkgjwt "github.com/yourpage/be/internal/pkg/jwt"
	"github.com/yourpage/be/internal/pkg/response"
)

const (
	ContextKeyUserID = "userID"
	ContextKeyRole   = "role"

	blacklistKeyPrefix = "blacklist:"
)

// AuthRequired rejects requests that don't carry a valid, non-blacklisted Bearer token.
func AuthRequired(jwtCfg config.JWTConfig, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := extractClaims(c, jwtCfg)
		if err != nil {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		// Check token blacklist (e.g. after logout the access token was blacklisted).
		raw := bearerToken(c)
		if rdb.Exists(c.Request.Context(), blacklistKeyPrefix+raw).Val() > 0 {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		// 12.9: Check if user is banned
		if rdb.Exists(c.Request.Context(), "banned:"+claims.UserID.String()).Val() > 0 {
			response.Forbidden(c)
			c.Abort()
			return
		}

		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyRole, entity.UserRole(claims.Role))
		// Propagate actor + IP into the request context for the payment audit trail.
		reqCtx := audit.WithActor(c.Request.Context(), claims.UserID, claims.Role)
		reqCtx = audit.WithIP(reqCtx, c.ClientIP())
		c.Request = c.Request.WithContext(reqCtx)
		c.Next()
	}
}

// OptionalAuth populates context values when a valid token is present,
// but does not abort the request if no token is provided.
func OptionalAuth(jwtCfg config.JWTConfig, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := extractClaims(c, jwtCfg)
		if err != nil {
			c.Next()
			return
		}

		raw := bearerToken(c)
		if rdb.Exists(c.Request.Context(), blacklistKeyPrefix+raw).Val() > 0 {
			c.Next()
			return
		}

		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyRole, entity.UserRole(claims.Role))
		// Propagate actor + IP into the request context for the payment audit trail.
		reqCtx := audit.WithActor(c.Request.Context(), claims.UserID, claims.Role)
		reqCtx = audit.WithIP(reqCtx, c.ClientIP())
		c.Request = c.Request.WithContext(reqCtx)
		c.Next()
	}
}

// extractClaims reads the Authorization header and parses the JWT.
func extractClaims(c *gin.Context, jwtCfg config.JWTConfig) (*pkgjwt.Claims, error) {
	raw := bearerToken(c)
	if raw == "" {
		return nil, errors.New("no token")
	}

	claims, err := pkgjwt.ParseToken(jwtCfg, raw)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != pkgjwt.TokenTypeAccess {
		return nil, errors.New("wrong token type")
	}

	return claims, nil
}

// bearerToken extracts the token from the Authorization header first, falling
// back to the HttpOnly cookie.
//
// Precedence matters: an Authorization header is a credential the caller
// deliberately attached, while a cookie is ambient authority the browser sends
// on its own. Reading the cookie first meant a request carrying an explicit
// Bearer token was silently executed as whoever the cookie belonged to — so a
// page holding an admin cookie would run a lower-privilege token's request
// with admin rights, and a freshly issued token could lose to a stale cookie.
func bearerToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		if token := strings.TrimPrefix(header, "Bearer "); token != "" {
			return token
		}
	}
	if token, err := c.Cookie("access_token"); err == nil && token != "" {
		return token
	}
	return ""
}

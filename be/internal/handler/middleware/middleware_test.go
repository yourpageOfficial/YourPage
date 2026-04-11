package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yourpage/be/internal/handler/middleware"
)

func init() { gin.SetMode(gin.TestMode) }

func TestRateLimiterAllows(t *testing.T) {
	rl := middleware.NewRateLimiter(10, 20)
	r := gin.New()
	r.GET("/test", rl.Middleware(), func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK { t.Errorf("got %d, want 200", w.Code) }
}

func TestRateLimiterBlocks(t *testing.T) {
	rl := middleware.NewRateLimiter(1, 1) // very strict
	r := gin.New()
	r.GET("/test", rl.Middleware(), func(c *gin.Context) { c.JSON(200, nil) })

	// First request should pass
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "5.6.7.8:1234"
	r.ServeHTTP(w, req)
	if w.Code != 200 { t.Fatalf("first request: got %d, want 200", w.Code) }

	// Rapid subsequent requests should be rate limited
	blocked := false
	for i := 0; i < 10; i++ {
		w = httptest.NewRecorder()
		req = httptest.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "5.6.7.8:1234"
		r.ServeHTTP(w, req)
		if w.Code == http.StatusTooManyRequests { blocked = true; break }
	}
	if !blocked { t.Error("expected rate limit to kick in") }
}

func TestSecurityHeaders(t *testing.T) {
	r := gin.New()
	r.Use(middleware.SecurityHeaders())
	r.GET("/test", func(c *gin.Context) { c.JSON(200, nil) })

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("GET", "/test", nil))

	headers := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":       "DENY",
		"X-XSS-Protection":      "1; mode=block",
	}
	for k, v := range headers {
		if got := w.Header().Get(k); got != v {
			t.Errorf("header %s = %q, want %q", k, got, v)
		}
	}
}

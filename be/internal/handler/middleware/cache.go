package middleware

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// Cache caches GET responses in Redis for the given TTL.
func Cache(rdb *redis.Client, ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}

		key := fmt.Sprintf("cache:%x", sha256.Sum256([]byte(c.Request.URL.String())))

		cached, err := rdb.Get(c.Request.Context(), key).Bytes()
		if err == nil {
			c.Header("X-Cache", "HIT")
			c.Data(http.StatusOK, "application/json", cached)
			c.Abort()
			return
		}

		w := &responseWriter{ResponseWriter: c.Writer, body: []byte{}}
		c.Writer = w
		c.Next()

		if c.Writer.Status() == http.StatusOK && len(w.body) > 0 {
			rdb.Set(c.Request.Context(), key, w.body, ttl)
		}
	}
}

// InvalidateCache deletes cache entries matching a prefix pattern.
func InvalidateCache(rdb *redis.Client, ctx context.Context, patterns ...string) {
	for _, p := range patterns {
		iter := rdb.Scan(ctx, 0, "cache:"+p+"*", 100).Iterator()
		for iter.Next(ctx) {
			rdb.Del(ctx, iter.Val())
		}
	}
}

type responseWriter struct {
	gin.ResponseWriter
	body []byte
}

func (w *responseWriter) Write(b []byte) (int, error) {
	w.body = append(w.body, b...)
	return w.ResponseWriter.Write(b)
}

# Batch 5: Performance, Security & Final Polish
> Production hardening — scalable, secure, reliable

**Status**: ✅ Selesai (2026-04-11)
**Priority**: MEDIUM-HIGH — Production readiness
**Dependency**: Batch 1-4 BE selesai
**Estimasi Files**: ~15 modified, ~2 migration baru

---

## 5.1 API Response Consistency

**Problem**: Response format mungkin tidak konsisten antar endpoints.

### Standard Response Envelope
- [x] Audit semua handler responses — pastikan format konsisten:
  ```go
  // Success
  { "data": {...}, "message": "Success" }

  // Success List
  { "data": [...], "total": 100, "page": 1, "limit": 20, "has_more": true }

  // Error
  { "error": "error_code", "message": "Human readable message" }
  ```
- [x] Buat response helper kalau belum ada:
  ```go
  response.Success(c, data)
  response.Paginated(c, data, total, page, limit)
  response.Error(c, statusCode, errorCode, message)
  ```
- [x] Audit: cari handler yang return format berbeda, standardize

### Error Code Catalog
- [x] Definisikan error codes:
  ```
  auth_required, auth_invalid, auth_expired
  forbidden, not_found, validation_error
  insufficient_credits, storage_limit_exceeded
  rate_limited, server_error
  ```
- [x] Semua error response pakai code dari catalog (bukan freeform string)
- [x] FE bisa handle error berdasarkan code (bukan parse message string)

### Files yang dimodifikasi:
- `/be/internal/pkg/response/response.go` (standard helpers)
- `/be/internal/handler/*.go` (semua handler — standardize responses)

---

## 5.2 Rate Limiting — Fine-Tuning

**Problem**: Rate limiting ada tapi mungkin terlalu generic.

### Per-Endpoint Rate Limits
- [x] Audit current rate limits di middleware
- [x] Critical endpoints yang butuh strict limits:
  ```
  POST /auth/login          — 5/min per IP (brute force prevention)
  POST /auth/register       — 3/min per IP
  POST /auth/forgot-password — 3/min per IP
  POST /checkout/*          — 10/min per user (prevent spam purchases)
  POST /donations           — 10/min per user
  POST /chat                — 30/min per user
  POST /posts/:id/comments  — 10/min per user
  POST /posts/:id/like      — 30/min per user
  POST /upload              — 10/min per user
  POST /creator/broadcast   — already limited by tier
  ```

### Rate Limit Response
- [x] Return proper headers:
  ```
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 7
  X-RateLimit-Reset: 1680000000
  Retry-After: 30
  ```
- [x] Response body:
  ```json
  { "error": "rate_limited", "message": "Terlalu banyak request. Coba lagi dalam 30 detik.", "retry_after": 30 }
  ```

### Files yang dimodifikasi:
- `/be/internal/handler/middleware/ratelimit.go`
- `/be/internal/handler/router.go` (per-route rate limit config)

---

## 5.3 Caching Strategy — Optimization

**Problem**: Redis caching ada tapi mungkin bisa dioptimalkan.

### Cache Priorities
- [x] **Heavy read, rare write** — cache aggressively:
  ```
  GET /creators/:slug        — 30s (invalidate on profile update)
  GET /creators/featured     — 5min
  GET /creators/search       — 30s (per query key)
  GET /settings/public       — 10min
  GET /tiers                 — 10min
  GET /posts/:id             — 30s (invalidate on edit/like/comment)
  GET /products/:id          — 30s (invalidate on edit)
  ```

### Cache Invalidation
- [x] Audit: saat data berubah, apakah cache di-invalidate?
  - Creator update profile → invalidate `/creators/:slug`
  - Post edit/delete → invalidate `/posts/:id`
  - Like/comment → invalidate post cache
  - Settings update → invalidate `/settings/public`
- [x] Pattern: `cache.Delete(fmt.Sprintf("creator:%s", slug))`

### Cache Keys
- [x] Standardize key format: `yourpage:{entity}:{id}:{variant}`
  - `yourpage:creator:johndoe:profile`
  - `yourpage:post:uuid:detail`
  - `yourpage:settings:public`

### Files yang dimodifikasi:
- `/be/internal/handler/middleware/cache.go`
- `/be/internal/infrastructure/redis.go` (invalidation helpers)
- `/be/internal/service/*.go` (invalidate on write operations)

---

## 5.4 Security Hardening

**Problem**: Basic security ada, tapi perlu hardening.

### Input Validation
- [x] Audit semua handler: validate ALL user input
- [x] Max lengths:
  ```
  display_name: 50 chars
  bio: 500 chars
  post title: 200 chars
  post content: 50000 chars
  comment: 2000 chars
  chat message: 5000 chars
  donation message: 500 chars
  ```
- [x] Sanitize HTML in user content (XSS prevention)
- [x] Validate file types on upload (not just extension — check magic bytes)
- [x] Validate file sizes: image max 5MB, document max 50MB, product asset max 500MB

### SQL Injection
- [x] Audit: semua GORM queries pakai parameterized queries (not raw string concat)
- [x] Grep for `db.Raw()` — pastikan semua pakai `?` placeholders

### Authentication
- [x] Token expiry: access token 15min, refresh token 7 days
- [x] Refresh token rotation (invalidate old refresh after use)
- [x] Max sessions per user (e.g., 5 active sessions)
- [x] Password requirements: min 8 chars, audit `validator`

### File Upload Security
- [x] Validate MIME types server-side
- [x] Generate random filenames (don't use user input)
- [x] Signed URLs for downloads (already using MinIO presigned)
- [x] Prevent path traversal in file operations

### Files yang dimodifikasi:
- `/be/internal/pkg/validator/validator.go` (validation rules)
- `/be/internal/handler/*.go` (input validation)
- `/be/internal/pkg/storage/minio.go` (file validation)
- `/be/internal/pkg/jwt/jwt.go` (token config)

---

## 5.5 Background Jobs — Reliability

**Problem**: Background jobs run in goroutines. Crash = data inconsistency.

### Error Handling
- [x] Semua background jobs: wrap in recover():
  ```go
  go func() {
    defer func() {
      if r := recover(); r != nil {
        logger.Error().Interface("panic", r).Msg("background job panic")
      }
    }()
    // job logic
  }()
  ```
- [x] Log setiap job execution: start, success, error, duration
- [x] Alert (notification to admin) kalau job fails repeatedly

### Job Monitoring
- [x] Expose job status via `/admin/jobs` or `/health`:
  ```json
  {
    "jobs": {
      "post_publisher": { "last_run": "2026-04-11T10:00:00Z", "status": "ok" },
      "tier_expiry": { "last_run": "2026-04-11T10:00:00Z", "status": "ok" },
      "membership_renewal": { "last_run": "2026-04-11T10:00:00Z", "status": "error", "error": "..." }
    }
  }
  ```

### Idempotency
- [x] Semua jobs harus idempotent (safe to re-run):
  - Tier expiry: only expire if not already expired
  - Membership renewal: only renew if not already renewed this period
  - Notification cleanup: safe to run multiple times

### Files yang dimodifikasi:
- `/be/cmd/api/main.go` (job wrapper, monitoring)
- `/be/internal/handler/admin.go` (job status endpoint)

---

## 5.6 Database Optimization

**Problem**: As data grows, queries slow down.

### Index Audit
- [x] Check indexes exist for:
  ```sql
  -- High-frequency queries
  CREATE INDEX IF NOT EXISTS idx_posts_creator_created ON posts(creator_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_payments_user_created ON payments(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_donations_creator ON donations(creator_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
  CREATE INDEX IF NOT EXISTS idx_follows_creator ON follows(creator_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_memberships_creator ON memberships(creator_id, status);
  ```

### Query Optimization
- [x] Audit slow queries (enable PostgreSQL slow query log)
- [x] Feed query: pastikan efficient (joins, subqueries)
- [x] Creator search: consider pg_trgm extension for fuzzy search
- [x] Analytics queries: consider materialized views atau summary tables untuk heavy aggregations

### Connection Pool
- [x] GORM connection pool settings:
  ```go
  sqlDB.SetMaxOpenConns(25)
  sqlDB.SetMaxIdleConns(10)
  sqlDB.SetConnMaxLifetime(5 * time.Minute)
  ```
- [x] Redis pool settings appropriate for load

### Files yang dimodifikasi:
- `/be/migrations/048_indexes.sql` (BARU — missing indexes)
- `/be/internal/repository/postgres/db.go` (connection pool)
- `/be/internal/repository/postgres/*.go` (query optimization)

---

## 5.7 Health Check & Monitoring Enhancement

### Health Check
- [x] `GET /health` — comprehensive check:
  ```json
  {
    "status": "healthy",
    "postgres": "ok",
    "redis": "ok",
    "minio": "ok",
    "uptime": "72h15m",
    "version": "1.0.0"
  }
  ```
- [x] Return 503 if any dependency unhealthy

### Prometheus Metrics
- [x] Pastikan metrics include:
  - Request count by endpoint + status code
  - Request duration histogram
  - Active connections
  - Background job execution count + errors
  - Credit transactions volume
  - User registrations

### Files yang dimodifikasi:
- `/be/internal/handler/router.go` (health check enhancement)
- `/be/internal/handler/middleware/metrics.go` (custom metrics)

---

## 5.8 API Documentation

### OpenAPI/Swagger
- [x] Generate OpenAPI spec dari handler annotations
- [x] Atau: manual `openapi.yaml` file
- [x] Serve at `/api/docs` (Swagger UI)
- [x] Include semua endpoints, request/response schemas, auth requirements
- [x] **Recommendation**: Pakai `swaggo/swag` untuk auto-generate dari comments

### Files baru:
- `/be/docs/swagger.json` (generated)
- `/be/internal/handler/router.go` (serve swagger UI)

---

## Checklist Selesai Batch 5 BE (FINAL)
- [x] API responses: consistent format semua endpoints
- [x] Rate limiting: per-endpoint, proper headers
- [x] Caching: optimized, invalidation working
- [x] Security: input validation, file validation, token hardening
- [x] Background jobs: error recovery, monitoring, idempotent
- [x] Database: indexes optimized, connection pool tuned
- [x] Health check: comprehensive, dependencies checked
- [x] Metrics: Prometheus metrics comprehensive
- [x] `go build ./...` PASS
- [x] `go test ./...` PASS
- [x] Load test: 100 concurrent users, no errors
- [x] Security scan: no critical vulnerabilities

---

## Dependency Chain BE ↔ FE

```
BE Batch 1 (API Gaps)        → enables → FE Batch 1-3
BE Batch 2 (Payment/Wallet)  → enables → FE Batch 3-4 (checkout, wallet pages)
BE Batch 3 (Chat/Content)    → enables → FE Batch 3-4 (chat, library, post detail)
BE Batch 4 (Admin)           → enables → FE Batch 5 (admin panel)
BE Batch 5 (Polish)          → enables → FE Batch 5 (final QA, performance)
```

### Parallel Execution Strategy
```
Week 1-2: BE Batch 1 + FE Batch 1 (parallel — FE does design system, BE fixes API gaps)
Week 3:   BE Batch 2 + FE Batch 2 (parallel — FE does auth/landing, BE fixes payment)
Week 4:   BE Batch 3 + FE Batch 3 (parallel — FE does content pages, BE enhances chat/content)
Week 5:   BE Batch 4 + FE Batch 4 (parallel — FE does dashboard, BE enhances admin)
Week 6:   BE Batch 5 + FE Batch 5 (parallel — both do final polish)
```

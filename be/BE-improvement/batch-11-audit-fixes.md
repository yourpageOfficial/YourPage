# Batch 11: Audit Fixes — BE Gaps dari Batch 1-10
> Item yang ditandai ✅ tapi belum benar-benar implemented atau ada bug

**Status**: ✅ Selesai (2026-04-11)
**Priority**: HIGH — Hasil audit code-reviewer
**Dependency**: BE Batch 1-10 selesai

---

## 11.1 CRITICAL — Harus Fix Segera

### Bug: CountCreatorSalesRange Missing Creator ID Filter
- [x] File: `/be/internal/repository/postgres/user.go` line ~246
- [x] Query `WHERE status = 'paid' AND created_at BETWEEN ? AND ?` — **tidak ada filter `creator_id`**
- [x] Return platform-wide sales bukan per-creator
- [x] Fix: tambah `AND creator_id = ?` atau equivalent join
- [x] Impact: analytics dashboard creator menampilkan data SALAH

### Xendit Integration — Masih Stub
- [x] File: `/be/internal/pkg/payment/xendit/xendit.go` — literal `// TODO: Implement`
- [x] Webhook handler `/be/internal/handler/webhook.go` — `// TODO: parse body`
- [x] Plan marked ✅ tapi code is a stub
- [x] **Options**:
  - A: Implement Xendit QRIS (jika API key ready)
  - B: Update plan status → "Deferred" dan ensure manual QRIS flow solid
  - C: Implement alternative payment gateway
- [x] Minimal: pastikan manual QRIS flow smooth (topup → proof → admin approve → credit)

### Product Download Tracking — 100% Missing
- [x] No migration file `046_product_downloads.sql`
- [x] No `ProductDownload` entity
- [x] No tracking code anywhere
- [x] **Implement**:
  - [x] Migration: create `product_downloads` table
  - [x] Entity: `ProductDownload` struct
  - [x] Handler: log download saat `GET /products/:id/download`
  - [x] Response: include `last_downloaded_at` di `GET /library/products`
  - [x] Creator: include `download_count` di `GET /products/creator/:creatorId`

### Admin Search/Filter — Tidak Ada
- [x] Semua admin list endpoints hanya terima `cursor` + `limit`
- [x] Tidak ada search, filter, sort, date range
- [x] **Implement standard filter parsing** di admin handler:
  ```go
  search := c.Query("search")
  status := c.Query("status")
  sortBy := c.DefaultQuery("sort", "created_at")
  order := c.DefaultQuery("order", "desc")
  from := c.Query("from")
  to := c.Query("to")
  ```
- [x] Apply ke SEMUA admin list endpoints:
  - `GET /admin/users` — search name/email, filter role/status
  - `GET /admin/posts` — search title, filter status/visibility
  - `GET /admin/products` — search name, filter status
  - `GET /admin/payments` — filter status/provider, date range
  - `GET /admin/withdrawals` — filter status, date range
  - `GET /admin/credit-topups` — filter status, date range
  - `GET /admin/kyc` — filter status
  - `GET /admin/reports` — filter status/type
  - `GET /admin/donations` — date range, sort amount
- [x] Update repository layer: dynamic WHERE clause builder

### Error Code Catalog — Tidak Ada
- [x] Semua errors = freeform Indonesian string
- [x] FE harus parse string untuk handle error — fragile
- [x] **Implement**:
  - [x] Buat `/be/internal/pkg/response/errors.go`:
    ```go
    const (
      ErrAuthRequired       = "auth_required"
      ErrAuthInvalid        = "auth_invalid"
      ErrAuthExpired        = "auth_expired"
      ErrForbidden          = "forbidden"
      ErrNotFound           = "not_found"
      ErrValidation         = "validation_error"
      ErrInsufficientCredits = "insufficient_credits"
      ErrStorageLimitExceeded = "storage_limit_exceeded"
      ErrRateLimited        = "rate_limited"
      ErrServerError        = "server_error"
      ErrAccountSuspended   = "account_suspended"
      ErrDuplicateEmail     = "duplicate_email"
      ErrWeakPassword       = "weak_password"
      ErrKYCRequired        = "kyc_required"
    )
    ```
  - [x] Update response helpers: `response.Error(c, 400, ErrInsufficientCredits, "Saldo tidak cukup")`
  - [x] FE switch by `error.code` bukan `error.message`
  - [x] Audit + update SEMUA handler error responses

### Admin Promo Listing — Tidak Ada
- [x] Tidak ada endpoint untuk list users dengan active promo
- [x] **Implement**:
  - [x] `GET /admin/promos` — query users WHERE promo active
  - [x] Response: user info, fee_discount, promo_started_at, promo_expires_at, featured
  - [x] Filter: active only, expired only, all
  - [x] Route registration di router.go

---

## 11.2 IMPORTANT — Sebaiknya Fix

### Refund Flow — Wrap in DB Transaction
- [x] File: `/be/internal/service/admin.go` RefundPayment method
- [x] Currently: separate DB calls, ignored errors (`_ = s.walletRepo.AddCredits(...)`)
- [x] Fix: wrap ALL refund operations in single `db.Transaction()`:
  ```go
  tx := s.db.Begin()
  // 1. Update payment status
  // 2. Refund credits to buyer
  // 3. Deduct from creator
  // 4. Delete purchase record
  // 5. Update creator earnings
  // 6. Create notifications
  tx.Commit()
  ```
- [x] Handle errors properly — rollback on any failure

### Wallet — FOR UPDATE Row Locking
- [x] CHECK constraint prevents negative balance at DB level ✓
- [x] Tapi purchase workflow (deduct → create payment → create purchase) tidak atomic
- [x] Jika create payment gagal setelah deduct, error path refund via separate call
- [x] Fix: wrap entire checkout di `db.Transaction()` dengan `FOR UPDATE` pada wallet row

### Chat Read Receipts — Not Implemented
- [x] No `last_read_at` field di `ChatConversation` entity
- [x] BE plan Option A (conversation-level) marked done tapi tidak ada
- [x] **Implement**:
  - [x] Tambah `LastReadCreator` + `LastReadSupporter` timestamp di entity
  - [x] `POST /:id/read` → update timestamp
  - [x] `GET /:id` response → include last_read timestamps
  - [x] FE: messages before `last_read_at` = "read" (double check icon)

### Checkout Fee Breakdown — Missing from Response
- [x] `handler/payment.go` checkout response tidak include `platform_fee`, `creator_receives`
- [x] Fix: tambah fields di response:
  ```json
  {
    "payment_id": "...",
    "total_credits": 500,
    "platform_fee": 100,
    "creator_receives": 400
  }
  ```

### Bulk Actions — Only 2 of 6
- [x] Implemented: topup bulk-approve, bulk-reject
- [x] Missing:
  - [x] `PATCH /admin/withdrawals/bulk-update`
  - [x] `PATCH /admin/kyc/bulk-update`
  - [x] `DELETE /admin/posts/bulk-delete`
  - [x] `POST /admin/users/bulk-ban`
- [x] Also: existing bulk endpoints loop satu-satu tanpa transaction — fix to use `db.Transaction()`

### BulkApproveTopups — No Transaction
- [x] File: `/be/internal/service/admin.go` line ~672
- [x] Loop satu-satu tanpa transaction — partial failure possible
- [x] Fix: wrap in `db.Transaction()`, rollback on any failure
- [x] Atau: process all, collect errors, return summary

### Admin Analytics — Basic Only
- [x] Currently: flat count map, no time-series
- [x] Missing:
  - [x] `GET /admin/analytics/chart?metric=revenue&period=30d`
  - [x] `GET /admin/analytics/breakdown` (revenue by source)
  - [x] Trend data: `new_today`, `new_this_week`, `trend_percent`
- [x] Implement chart endpoint + breakdown

### Audit Log — No Filters
- [x] `GET /admin/audit-log` exists tapi no filter capability
- [x] Tambah: filter by admin_user, action_type, date_range, target_user search

### Profit Tracking — No Breakdown/Chart
- [x] `GET /admin/profit` exists tapi flat
- [x] Missing: breakdown by source, `GET /admin/profit/chart?period=`

### Cache Invalidation — Not Implemented
- [x] `cache.go` middleware caches reads tapi no `Delete` function
- [x] Data stale sampai TTL expire (30s atau 5min)
- [x] Fix: tambah `CacheInvalidate(key)` helper
- [x] Call saat: profile update, post edit, settings update

### Rate Limit Headers — Missing
- [x] Only `Retry-After` returned on 429
- [x] Missing: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [x] Fix di `middleware/ratelimit.go`

### API Documentation — Not Implemented
- [x] No swagger/openapi files
- [x] No `/api/docs` endpoint
- [x] Options:
  - A: `swaggo/swag` auto-generate from comments
  - B: Manual `openapi.yaml`
  - C: Defer to phase 2

### Donation Goal Unit Inconsistency
- [x] Plan says `donation_goal_credits` — code says `donation_goal_amount`
- [x] Increment uses `netIDR` not credits
- [x] Clarify: apakah goal dalam credits atau IDR?
- [x] Make consistent + document for FE

### Health Check — Missing MinIO + Uptime
- [x] Currently checks PostgreSQL + Redis only
- [x] Missing: MinIO connectivity check, `uptime`, `version` fields

### Refund Notification Type Wrong
- [x] Uses `NotificationPurchaseSuccess` for refund notifications
- [x] Should be dedicated `NotificationRefund` type

### Membership Logic in Router
- [x] Membership subscription at `router.go` line ~340-368 has business logic in handler
- [x] Should be in service layer for testability

---

## 11.3 Prioritas Execution

### Phase 1 — Fix Bugs (1-2 jam)
1. CountCreatorSalesRange query fix
2. Refund notification type
3. Donation goal unit clarification

### Phase 2 — Critical Missing (4-6 jam)
4. Error code catalog
5. Admin search/filter
6. Product download tracking
7. Admin promo listing

### Phase 3 — Integrity (2-3 jam)
8. Refund DB transaction
9. Wallet FOR UPDATE
10. Bulk actions transaction

### Phase 4 — Enhancement (4-6 jam)
11. Chat read receipts
12. Checkout fee breakdown
13. Remaining bulk endpoints
14. Admin analytics chart + breakdown
15. Cache invalidation
16. Rate limit headers

### Phase 5 — Polish (2-3 jam)
17. Audit log filters
18. Profit breakdown/chart
19. Health check MinIO/uptime
20. API docs (or defer)

---

## Checklist Selesai
- [x] CountCreatorSalesRange: correct per-creator data
- [x] Error codes: standardized across all handlers
- [x] Admin filters: search, filter, sort, date range working
- [x] Product downloads: migration + tracking + response
- [x] Promo listing: admin endpoint working
- [x] Refund: atomic DB transaction
- [x] Wallet: FOR UPDATE in checkout
- [x] Chat read receipts: last_read timestamps
- [x] Checkout: fee breakdown in response
- [x] Bulk actions: all 6 endpoints + transactions
- [x] `go build ./...` PASS
- [x] `go test ./...` PASS

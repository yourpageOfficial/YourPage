# Batch 4: Admin, Promo & Business Logic Polish
> Admin efficiency + business rules yang solid

**Status**: ✅ Selesai (2026-04-11)
**Priority**: MEDIUM — Admin efficiency + business completeness
**Dependency**: Batch 2 BE (payment/wallet integrity)
**Estimasi Files**: ~10 modified, ~1 migration baru

---

## 4.1 Promo System — Dedicated Management

**Problem**: Promo saat ini embedded di user record via `POST /users/:id/promo`. Tidak ada listing, tracking, atau campaign management.

### Current State Audit
- [x] Audit `POST /admin/users/:id/promo`:
  - Apa yang disimpan? (`fee_discount`, `duration`, `featured`)
  - Di mana disimpan? (`creator_profiles` atau `users`?)
  - Bagaimana expiry di-handle?

### Option A: Keep Simple (RECOMMENDED V1)
- [x] Tambah admin endpoint: `GET /admin/promos` — list users dengan active promo
  - Filter: active only, expired only, all
  - Include: user info, promo details, start/end date, featured status
- [x] Tambah `promo_started_at`, `promo_expires_at` fields (kalau belum ada)
- [x] Background job: auto-remove expired promos

### Option B: Dedicated Promo Table (V2)
- [x] `promos` table: code, discount_percent, duration, max_uses, target_users
- [x] Promo codes untuk supporter (discount pada purchase)
- [x] Campaign tracking (impressions, conversions)
- [x] **Recommendation**: Terlalu complex untuk sekarang. V2.

### Files yang dimodifikasi:
- `/be/internal/handler/admin.go` (list promos endpoint)
- `/be/internal/service/admin.go` (promo listing logic)
- `/be/internal/repository/postgres/user.go` (query users with active promo)
- `/be/internal/handler/router.go` (register route)

---

## 4.2 Admin Bulk Actions

**Problem**: FE plan mau bulk actions di admin (bulk approve, reject, delete). BE mungkin hanya support single-item actions.

### Bulk Endpoints
- [x] `POST /admin/credit-topups/bulk-approve` — approve multiple topups
  ```json
  { "ids": ["uuid1", "uuid2", "uuid3"] }
  ```
- [x] `POST /admin/credit-topups/bulk-reject` — reject multiple
- [x] `PATCH /admin/withdrawals/bulk-update` — bulk status update
- [x] `PATCH /admin/kyc/bulk-update` — bulk approve/reject KYC
- [x] `DELETE /admin/posts/bulk-delete` — bulk delete posts
- [x] `POST /admin/users/bulk-ban` — bulk ban users

### Implementation Pattern
- [x] Validate all IDs exist
- [x] Process in DB transaction (all or nothing)
- [x] Return summary: `{ "success": 5, "failed": 0, "errors": [] }`
- [x] Audit log per item (not bulk)
- [x] Max 50 items per request (prevent abuse)

### Files yang dimodifikasi:
- `/be/internal/handler/admin.go` (bulk handlers)
- `/be/internal/service/admin.go` (bulk logic)
- `/be/internal/repository/postgres/*.go` (bulk queries)
- `/be/internal/handler/router.go` (routes)

---

## 4.3 Admin Analytics — Enhanced

**Problem**: FE plan mau charts, trends, breakdowns di admin dashboard. Current analytics mungkin terlalu basic.

### Enhanced Analytics Response
- [x] `GET /admin/analytics` — extend response:
  ```json
  {
    "users": {
      "total": 1500,
      "creators": 200,
      "supporters": 1280,
      "admins": 5,
      "new_today": 12,
      "new_this_week": 58,
      "trend_percent": 15.5
    },
    "revenue": {
      "total_credits": 500000,
      "total_idr": 500000000,
      "platform_profit": 100000000,
      "this_month": 45000000,
      "last_month": 38000000,
      "trend_percent": 18.4
    },
    "content": {
      "total_posts": 3200,
      "total_products": 450,
      "posts_today": 25,
      "products_today": 3
    },
    "transactions": {
      "total_payments": 8500,
      "total_donations": 2300,
      "total_topups": 1200,
      "pending_withdrawals": 15,
      "pending_topups": 8,
      "pending_kyc": 3
    }
  }
  ```

### Chart Data Endpoint
- [x] `GET /admin/analytics/chart?metric=revenue&period=30d`
  - Metrics: `revenue`, `users`, `transactions`, `donations`
  - Response: `[{ date: "2026-04-01", value: 1500000 }, ...]`
- [x] `GET /admin/analytics/breakdown`
  - Revenue by source (posts, products, donations, memberships)
  - Users by role
  - Payments by status

### Files yang dimodifikasi:
- `/be/internal/handler/admin.go` (analytics endpoints)
- `/be/internal/service/admin.go` (analytics logic)
- `/be/internal/repository/postgres/user.go` (aggregate queries)
- `/be/internal/repository/postgres/payment.go` (revenue queries)
- `/be/internal/handler/router.go` (routes)

---

## 4.4 Admin — Search & Filter Enhancement

**Problem**: FE plan mau search, filter, sort di semua admin list pages. BE mungkin belum support semua filter.

### Standard Admin List Query Params
Semua admin list endpoints harus support:
```
?search=keyword
&status=pending|approved|rejected
&sort=created_at|name|amount
&order=asc|desc
&page=1&limit=20
&from=2026-01-01&to=2026-04-11
```

### Endpoints to Audit & Enhance
- [x] `GET /admin/users` — search by name/email, filter by role/status
- [x] `GET /admin/posts` — search by title, filter by status/visibility
- [x] `GET /admin/products` — search by name, filter by status
- [x] `GET /admin/payments` — filter by status/provider/usecase, date range
- [x] `GET /admin/withdrawals` — filter by status, date range, sort by amount
- [x] `GET /admin/credit-topups` — filter by status, date range
- [x] `GET /admin/kyc` — filter by status
- [x] `GET /admin/reports` — filter by status/type
- [x] `GET /admin/donations` — filter by date range, sort by amount

### Response Standard
- [x] Semua admin list harus return:
  ```json
  {
    "data": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
  ```

### Files yang dimodifikasi:
- `/be/internal/handler/admin.go` (parse query params)
- `/be/internal/service/admin.go` (pass filters)
- `/be/internal/repository/postgres/*.go` (dynamic query building)

---

## 4.5 Audit Log — Enhanced

**Problem**: Admin audit log exists tapi mungkin tidak comprehensive.

### Audit Coverage
- [x] Pastikan SEMUA admin actions di-log:
  - User ban/unban
  - User verify/unverify
  - Promo set/remove
  - Withdrawal approve/reject
  - Topup approve/reject
  - KYC approve/reject
  - Post delete
  - Product delete
  - Report resolve/dismiss
  - Settings update
  - Finance user creation
  - Payment refund
  - Payment status update

### Audit Log Endpoint
- [x] `GET /admin/audit-log` — list audit logs
  - Filter by admin user, action type, date range
  - Search by target user
- [x] Include: who, what, when, target, details/notes

### Files yang dimodifikasi:
- `/be/internal/handler/middleware/audit.go` (ensure all actions logged)
- `/be/internal/handler/admin.go` (audit log list endpoint)
- `/be/internal/handler/router.go` (route)

---

## 4.6 Platform Profit Tracking

**Problem**: FE admin plan mau profit charts + revenue breakdown.

### Profit Endpoint Enhancement
- [x] `GET /admin/profit` — extend:
  ```json
  {
    "total_profit_idr": 50000000,
    "available_for_withdrawal": 45000000,
    "already_withdrawn": 5000000,
    "profit_this_month": 8000000,
    "profit_last_month": 6500000,
    "breakdown": {
      "from_post_sales": 20000000,
      "from_product_sales": 15000000,
      "from_donations": 10000000,
      "from_memberships": 5000000
    }
  }
  ```
- [x] `GET /admin/profit/chart?period=90d` — profit trend over time

### Files yang dimodifikasi:
- `/be/internal/handler/admin.go`
- `/be/internal/service/admin.go`
- `/be/internal/repository/postgres/payment.go` (profit queries)

---

## Checklist Selesai Batch 4 BE
- [x] Promo listing: admin bisa lihat semua active promos
- [x] Bulk actions: approve/reject multiple items at once
- [x] Admin analytics: enhanced with trends + chart data
- [x] Admin list filters: search, filter, sort, date range di semua endpoints
- [x] Audit log: comprehensive + viewable
- [x] Profit tracking: breakdown by source + chart
- [x] `go build ./...` PASS
- [x] Manual test: bulk approve topups → all credited
- [x] Manual test: admin analytics → correct numbers
- [x] Manual test: audit log → all actions logged

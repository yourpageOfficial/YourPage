# Batch 1: API Gaps — Critical (Blocking FE)
> Fix yang HARUS selesai agar FE plan bisa jalan sempurna

**Status**: ✅ Selesai (2026-04-11)
**Priority**: HIGH — FE Batch 1-3 tergantung ini
**Estimasi Files**: ~8 modified, ~2 migration baru

---

## 1.1 Donation Goal — Migration + Endpoint

**Problem**: FE plan mau animated progress bar donation goal di creator page, tapi BE tidak punya field ini.

### Migration Baru (`044_donation_goal.sql`)
- [x] Tambah kolom di `creator_profiles`:
  ```sql
  ALTER TABLE creator_profiles
    ADD COLUMN donation_goal_credits INT DEFAULT 0,
    ADD COLUMN donation_goal_label VARCHAR(100) DEFAULT '',
    ADD COLUMN donation_goal_current INT DEFAULT 0;
  ```
- [x] `donation_goal_credits` — target goal dalam credits
- [x] `donation_goal_label` — label/judul goal (e.g. "Beli mic baru")
- [x] `donation_goal_current` — progress saat ini (auto-increment saat donasi masuk)

### Entity Update (`/be/internal/entity/user.go`)
- [x] Tambah field di `CreatorProfile` struct:
  ```go
  DonationGoalCredits int    `json:"donation_goal_credits"`
  DonationGoalLabel   string `json:"donation_goal_label"`
  DonationGoalCurrent int    `json:"donation_goal_current"`
  ```

### Handler/Service Update
- [x] `PUT /api/v1/me` — allow update `donation_goal_credits` dan `donation_goal_label`
- [x] `GET /api/v1/creators/:slug` — include donation goal fields di response
- [x] `DonationService.Create()` — setelah donasi berhasil, increment `donation_goal_current`
- [x] Reset `donation_goal_current` ke 0 saat creator set goal baru

### Files yang dimodifikasi:
- `/be/migrations/044_donation_goal.sql` (BARU)
- `/be/internal/entity/user.go`
- `/be/internal/handler/auth.go` (update profile)
- `/be/internal/handler/public.go` (creator page response)
- `/be/internal/service/donation.go` (increment goal)
- `/be/internal/repository/postgres/user.go`

---

## 1.2 Membership Renewal Notification

**Problem**: Auto-renew membership dari wallet credits gagal diam-diam. User kehilangan akses tanpa warning.

### Notification saat Renewal Gagal
- [x] Di background job `membership renewal`:
  - Saat `balance < tier_price`: create notification ke supporter
  - Type: `membership_expiring`
  - Message: "Membership kamu di {creator_name} akan expire. Saldo tidak cukup untuk renewal. Top-up sekarang."
- [x] Notification 3 hari sebelum expiry (warning awal):
  - Cek membership yang expire dalam 3 hari
  - Cek apakah saldo cukup
  - Kalau tidak cukup: kirim warning notification

### Notification saat Renewal Berhasil
- [x] Create notification ke supporter: "Membership kamu di {creator_name} berhasil diperpanjang"
- [x] Create notification ke creator: "Membership {supporter_name} diperpanjang"

### Files yang dimodifikasi:
- `/be/cmd/api/main.go` (background job logic)
- `/be/internal/service/auth.go` (subscribe-tier / renewal logic)
- `/be/internal/repository/postgres/follow.go` (create notification)
- `/be/internal/entity/notification.go` (new notification types jika perlu)

---

## 1.3 Cursor-Based Pagination — Standardisasi

**Problem**: FE mau `InfiniteScroll` di feed, explore, notifications, chat. Page-based pagination prone to duplicates saat data baru masuk.

### Response Format Standard
- [x] Definisikan standard paginated response:
  ```go
  type PaginatedResponse struct {
    Data    interface{} `json:"data"`
    HasMore bool        `json:"has_more"`
    Cursor  string      `json:"cursor"` // encoded last item ID/timestamp
    Total   int64       `json:"total,omitempty"`
  }
  ```

### Endpoints yang perlu cursor support:
- [x] `GET /feed` — cursor by `post.created_at` DESC
- [x] `GET /notifications` — cursor by `notification.created_at` DESC
- [x] `GET /chat/:id` (messages) — cursor by `message.created_at` DESC
- [x] `GET /creators/search` — cursor by relevance/ID
- [x] `GET /posts/creator/:creatorId` — cursor by `created_at` DESC
- [x] `GET /wallet/transactions` — cursor by `created_at` DESC

### Backward Compatibility
- [x] Tetap support `?page=&limit=` (fallback)
- [x] Tambah `?cursor=&limit=` sebagai alternative
- [x] Kalau `cursor` param ada, pakai cursor-based; kalau tidak, pakai page-based

### Files yang dimodifikasi:
- `/be/internal/pkg/response/response.go` (standard struct)
- `/be/internal/repository/postgres/post.go` (feed query)
- `/be/internal/repository/postgres/follow.go` (notifications query)
- `/be/internal/repository/postgres/chat.go` (messages query)
- `/be/internal/repository/postgres/user.go` (creator search)
- `/be/internal/repository/postgres/wallet.go` (transactions)
- Corresponding service + handler files

---

## 1.4 Analytics Date Range Filter

**Problem**: FE mau date range picker di dashboard analytics & chart. BE `GET /creator/analytics` mungkin belum support filter.

### Query Params
- [x] Tambah support `?from=2026-01-01&to=2026-04-11` di:
  - `GET /creator/analytics` — filter semua metrics by date range
  - `GET /creator/sales` — sudah ada pagination, tambah date filter
  - `GET /creator/earnings` — filter earnings summary by period
  - `GET /admin/analytics` — admin dashboard date range

### Preset Periods
- [x] Support `?period=7d|30d|90d|1y|all` sebagai shortcut
- [x] Default: `30d` kalau tidak ada param

### Response Enhancement
- [x] Tambah trend data di analytics response:
  ```go
  type AnalyticsResponse struct {
    // ... existing fields
    TrendPercent float64 `json:"trend_percent"` // vs previous period
    TrendDir     string  `json:"trend_dir"`     // "up", "down", "flat"
  }
  ```

### Chart Data Points
- [x] Tambah endpoint atau extend existing:
  ```
  GET /creator/analytics/chart?period=30d&metric=earnings
  ```
  Response: `[{ date: "2026-04-01", value: 150000 }, ...]`
- [x] Ini untuk Recharts line/bar chart di FE dashboard

### Files yang dimodifikasi:
- `/be/internal/handler/public.go` (analytics endpoint)
- `/be/internal/service/payment.go` (sales/earnings)
- `/be/internal/repository/postgres/payment.go` (date filter queries)
- `/be/internal/repository/postgres/user.go` (analytics queries)

---

## 1.5 Delete Notification Endpoint

**Problem**: FE mau "swipe to dismiss" notification. BE hanya punya mark-as-read, tidak ada delete.

### Endpoint Baru
- [x] `DELETE /api/v1/notifications/:id` — soft delete notification
- [x] Validasi: hanya bisa delete notification milik sendiri
- [x] Atau: `DELETE /api/v1/notifications/dismissed` — bulk dismiss read notifications

### Files yang dimodifikasi:
- `/be/internal/handler/router.go` (route registration)
- `/be/internal/handler/follow.go` (handler method — notifications ada di sini)
- `/be/internal/service/follow.go` (delete logic)
- `/be/internal/repository/postgres/follow.go` (delete query)

---

## Checklist Selesai Batch 1 BE
- [x] Migration 044 applied, donation goal fields working
- [x] Membership renewal notifications sent on success/failure
- [x] Cursor-based pagination available di critical endpoints
- [x] Analytics date range filter working
- [x] Delete notification endpoint working
- [x] `go build ./...` PASS
- [x] `go test ./...` PASS (jika ada tests)
- [x] Manual test: donation → goal progress incremented
- [x] Manual test: membership expire → notification created
- [x] Manual test: cursor pagination returns correct hasMore

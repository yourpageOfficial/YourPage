# Batch 13 — Full QA Audit (BE)

**Tanggal:** 11 April 2026
**Fokus:** Full codebase audit — security, logic errors, race conditions, edge cases

---

## 🔴 CRITICAL — Bisa Kehilangan Uang / Data Breach

### QA-1: IDOR pada `GET /payments/:id`

**File:** `be/internal/handler/payment.go` → `GetStatus()`

Endpoint tidak cek ownership. Siapapun yang punya payment ID bisa lihat detail payment orang lain (amount, payer ID, status).

```go
// SEKARANG — tidak ada ownership check
payment, _ := h.svc.GetPaymentStatus(ctx, paymentID)
response.OK(c, payment)
```

**Fix:** Tambah check `payment.PayerID == getUserID(c)`, return 404 jika bukan miliknya.

---

### QA-2: IDOR pada `GET /donations/creator/:creatorId`

**File:** `be/internal/handler/donation.go` → `ListByCreator()`

Route pakai `auth, creatorOnly` tapi `creatorId` diambil dari URL param, bukan dari token. Creator A bisa lihat semua donasi Creator B dengan mengganti `:creatorId`.

**Fix:** Ganti `uuid.Parse(c.Param("creatorId"))` dengan `getUserID(c)` — creator hanya bisa lihat donasi miliknya sendiri.

---

### QA-3: Duplicate Admin Digest Goroutine

**File:** `be/cmd/api/main.go`

Ada **2 goroutine** yang kirim admin pending digest email setiap 5 menit:
1. Goroutine pertama: kirim ke `FINANCE_EMAIL` atau `ADMIN_EMAIL`
2. Goroutine kedua: kirim ke `cfg.App.AdminEmail` via `handleAdminDigest()`

**Impact:** Admin/finance dapat **double email** setiap 5 menit.

**Fix:** Hapus salah satu goroutine. Cukup satu yang kirim ke finance (fallback ke admin).

---

### QA-4: Membership Subscribe — Hardcoded IDR Rate `* 1000`

**File:** `be/internal/handler/membership.go` → `Subscribe()`

```go
h.db.Create(&entity.CreditTransaction{..., IDRAmount: totalCredits * 1000, ...})
// dan
h.db.Create(&entity.CreditTransaction{..., IDRAmount: netCredits * 1000, ...})
```

Hardcoded `* 1000` instead of `settings.CreditRateIDR`. Kalau admin ubah credit rate, semua transaction log membership jadi salah.

**Fix:** Query `PlatformSetting.CreditRateIDR` dan pakai nilainya.

---

### QA-5: Membership Renewal — Hardcoded IDR Rate (Same Bug)

**File:** `be/cmd/api/main.go` → `handleMembershipRenewal()`

Seluruh fungsi renewal tidak pernah query `PlatformSetting`. Semua IDR calculation implicit (credit = IDR tanpa conversion).

**Fix:** Query platform settings di awal fungsi, pakai `CreditRateIDR` untuk semua kalkulasi.

---

### QA-6: Withdrawal — Credits Dipotong Hanya Saat "processed"

**File:** `be/internal/service/admin.go` → `UpdateWithdrawalStatus()`

Credits baru dipotong saat status = `processed`. Antara `pending` → `processed`, creator bisa **spend credits yang sudah di-request withdrawal**. Fungsi `Create` di `withdrawal.go` cek `SumPendingAmount` tapi pakai IDR bukan credits — potential mismatch jika rate berubah.

**Fix:** Opsi A: Deduct credits saat `pending` (hold), refund jika `rejected`. Opsi B: Pastikan `SumPendingAmount` di-convert ke credits dengan rate yang benar.

---

## 🟠 HIGH — Security / Logic Error

### QA-7: Admin `UpdatePaymentStatus` — No Status Validation

**File:** `be/internal/service/admin.go` → `UpdatePayment()`

```go
func (s *adminService) UpdatePayment(..., status entity.PaymentStatus, ...) error {
    return s.paymentRepo.UpdateStatus(ctx, id, status, nil) // accepts ANY string
}
```

Admin bisa set status ke arbitrary string. Tidak ada state machine atau whitelist.

**Fix:** Validate `status` terhadap `PaymentStatusPending/Paid/Failed/Expired/Refunded` sebelum update.

---

### QA-8: `POST /donations` — optAuth, Bisa Tanpa Login

**File:** `be/internal/handler/router.go`

```go
donationsG.POST("", optAuth, h.Donation.Create)
```

Endpoint pakai `optAuth` — bisa create donation tanpa login. Tapi service `Create` tidak handle nil `supporterID` untuk credit deduction.

**Fix:** Ganti `optAuth` ke `auth`.

---

### QA-9: Donation Service `Create` — Orphan Endpoint

**File:** `be/internal/service/donation.go` → `Create()`

Ada 2 path untuk donasi:
- `POST /checkout/donation` → pakai credits, works correctly
- `POST /donations` → creates pending payment dengan provider `xendit`, **tidak pernah deduct credits**, tidak pernah fulfilled

Ini bikin data inconsistent — ada payment records pending yang tidak pernah resolved.

**Fix:** Hapus `POST /donations` endpoint atau redirect ke checkout flow. Atau implement proper Xendit payment flow di sini.

---

### QA-10: Cache Middleware pada User-Specific Endpoints

**File:** `be/internal/handler/router.go`

```go
postsG.GET("/:id", optAuth, shortCache, h.Post.GetByID)
productsG.GET("/:id", optAuth, shortCache, h.Product.GetByID)
```

Response di-cache 30 detik. Tapi response beda per user (paid content locked/unlocked). User A (belum beli) bisa lihat cached response dari User B (sudah beli) yang unlocked — **content leak**.

**Fix:** Hapus `shortCache` dari endpoint yang pakai `optAuth` dan response-nya user-specific.

---

### QA-11: `ExportCreatorSales` — Tier Check Fragile

**File:** `be/internal/handler/payment.go` → `ExportCreatorSales()`

```go
cp, err := h.userRepo.FindCreatorByUserID(...)
if err != nil || cp.Tier == nil || cp.Tier.Name != "Business" {
```

Kalau `FindCreatorByUserID` tidak preload `Tier` relation, `cp.Tier` selalu nil → semua Business creators blocked dari export.

**Fix:** Pastikan `FindCreatorByUserID` selalu preload Tier, atau cek via `TierID` + separate query.

---

### QA-12: Referral Reward Hardcoded

**File:** `be/internal/handler/referral.go`

```go
code := &entity.ReferralCode{..., RewardCredits: 10}
```

Reward amount hardcoded `10`. Seharusnya dari platform settings agar admin bisa adjust.

**Fix:** Query platform settings untuk referral reward amount.

---

## 🟡 MEDIUM — Logic Issues / Edge Cases

### QA-13: `Register` — Goroutine Pakai Request Context

**File:** `be/internal/service/auth.go` → `Register()`

```go
go s.mailer.SendWelcome(ctx, user.Email, user.DisplayName)
go s.mailer.SendEmailVerification(ctx, user.Email, verifyToken)
```

`ctx` adalah request context. Saat HTTP response return, context di-cancel → email send gagal silently.

**Fix:** Ganti `ctx` dengan `context.Background()` di goroutine.

---

### QA-14: `ResendVerification` — Same Context Issue

**File:** `be/internal/service/auth.go` → `ResendVerification()`

```go
go s.mailer.SendEmailVerification(ctx, user.Email, token)
```

**Fix:** Sama — pakai `context.Background()`.

---

### QA-15: `ResetPassword` / `ChangePassword` — SCAN All Refresh Keys

**File:** `be/internal/service/auth.go`

```go
iter := s.rdb.Scan(ctx, 0, refreshKeyPrefix+"*", 100).Iterator()
for iter.Next(ctx) {
    val, _ := s.rdb.Get(ctx, iter.Val()).Result()
    if val == userID.String() { s.rdb.Del(ctx, iter.Val()) }
}
```

Scan ALL refresh tokens di Redis untuk cari milik user ini. Dengan 10K users, scan 10K+ keys setiap password change.

**Fix:** Simpan refresh tokens per-user (e.g., `refresh:userID:tokenHash`) agar bisa delete by prefix `refresh:userID:*`.

---

### QA-16: Membership Subscribe — No Idempotency on Wallet Deduction

**File:** `be/internal/handler/membership.go` → `Subscribe()`

Pakai `ON CONFLICT DO UPDATE` untuk membership record, tapi wallet deduction sudah terjadi sebelumnya. Jika upsert update existing active membership, user bayar lagi tanpa dapat extra time.

**Fix:** Cek existing active membership sebelum deduct. Jika sudah active dan belum expired, tolak atau extend.

---

### QA-17: `handleMembershipRenewal` — No DB Transaction

**File:** `be/cmd/api/main.go`

Deduct dari supporter wallet → credit creator → update membership — semua separate DB calls. Jika gagal di tengah, state inconsistent (uang hilang tapi membership tidak extend).

**Fix:** Wrap dalam `db.Transaction()`.

---

### QA-18: `BulkUpdateWithdrawals` — No Status Validation on Input

**File:** `be/internal/handler/admin.go`

```go
var body struct { IDs []uuid.UUID; Status string }
// Status langsung di-cast ke entity.WithdrawalStatus tanpa validasi
```

**Fix:** Validate `Status` terhadap whitelist `approved/rejected/processed` sebelum proses.

---

### QA-19: Follower Count Bisa Negatif

**File:** `be/internal/service/follow.go`

`IncrementFollowerCount(ctx, profile.ID, -1)` — jika ada race condition atau data inconsistency, count bisa di bawah 0.

**Fix:** Tambah `WHERE follower_count > 0` di query decrement, atau pakai `GREATEST(follower_count - 1, 0)`.

---

### QA-20: `DonationGoalCurrent` Reset Saat Ubah Amount

**File:** `be/internal/service/auth.go` → `UpdateProfile()`

```go
if *goalAmount != cp.DonationGoalAmount { cp.DonationGoalCurrent = 0 }
```

Ubah goal amount → progress reset ke 0. Creator yang mau naikkan target kehilangan semua progress.

**Fix:** Hanya reset jika goal amount **turun** di bawah current, atau jangan reset sama sekali (biarkan creator reset manual).

---

## 🔵 LOW — Code Quality / Minor

### QA-21: `handleAccountDeletions` — Tidak Hapus Wallet/Payments

**File:** `be/cmd/api/main.go`

Anonymize user tapi wallet balance, payments, donations, products, posts tetap ada. Potential data retention issue.

**Fix:** Juga anonymize/delete wallet, credit transactions, dan data terkait.

---

### QA-22: `CreateTopupRequest` — Inefficient Pending Count

**File:** `be/internal/service/wallet.go`

```go
topups, _ := s.walletRepo.ListTopupRequests(ctx, "pending", nil, 100)
for _, t := range topups { if t.UserID == userID { userPending++ } }
```

Load ALL pending topups untuk count satu user. Seharusnya `COUNT(*) WHERE user_id = ? AND status = 'pending'`.

**Fix:** Tambah method `CountPendingByUser(ctx, userID)` di WalletRepository.

---

### QA-23: Audit Log Pagination Broken

**File:** `be/internal/handler/router.go` → admin audit-log endpoint

```go
if cursor != nil { q = q.Where("id > ?", *cursor) }
q.Order("created_at DESC").Limit(limit + 1).Find(&logs)
```

`id > cursor` + `ORDER BY created_at DESC` = cursor pagination terbalik. Halaman kedua akan skip data.

**Fix:** Ganti `id > ?` ke `id < ?` untuk descending order.

---

### QA-24: `GetProfitSummary` — Type Assertion Tanpa Check

**File:** `be/internal/handler/admin.go`

```go
revenue := analytics["revenue"].(int64) // panic jika key missing atau type salah
```

**Fix:** Pakai type assertion dengan ok check: `revenue, ok := analytics["revenue"].(int64)`.

---

### QA-25: CSP `unsafe-eval` di Script-src

**File:** `be/internal/handler/middleware/security.go`

```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

`unsafe-eval` membolehkan `eval()` — XSS risk. Next.js production build tidak butuh `eval`.

**Fix:** Hapus `'unsafe-eval'` dari CSP.

---

### QA-26: `OverlayHandler.DeleteTier` — No Error Check

**File:** `be/internal/handler/overlay.go`

```go
h.userRepo.DeleteOverlayTier(c.Request.Context(), id, getUserID(c))
response.OKMessage(c, "deleted") // selalu return success meski not found
```

**Fix:** Check error, return 404 jika tier tidak ditemukan.

---

### QA-27: Chat Paid — Charge Setiap Conversation Baru

**File:** `be/internal/service/chat.go` → `SendMessage()`

`FindOrCreateConversation` bisa return existing conversation, tapi charge tetap terjadi. Supporter yang sudah pernah chat (conversation exists) tetap kena charge lagi jika start "new" chat.

**Fix:** Cek apakah conversation sudah ada sebelum charge. Hanya charge pada conversation yang benar-benar baru dibuat.

---

## 📊 Summary

| Severity | Count | Area |
|----------|-------|------|
| 🔴 Critical | 6 | IDOR, double email, hardcoded rates, withdrawal timing |
| 🟠 High | 6 | No validation, orphan endpoint, cache leak, fragile tier check |
| 🟡 Medium | 8 | Context goroutine, Redis SCAN, no transaction, negative count |
| 🔵 Low | 7 | Inefficient query, panic, CSP, missing error check |
| **Total** | **27** | |

## ✅ Existing Test Coverage (38 tests, 6 packages)

| Package | Tests |
|---------|-------|
| `service` | 18 (checkout, chat, fee, double-spend, notifications) |
| `handler` | 5 (HTTP checkout integration) |
| `handler/middleware` | 3 (rate limiter, security headers) |
| `pkg/jwt` | 5 (token generate/parse/expired/invalid) |
| `pkg/response` | 4 (OK/BadRequest/NotFound/Paginated) |
| `pkg/validator` | 3 (sanitize, unique code, validate struct) |

## 🧪 Test Gaps (Belum Ada Test)

- Auth handlers (login, register, logout, change password, appeal)
- Membership handlers (subscribe, renewal)
- Overlay/Broadcast handlers
- Webhook handlers (PayPal/Xendit)
- Admin handlers (approve/reject, bulk actions, audit log)
- Withdrawal flow
- Follow/Feed
- File upload (magic byte validation)


---

# Batch 13 Addendum — Deep Security Audit & QA Process Review

**Tanggal:** 11 April 2026
**Fokus:** Second pass — repository layer, race conditions, data exposure, cursor pagination, file upload, config, cron jobs

---

## 🔴 CRITICAL — Security (New Findings)

### QA-28: Withdrawal `AccountNumber` Exposed di API Response

**File:** `be/internal/entity/withdrawal.go`

`AccountNumber` dan `AccountName` tidak punya `json:"-"` tag. Saat admin list withdrawals (`GET /admin/withdrawals`), data bank account semua creator ter-expose ke semua admin + finance users.

Lebih parah: `ListByCreator` juga return full bank details ke creator sendiri — ini oke, tapi jika ada IDOR (misal di admin endpoint), data bank orang lain bocor.

**Impact:** PII exposure — nomor rekening bank.

**Fix:** Buat separate response DTO yang mask `AccountNumber` (tampilkan hanya 4 digit terakhir) untuk list endpoints. Full number hanya di detail view.

---

### QA-29: `POST /upload` — Generic File Upload Tanpa Rate Limit

**File:** `be/internal/handler/router.go`, `be/internal/handler/kyc.go` → `UploadFile()`

```go
api.POST("/upload", auth, h.KYC.UploadFile)
```

Endpoint upload file:
1. **Tidak ada rate limit** — user bisa spam upload dan habiskan storage
2. **Accepts `application/octet-stream`** — bisa upload arbitrary binary
3. **Tidak ada per-user storage quota check** — hanya KYC handler, tapi endpoint generic
4. **Max 50MB per file** — tapi tidak ada daily/total limit

**Impact:** Storage abuse, potential DoS via disk exhaustion.

**Fix:** Tambah rate limit (e.g., 10 uploads/menit), hapus `application/octet-stream` dari allowed types, tambah per-user daily upload limit.

---

### QA-30: Refund Tidak Cek Apakah Creator Punya Cukup Credits

**File:** `be/internal/service/admin.go` → `RefundPayment()`

```go
_ = s.walletRepo.DeductCredits(ctx, post.CreatorID, payment.NetAmountIDR/rate)
```

Saat admin refund, system deduct credits dari creator. Tapi `DeductCredits` return error jika balance insufficient — dan error ini di-ignore (`_ =`). Creator bisa punya balance negatif secara efektif (deduction gagal tapi refund tetap jalan).

**Impact:** Creator tidak kena deduct tapi buyer tetap dapat refund → platform rugi.

**Fix:** Check error dari `DeductCredits`. Jika creator balance insufficient, either: (a) block refund, (b) set creator balance ke 0 dan catat hutang, atau (c) refund dari platform profit.

---

### QA-31: `ListByReferenceCreator` — N+4 Query Pattern

**File:** `be/internal/repository/postgres/payment.go` → `ListByReferenceCreator()`

```go
r.db.Model(&entity.Post{}).Where("creator_id = ?", creatorID).Pluck("id", &refIDs)
r.db.Model(&entity.Product{}).Where("creator_id = ?", creatorID).Pluck("id", &prodIDs)
r.db.Model(&entity.Donation{}).Where("creator_id = ?", creatorID).Pluck("id", &donIDs)
r.db.Model(&entity.ChatConversation{}).Where("creator_id = ?", creatorID).Pluck("id", &chatIDs)
// Then: WHERE reference_id IN (all IDs combined)
```

4 separate queries + 1 final query. Untuk creator dengan banyak content, `allIDs` bisa ribuan → `IN (...)` clause sangat besar → slow query + potential OOM.

**Impact:** Performance degradation, potential timeout untuk creator aktif.

**Fix:** Gunakan subquery atau JOIN instead of plucking all IDs into memory.

---

## 🟠 HIGH — Security / Logic (New Findings)

### QA-32: Cursor Pagination Broken di 5+ Repositories

**Files:** `postgres/wallet.go`, `postgres/payment.go`, `postgres/withdrawal.go`, `postgres/donation.go`

Pattern yang sama di semua repo:
```go
if cursor != nil { q = q.Where("id > ?", *cursor) }
q.Order("created_at DESC").Limit(limit).Find(...)
```

`id > cursor` + `ORDER BY created_at DESC` = **broken pagination**. UUID v4 tidak sequential, jadi `id > cursor` tidak correlate dengan `created_at` order. Halaman kedua bisa skip atau duplicate data.

**Impact:** Data hilang atau duplikat di pagination. User tidak bisa scroll semua data.

**Fix:** Gunakan `created_at < cursor_timestamp` atau pakai `id < cursor` dengan `ORDER BY id DESC` (karena UUID v4 + `default:uuid_generate_v4()` di PostgreSQL menghasilkan time-ordered UUIDs hanya jika pakai uuid v7).

---

### QA-33: `DeleteComment` — uuid.Nil Bypass User Check

**File:** `be/internal/service/post.go` → `DeleteComment()`

```go
// Post creator — delete any comment on their post (pass uuid.Nil to bypass user check)
return s.postRepo.DeleteComment(ctx, commentID, uuid.Nil)
```

Passing `uuid.Nil` ke repo untuk bypass ownership check. Ini tergantung implementasi repo — jika repo query `WHERE user_id = ?` dengan nil UUID, bisa delete comment milik user dengan nil ID (edge case).

**Fix:** Buat method terpisah `DeleteCommentByAdmin(ctx, commentID)` yang tidak filter by user_id, instead of abusing uuid.Nil.

---

### QA-34: KYC `IDNumber` (NIK) Stored in Plaintext

**File:** `be/internal/entity/kyc.go`, `be/internal/service/kyc.go`

NIK (Nomor Induk Kependudukan) — 16 digit national ID — disimpan plaintext di database. Ini PII sensitif.

**Impact:** Jika database breach, NIK semua creator yang KYC bocor.

**Fix:** Encrypt `IDNumber` at rest (AES-256). Hanya decrypt saat admin perlu review. Atau hash + simpan 4 digit terakhir untuk display.

---

### QA-35: Admin `UpdateSettings` — No Validation on Values

**File:** `be/internal/service/admin.go` → `UpdateSettings()`

```go
if req.FeePercent != nil { settings.FeePercent = *req.FeePercent }
if req.CreditRateIDR != nil { settings.CreditRateIDR = *req.CreditRateIDR }
```

Tidak ada validasi:
- `FeePercent` bisa di-set ke 0 (platform tidak dapat fee) atau 100 (creator tidak dapat apa-apa) atau negatif
- `CreditRateIDR` bisa di-set ke 0 → division by zero di banyak tempat
- `MinWithdrawalIDR` bisa di-set ke 0 atau negatif

**Impact:** Division by zero crash, atau business logic rusak.

**Fix:** Validate: `FeePercent` 0-50, `CreditRateIDR` min 100, `MinWithdrawalIDR` min 10000.

---

### QA-36: `POST /reports` — optAuth, Spam Reports Tanpa Login

**File:** `be/internal/handler/router.go`

```go
api.POST("/reports", optAuth, h.KYC.CreateReport)
```

Siapapun tanpa login bisa spam content reports. Tidak ada rate limit, tidak ada duplicate check.

**Impact:** Report flooding → admin overwhelmed, potential abuse untuk takedown content.

**Fix:** Require auth, atau tambah rate limit + captcha untuk anonymous reports. Tambah unique constraint `(reporter_id, target_type, target_id)`.

---

## 🟡 MEDIUM — Logic / Edge Cases (New Findings)

### QA-37: `AddCredits` Bisa Negatif

**File:** `be/internal/repository/postgres/wallet.go` → `AddCredits()`

```go
func (r *walletRepo) AddCredits(ctx context.Context, userID uuid.UUID, credits int64) error {
    return r.db.Model(&entity.UserWallet{}).Where("user_id = ?", userID).
        Update("balance_credits", gorm.Expr("balance_credits + ?", credits)).Error
}
```

Tidak ada check `credits > 0`. Jika caller pass negative value (bug), balance bisa turun tanpa proper validation.

**Fix:** Add guard: `if credits <= 0 { return error }`.

---

### QA-38: Membership `handleMembershipRenewal` — No Creator Wallet Ensure

**File:** `be/cmd/api/main.go` → `handleMembershipRenewal()`

```go
db.Model(&entity.UserWallet{}).Where("user_id = ?", m.CreatorID).
    Update("balance_credits", gorm.Expr("balance_credits + ?", netCredits))
```

Jika creator belum punya wallet record, `UPDATE WHERE user_id = ?` affects 0 rows → credits hilang. Subscribe handler punya `INSERT ... ON CONFLICT DO NOTHING` tapi renewal tidak.

**Fix:** Tambah `INSERT INTO user_wallets ... ON CONFLICT DO NOTHING` sebelum update, sama seperti di Subscribe handler.

---

### QA-39: `signPaidMedia` Pakai `context.Background()`

**File:** `be/internal/service/post.go` → `signPaidMedia()`

```go
signed, err := s.storage.GetPresignedURL(context.Background(), ...)
```

Pakai `context.Background()` instead of request context. Jika MinIO down, call ini hang tanpa timeout.

**Fix:** Pass request context dari caller.

---

### QA-40: Audit Log Tidak Capture Request Body

**File:** `be/internal/handler/middleware/audit.go`

```go
db.Create(&AuditLog{
    ID: uuid.New(), AdminID: uid,
    Action: c.Request.Method + " " + c.FullPath(),
    IPAddress: c.ClientIP(),
})
```

Audit log hanya capture method + path. Tidak capture:
- Request body (apa yang diubah)
- Target ID (siapa yang di-ban/approve)
- Response status

Untuk compliance, audit log harus capture detail action.

**Fix:** Capture `c.Param("id")` sebagai TargetID, dan summary dari request body sebagai Details.

---

### QA-41: `handleAccountDeletions` — Race Condition

**File:** `be/cmd/api/main.go`

```go
db.Where("deletion_scheduled_at IS NOT NULL AND deletion_scheduled_at <= NOW() AND deleted_at IS NULL").Find(&users)
for _, u := range users {
    db.Model(&u).Updates(...)
}
```

Jika cron runs twice simultaneously (restart), same user bisa di-process dua kali. Tidak ada locking atau atomic check-and-update.

**Fix:** Use `UPDATE ... WHERE deleted_at IS NULL RETURNING *` atau add `FOR UPDATE SKIP LOCKED`.

---

### QA-42: Topup Reject Tidak Kirim Notification

**File:** `be/internal/service/admin.go` → `RejectTopup()`

Approve topup kirim notification + email. Tapi reject hanya kirim email, **tidak kirim in-app notification**.

**Fix:** Tambah `CreateNotification` untuk rejected topup juga.

---

## 🔵 LOW — Code Quality (New Findings)

### QA-43: `GetProfitSummary` Calls `GetAnalytics` Twice

**File:** `be/internal/handler/admin.go`

`GetProfitSummary` calls `h.svc.GetAnalytics()` yang internally queries semua analytics counts. Tapi hanya butuh `revenue` dan `platform_withdrawals`. Wasteful.

**Fix:** Buat dedicated `GetProfitData()` method yang hanya query yang dibutuhkan.

---

### QA-44: `Donation.Creator` Preloaded di `GetLatest` — Leaks Email

**File:** `be/internal/repository/postgres/donation.go` → `GetLatest()`

`GetLatest` tidak preload Creator, tapi `ListByCreator` does. Inconsistent. Dan saat Creator di-preload, `User.Email` punya `json:"-"` tag jadi aman — tapi `User.PasswordHash` juga punya `json:"-"`. Ini oke, tapi perlu dipastikan semua sensitive fields punya tag.

**Status:** OK — `json:"-"` sudah ada di Email dan PasswordHash. Tapi `Withdrawal.AccountNumber` dan `Withdrawal.AccountName` TIDAK punya `json:"-"` (lihat QA-28).

---

### QA-45: No Request Size Limit on JSON Body

**File:** `be/internal/handler/router.go`

`MaxMultipartMemory` di-set 500MB untuk file upload, tapi tidak ada limit untuk JSON body. Attacker bisa kirim 100MB JSON body ke endpoint seperti `/auth/register` → memory exhaustion.

**Fix:** Tambah `gin.SetMode` + custom middleware yang limit `Content-Length` untuk non-multipart requests (e.g., max 1MB).

---

### QA-46: `BanUser` Scan Pattern — Same as QA-15

**File:** `be/internal/service/admin.go` → `BanUser()`

```go
iter := s.rdb.Scan(ctx, 0, "refresh:*", 100).Iterator()
```

Same O(N) scan pattern as password change. Banning a user scans ALL refresh tokens.

**Fix:** Same as QA-15 — store tokens per-user.

---

## 📊 Updated Summary (Combined)

| Severity | Original | New | Total |
|----------|----------|-----|-------|
| 🔴 Critical | 6 | 4 | **10** |
| 🟠 High | 6 | 5 | **11** |
| 🟡 Medium | 8 | 6 | **14** |
| 🔵 Low | 7 | 4 | **11** |
| **Total** | **27** | **19** | **46** |

## 🔒 Security Audit Checklist

| Area | Status | Notes |
|------|--------|-------|
| SQL Injection | ✅ Safe | GORM parameterized queries throughout |
| XSS (BE) | ✅ Safe | `validator.SanitizeString()` on user input, CSP headers |
| CSRF | ⚠️ Partial | JSON Content-Type required (mitigates form CSRF), no explicit CSRF token |
| Auth/JWT | ✅ Good | Token blacklist, refresh rotation, banned check |
| RBAC | ✅ Good | Role middleware on all admin/creator routes |
| File Upload | ⚠️ Partial | Magic byte validation ✅, but no rate limit, accepts octet-stream |
| Rate Limiting | ⚠️ Partial | Auth endpoints ✅, but upload/reports/some actions missing |
| Input Validation | ✅ Good | Validator on all DTOs, sanitization on text fields |
| PII Protection | ⚠️ Issues | Email `json:"-"` ✅, but NIK plaintext, bank account exposed |
| Atomic Operations | ✅ Good | `DeductCredits` uses `WHERE balance >= ?` pattern |
| Error Handling | ⚠️ Partial | `handleServiceError` good, but many `_ =` ignored errors |
| Logging | ✅ Good | Structured zerolog, access log, webhook payload logging |
| Secrets | ✅ Good | All from env vars, not hardcoded |
| CORS | ✅ Good | Restricted to specific origins |
| Password | ✅ Good | bcrypt cost 12, min 8 chars, account lockout |

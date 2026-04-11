# Batch 12 — Code Review, Security Audit, FE-BE Integration, QA

**Tanggal:** 11 April 2026
**Fokus:** Security vulnerabilities, code quality, FE-BE mismatches, missing QA

---

## 🔴 CRITICAL — Security

### Task 1: Webhook Handlers Belum Implemented

**File:** `be/internal/handler/webhook.go`

Xendit dan PayPal webhook handler hanya return "ok" tanpa processing:
```go
// TODO: parse body, find payment by external_id, update status, fulfill purchase
response.OKMessage(c, "ok")
```

**Impact:** Payment gateway otomatis tidak berfungsi. Semua top-up harus manual admin.

**Fix:**
- Xendit: parse `QRPaymentCallback`, find payment by `external_id`, update status, fulfill (add credit/unlock content)
- PayPal: verify webhook signature via PayPal API, parse event, fulfill
- Wrap fulfillment dalam DB transaction (atomic)
- Log semua webhook events untuk audit
- Return 200 hanya setelah processing berhasil

### Task 2: CSP Terlalu Permissive

**File:** `be/internal/handler/middleware/security.go`

```go
connect-src 'self' *;   // ← allows connection to ANY domain
img-src 'self' data: blob: *;  // ← allows images from ANY domain
```

**Impact:** XSS payload bisa exfiltrate data ke attacker domain via fetch/img.

**Fix:**
```go
connect-src 'self' https://*.xendit.co https://api.paypal.com;
img-src 'self' data: blob: https://minio.yourpage.id;
```
Whitelist hanya domain yang benar-benar dipakai.

### Task 3: Donation Create — DonorEmail Exposed

**File:** `be/internal/service/donation.go`

`CreateDonationRequest` minta `donor_email` (required) — ini PII yang disimpan di database.

**Impact:** PRD bilang "Email tidak pernah terekspos di API response" tapi donation menyimpan email.

**Fix:**
- Hapus `donor_email` dari `CreateDonationRequest` — gunakan email dari auth user jika login
- Untuk anonymous donation, tidak perlu email
- Jangan return `donor_email` di response manapun

### Task 4: Router Inline Business Logic

**File:** `be/internal/handler/router.go`

Banyak endpoint ditulis inline di router (membership, overlay, referral, broadcast) — 200+ baris business logic langsung di `router.go`.

**Impact:**
- Tidak testable (tidak bisa unit test tanpa full router)
- Tidak ada input validation (beberapa endpoint skip validator)
- Error handling inconsistent (mix `c.JSON(500)` vs `response.InternalError`)

**Fix:**
- Extract ke handler files: `membership.go`, `overlay.go`, `referral.go`, `broadcast.go`
- Setiap handler pakai `validator.Validate()` untuk input
- Setiap handler pakai `response.*` helpers untuk consistent error format

---

## 🟡 HIGH — Code Quality

### Task 5: Membership — Tidak Ada Fee Deduction

**File:** `router.go` → `/memberships/subscribe`

Creator terima 100% credit dari membership subscribe — tidak ada platform fee.

```go
// Deduct dari supporter
Update("balance_credits", gorm.Expr("balance_credits - ?", tier.PriceCredits))
// Credit ke creator — FULL amount, no fee
Update("balance_credits", gorm.Expr("balance_credits + ?", tier.PriceCredits))
```

**Impact:** Platform tidak dapat revenue dari membership. Inconsistent dengan post/product/donation yang kena fee.

**Fix:**
- Apply fee berdasarkan creator tier (5-20%)
- Log fee sebagai platform revenue
- Creator terima `price - fee`

### Task 6: Membership — Tidak Ada Expiry Handling

Membership punya `expires_at` (1 bulan) tapi tidak ada:
- Cron job untuk check expired memberships
- Auto-renewal logic
- Notification sebelum expire
- Status update saat expire

**Fix:**
- Buat scheduled task (cron/ticker) yang run setiap jam
- Check `expires_at < NOW() AND status = 'active'`
- Update status → `expired`
- Notify supporter: "Membership kamu ke [creator] sudah expired"
- Optional: auto-renew jika credit cukup

### Task 7: Rate Limiter — In-Memory Only

**File:** `be/internal/handler/middleware/ratelimit.go`

Rate limiter pakai in-memory map — tidak persist across restarts, tidak shared across instances.

**Impact:** Kalau scale horizontal (multiple instances), rate limit tidak efektif.

**Fix:**
- Untuk single instance (sekarang): acceptable, tapi tambah comment
- Untuk future scaling: migrate ke Redis-based rate limiter
- `INCR` + `EXPIRE` pattern di Redis

### Task 8: Broadcast — Goroutine Tanpa Error Handling

**File:** `router.go` → `/creator/broadcast`

```go
go func() {
    ctx := context.Background()
    followers, _ := h.UserRepo.ListFollowerIDs(ctx, uid)
    for _, fid := range followers {
        h.UserRepo.CreateNotification(ctx, fid, ...)
    }
}()
```

**Impact:**
- Error di-ignore (`_`)
- Kalau 10K followers, ini loop blocking tanpa batching
- `context.Background()` tanpa timeout — bisa hang forever
- Tidak ada retry jika gagal

**Fix:**
- Add error logging
- Batch notifications (100 per batch)
- Add timeout context: `context.WithTimeout(ctx, 5*time.Minute)`
- Consider queue-based approach untuk large fan bases

### Task 9: Chat — Concrete Type Dependency

**File:** `be/internal/service/chat.go`

```go
chatRepo *postgres.ChatRepo  // ← concrete type, not interface
```

Semua service lain pakai interface (`repository.XxxRepository`), tapi chat pakai concrete postgres type.

**Fix:**
- Buat `repository.ChatRepository` interface
- Chat service depend on interface, bukan concrete type
- Enables unit testing dengan mock

---

## 🟠 MEDIUM — FE-BE Integration Gaps

### Task 10: FE Calls Endpoints yang Tidak Exist / Mismatch

Scan FE API calls vs actual router:

| FE expects | BE actual | Issue |
|-----------|-----------|-------|
| `GET /creators/search?category=X` | No category filter in handler | Category pills di explore tidak filter |
| `POST /auth/subscribe-tier` body `{tier_id}` | Handler expects `{tier_name}` or `{tier_id}`? | Perlu verify DTO match |
| `GET /creator/analytics` | Returns what fields? | FE dashboard analytics page expects specific chart data |
| Donation with media (`media_url`) | Checkout donation DTO has `media_url` | Tapi upload flow untuk donation media tidak jelas |

**Fix:**
- Audit setiap FE `api.get/post` call → verify BE handler accepts same params
- Add missing query filters (category di search)
- Document expected request/response for each endpoint

### Task 11: Missing Input Validation di Inline Handlers

Endpoints di router.go yang skip validation:

| Endpoint | Issue |
|----------|-------|
| `POST /overlay-tiers` | `min_credits` tidak di-validate (bisa 0 atau negatif) |
| `POST /membership-tiers` | `price_credits` min=1 tapi tidak max |
| `POST /memberships/subscribe` | `tier_id` parse error silently ignored |
| `POST /creator/broadcast` | `message` max length tidak di-check |

**Fix:** Semua input harus lewat `validator.Validate()` dengan proper struct tags.

---

## 🔵 QA / Testing

### Task 12: Test Coverage Sangat Rendah

Current test files:
- `middleware_test.go` — 1 file, basic
- `service_test.go` — 1 file, basic

**Missing tests:**

| Area | Priority | What to test |
|------|----------|-------------|
| Payment checkout | 🔴 Critical | Atomic credit deduction, double-spend prevention, self-purchase block |
| Webhook fulfillment | 🔴 Critical | Idempotency, status transitions, concurrent calls |
| Auth | 🟡 High | Register validation, login, token refresh, blacklist, banned user |
| Withdrawal | 🟡 High | Min amount, KYC check, balance check, atomic deduction |
| Membership | 🟡 High | Subscribe, self-subscribe block, insufficient credit, tier limit |
| Donation | 🟠 Medium | Anonymous, with message, fee calculation |
| Chat | 🟠 Medium | Rate limit per day, paid chat deduction, forbidden access |
| Admin | 🟠 Medium | Role check, bulk operations, audit logging |

**Fix:**
- Start with table-driven tests untuk payment service (paling critical)
- Use interface mocks (semua repo sudah interface kecuali chat)
- Target: 80% coverage pada service layer

### Task 13: No Integration Tests

Tidak ada integration test yang test full flow:
- Register → Login → Create Post → Buy Post → Check Library
- Top-up → Buy Product → Download
- Donate → Check Creator Earnings → Withdraw

**Fix:**
- Buat `be/internal/handler/handler_test.go` dengan httptest
- Setup test DB (SQLite in-memory atau test PostgreSQL)
- Test happy path + error paths untuk critical flows

### Task 14: No Load/Stress Testing

Tidak ada benchmark atau load test.

**Fix:**
- Buat `be/benchmark_test.go` untuk hot paths:
  - `BenchmarkCheckoutPost`
  - `BenchmarkGetCreatorPage`
  - `BenchmarkFeed`
- Consider k6 atau vegeta untuk HTTP load testing

---

## Execution Order

| # | Task | Severity | Effort | Area |
|---|------|----------|--------|------|
| 1 | Webhook handlers implement | 🔴 Critical | 4 hr | Security/Payment |
| 2 | CSP whitelist domains | 🔴 Critical | 15 min | Security |
| 3 | Remove donor_email PII | 🔴 Critical | 30 min | Security/Privacy |
| 4 | Extract inline handlers | 🔴 Critical | 2 hr | Code Quality |
| 5 | Membership fee deduction | 🟡 High | 1 hr | Business Logic |
| 6 | Membership expiry cron | 🟡 High | 2 hr | Business Logic |
| 11 | Input validation gaps | 🟡 High | 1 hr | Security |
| 10 | FE-BE integration audit | 🟠 Medium | 2 hr | Integration |
| 8 | Broadcast error handling | 🟠 Medium | 30 min | Reliability |
| 9 | Chat interface refactor | 🟠 Medium | 30 min | Code Quality |
| 7 | Rate limiter note | 🟠 Medium | 5 min | Documentation |
| 12 | Unit tests (payment) | 🟡 High | 4 hr | QA |
| 13 | Integration tests | 🟠 Medium | 4 hr | QA |
| 14 | Load tests | 🔵 Low | 2 hr | QA |

**Total estimated: ~24 jam**

---

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 3 | 1 | 0 | 0 |
| Code Quality | 1 | 1 | 2 | 0 |
| Business Logic | 0 | 2 | 0 | 0 |
| Integration | 0 | 0 | 1 | 0 |
| QA/Testing | 0 | 1 | 1 | 1 |
| **Total** | **4** | **5** | **4** | **1** |

**Verdict: WARNING** — 4 critical issues (webhook not implemented, CSP too permissive, PII exposure, untestable inline code) harus di-fix sebelum launch.

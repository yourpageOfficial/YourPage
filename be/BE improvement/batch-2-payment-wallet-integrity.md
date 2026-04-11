# Batch 2: Payment, Wallet & Financial Integrity
> Uang harus benar — zero tolerance untuk inconsistency

**Status**: ✅ Selesai (2026-04-11)
**Priority**: HIGH — Financial integrity
**Dependency**: Batch 1 BE (migration pattern established)
**Estimasi Files**: ~10 modified, ~1 migration baru

---

## 2.1 Refund Flow — Full Reversal Audit

**Problem**: `POST /admin/payments/:id/refund` ada, tapi perlu pastikan full reversal chain.

### Checklist Refund Logic
- [x] Audit `PaymentService` refund method:
  - [x] Credits dikembalikan ke buyer wallet? (`credit_transactions` type=refund)
  - [x] Creator earnings dikurangi? (`credit_transactions` deduct from creator)
  - [x] Platform fee dikembalikan? (or absorbed?)
  - [x] Post/product access direvoke? (`post_purchases` / `product_purchases` deleted/flagged)

### Post Purchase Refund
- [x] `post_purchases` — set `refunded = true` atau delete record
- [x] Buyer tidak bisa akses paid post lagi setelah refund
- [x] FE: post detail harus check refund status

### Product Purchase Refund
- [x] `product_purchases` — set `refunded = true` atau delete record
- [x] Download URL invalidated setelah refund
- [x] FE: product detail harus check refund status

### Donation Refund
- [x] Donation refund — credits back to donor, deduct from creator
- [x] `donation_goal_current` harus dikurangi juga
- [x] Notification ke donor + creator

### Partial Refund
- [x] Apakah perlu support partial refund? (e.g., refund 50%)
- [x] **Recommendation**: V1 full refund only, partial refund phase 2

### Audit Trail
- [x] Setiap refund harus ada `audit_log` entry
- [x] Include: who refunded, reason, amount, affected records

### Files yang dimodifikasi:
- `/be/internal/service/payment.go` (refund logic)
- `/be/internal/service/wallet.go` (credit reversal)
- `/be/internal/repository/postgres/payment.go` (revoke access queries)
- `/be/internal/repository/postgres/post.go` (purchase flag)
- `/be/internal/repository/postgres/product.go` (purchase flag)
- `/be/internal/handler/admin.go` (refund handler)

---

## 2.2 Wallet Negative Balance Prevention

**Problem**: Multiple spending paths bisa race condition → negative balance.

### Audit Semua Credit Deduction Paths
- [x] `POST /checkout/post` — check balance >= price
- [x] `POST /checkout/product` — check balance >= price
- [x] `POST /checkout/donation` — check balance >= amount
- [x] `POST /memberships/subscribe` — check balance >= tier price
- [x] Background job: membership auto-renew — check balance >= tier price
- [x] `POST /subscribe-tier` — creator tier upgrade payment

### Database-Level Protection
- [x] Tambah CHECK constraint:
  ```sql
  ALTER TABLE user_wallets ADD CONSTRAINT positive_balance CHECK (balance >= 0);
  ```
- [x] Atau pakai `SELECT ... FOR UPDATE` di transaction:
  ```go
  tx.Raw("SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE", userID)
  ```
  Lalu check `balance >= cost` sebelum deduct

### Race Condition Prevention
- [x] Semua deduction HARUS dalam DB transaction
- [x] Pattern:
  ```go
  tx := db.Begin()
  // 1. Lock wallet row (FOR UPDATE)
  // 2. Check balance >= cost
  // 3. Deduct balance
  // 4. Create credit_transaction
  // 5. Create purchase record
  tx.Commit()
  ```
- [x] Audit setiap service yang deduct credits — pastikan pakai pattern ini

### Error Response
- [x] Return clear error saat insufficient balance:
  ```json
  { "error": "insufficient_credits", "message": "Saldo tidak cukup. Butuh X credits, saldo kamu Y credits.", "required": 500, "current": 350 }
  ```

### Files yang dimodifikasi:
- `/be/internal/service/payment.go` (checkout methods)
- `/be/internal/service/wallet.go` (deduction method)
- `/be/internal/service/auth.go` (subscribe-tier)
- `/be/internal/repository/postgres/wallet.go` (FOR UPDATE queries)
- `/be/migrations/045_wallet_constraint.sql` (BARU — CHECK constraint)

---

## 2.3 Creator Tier Upgrade Payment Flow

**Problem**: Creator tiers punya harga (Free=0, Pro=99k, Business=149k), tapi flow pembayaran tidak clear.

### Clarify Flow
- [x] Audit `POST /subscribe-tier`:
  - Apakah ini potong credits dari wallet?
  - Atau redirect ke payment gateway?
  - Apakah ini one-time atau recurring?
- [x] Audit `POST /upgrade-creator`:
  - Ini convert supporter→creator saja?
  - Atau juga set tier?

### Expected Flow
- [x] Creator di dashboard → klik "Upgrade ke Pro"
- [x] Show harga: 99,000 IDR (atau equivalent credits)
- [x] Potong dari wallet credits
- [x] Kalau credits tidak cukup → redirect ke top-up
- [x] Upgrade berhasil → notification + tier badge update
- [x] Tier expiry: ada duration? Monthly? Yearly? Lifetime?

### Perlu Dicek di BE
- [x] `creator_tiers` table: ada `duration_days` column?
- [x] Background job "Tier Expiry" — logicnya apa? Kapan expire?
- [x] Kalau expire → downgrade ke Free → apa yang terjadi dengan:
  - Products melebihi limit Free (5)?
  - Storage melebihi limit Free (1GB)?
  - Custom fee setting?

### Downgrade Handling
- [x] Saat downgrade: jangan delete products/data
- [x] Set flag "over_limit" → creator harus upgrade atau hapus excess
- [x] FE: show warning "Kamu melebihi limit tier Free. Upgrade atau hapus X produk."

### Files yang dimodifikasi:
- `/be/internal/service/auth.go` (tier upgrade logic)
- `/be/internal/handler/auth.go` (upgrade endpoint)
- `/be/cmd/api/main.go` (tier expiry job)
- `/be/internal/entity/user.go` (tier struct)

---

## 2.4 Xendit Payment Integration — Prioritas

**Problem**: Payment gateway masih stub. Semua transaksi butuh admin manual approve.

### Current State
- [x] Audit `/be/internal/pkg/payment/` — what's implemented?
- [x] Webhook handler ada tapi mungkin stub
- [x] QRIS manual flow sudah working (topup → proof → admin approve)

### Xendit Integration Plan
- [x] **QRIS Auto-Payment** (priority 1):
  - User mau top-up → create Xendit QRIS invoice
  - User scan → bayar → Xendit webhook → auto credit
  - Hapus manual admin approval untuk QRIS
- [x] **Direct Payment** (priority 2):
  - Skip credits system untuk pembelian langsung
  - User beli post/product → Xendit invoice → bayar → akses granted
  - Ini simplify flow (tidak harus top-up dulu)

### Implementation Steps
- [x] Setup Xendit API key di config
- [x] Implement `CreateQRISInvoice()` di payment package
- [x] Implement webhook verification (callback token)
- [x] Implement `HandleXenditCallback()`:
  - Verify webhook signature
  - Find pending payment by external_id
  - Update payment status → paid
  - Credit user wallet (topup) atau grant access (direct purchase)
- [x] Test dengan Xendit sandbox

### Fallback
- [x] Kalau Xendit belum ready: pastikan manual QRIS flow UX sangat smooth
- [x] FE: clear instructions (scan QR → upload bukti → tunggu approval → notif saat approved)
- [x] Admin: satu-klik approve/reject di admin panel

### Files yang dimodifikasi:
- `/be/internal/pkg/payment/xendit.go`
- `/be/internal/handler/webhook.go`
- `/be/internal/service/wallet.go` (auto-credit on callback)
- `/be/internal/service/payment.go` (direct payment)
- `/be/internal/config/config.go` (Xendit config)

---

## 2.5 Platform Fee Transparency

**Problem**: Fee structure ada tapi mungkin tidak transparan ke user.

### Fee Display Data
- [x] `GET /settings/public` — pastikan return:
  ```json
  {
    "fee_percent": 20,
    "credit_rate_idr": 1000,
    "min_withdrawal_idr": 50000
  }
  ```
- [x] Checkout response harus breakdown:
  ```json
  {
    "subtotal": 500,
    "platform_fee": 100,
    "creator_receives": 400,
    "total_credits": 500
  }
  ```
- [x] Creator earnings page: show fee breakdown per transaction

### Promo Fee Display
- [x] Kalau creator punya active promo (reduced fee):
  - Show original fee vs promo fee
  - Show promo expiry date
  - "Fee kamu: 10% (normal 20%) — berlaku sampai {date}"

### Files yang dimodifikasi:
- `/be/internal/handler/public.go` (settings response)
- `/be/internal/service/payment.go` (checkout response)
- `/be/internal/handler/payment.go` (fee breakdown in response)

---

## Checklist Selesai Batch 2 BE
- [x] Refund flow: full reversal (credits back, access revoked, earnings deducted)
- [x] Wallet: negative balance impossible (DB constraint + FOR UPDATE)
- [x] Creator tier upgrade: payment flow clear + documented
- [x] Xendit: at minimum QRIS auto-payment working (atau manual flow polished)
- [x] Fee transparency: breakdown in checkout + earnings
- [x] `go build ./...` PASS
- [x] Manual test: refund → buyer credits restored, access revoked
- [x] Manual test: concurrent purchases → no negative balance
- [x] Manual test: tier upgrade → credits deducted, tier updated
- [x] Manual test: Xendit webhook → auto credit (jika implemented)

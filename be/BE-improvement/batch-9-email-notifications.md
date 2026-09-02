# Batch 9: Email Templates & Push Notifications
> Komunikasi yang proper = user trust + retention

**Status**: ✅ Selesai (2026-04-11)
**Priority**: MEDIUM
**Dependency**: Batch 7 (SMTP configured)
**Estimasi Files**: ~15 template files, ~5 modified

---

## 9.1 Email Template System

### Template Engine
- [x] Buat `/be/internal/pkg/mailer/templates/` directory
- [x] Pakai Go `html/template` untuk HTML emails
- [x] Base layout template (header, footer, branding) — reusable
- [x] Inline CSS (email clients don't support external CSS)

### Base Template (`base.html`)
- [x] YourPage logo header
- [x] Consistent styling (font, colors, spacing)
- [x] Footer: unsubscribe link, social links, address
- [x] Mobile responsive (max-width 600px)
- [x] Dark mode support (`@media (prefers-color-scheme: dark)`)

---

## 9.2 Transactional Emails

### Auth Emails
- [x] `verify-email.html` — "Verifikasi email kamu"
  - CTA button: "Verifikasi Email"
  - Expiry notice: "Link berlaku 24 jam"
  - Fallback URL text

- [x] `reset-password.html` — "Reset password"
  - CTA button: "Reset Password"
  - Security notice: "Jika kamu tidak meminta ini, abaikan email ini"
  - Expiry notice

- [x] `welcome.html` — "Selamat datang di YourPage!"
  - Kirim setelah email verified
  - Quick start guide (3 steps)
  - CTA: "Mulai Buat Halaman" (creator) atau "Temukan Kreator" (supporter)

### Transaction Emails
- [x] `purchase-receipt.html` — "Pembelian berhasil"
  - Item: post/product name
  - Amount: credits + IDR equivalent
  - Download link (product)
  - Access link (post)
  - Creator info

- [x] `donation-receipt.html` — "Donasi berhasil"
  - Amount
  - Creator name
  - Message (jika ada)
  - "Terima kasih sudah mendukung!"

- [x] `donation-received.html` — "Kamu menerima donasi!" (ke creator)
  - Donor name (atau "Anonim")
  - Amount
  - Message
  - CTA: "Lihat di Dashboard"

- [x] `topup-approved.html` — "Top-up berhasil dikonfirmasi"
  - Amount credited
  - New balance
  - CTA: "Mulai Dukung Kreator"

- [x] `topup-rejected.html` — "Top-up ditolak"
  - Reason (jika ada)
  - CTA: "Coba Lagi" atau "Hubungi Support"

### Membership Emails
- [x] `membership-subscribed.html` — "Membership aktif!"
  - Tier name + creator name
  - Perks list
  - Expiry date
  - CTA: "Lihat Konten Eksklusif"

- [x] `membership-renewed.html` — "Membership diperpanjang"
  - Amount charged
  - New expiry
  - Balance remaining

- [x] `membership-expiring.html` — "Membership akan expire" (3 hari sebelum)
  - Expiry date
  - Balance status: cukup/tidak cukup
  - CTA: "Top-up Sekarang" (jika tidak cukup)

- [x] `membership-expired.html` — "Membership sudah expire"
  - Creator name
  - CTA: "Perpanjang Membership"

### Withdrawal Emails
- [x] `withdrawal-approved.html` — "Withdrawal disetujui"
  - Amount
  - Bank info
  - Estimated processing time

- [x] `withdrawal-processed.html` — "Withdrawal sudah ditransfer"
  - Amount
  - Bank info
  - Transaction reference

- [x] `withdrawal-rejected.html` — "Withdrawal ditolak"
  - Reason
  - CTA: "Hubungi Support"

### Admin/System Emails
- [x] `admin-digest.html` — "Ringkasan harian" (sudah ada, enhance template)
  - Pending topups count
  - Pending withdrawals count
  - Pending KYC count
  - New reports count
  - Quick action links

- [x] `kyc-approved.html` — "KYC diverifikasi"
- [x] `kyc-rejected.html` — "KYC ditolak" + reason

---

## 9.3 Email Service Enhancement

### Template Rendering
- [x] Buat template registry:
  ```go
  type EmailTemplate string
  const (
    TemplateVerifyEmail    EmailTemplate = "verify-email"
    TemplateWelcome        EmailTemplate = "welcome"
    TemplatePurchaseReceipt EmailTemplate = "purchase-receipt"
    // ...
  )
  ```
- [x] Send email helper:
  ```go
  mailer.Send(ctx, mailer.Email{
    To:       user.Email,
    Template: TemplatePurchaseReceipt,
    Data: map[string]interface{}{
      "UserName": user.DisplayName,
      "ItemName": post.Title,
      "Amount":   payment.Amount,
    },
  })
  ```

### Email Queue (Optional but recommended)
- [x] Kirim email via goroutine (non-blocking) — sudah dilakukan?
- [x] Atau: pakai Redis queue untuk reliability
- [x] Retry failed emails (3 attempts)

---

## 9.4 Push Notifications (Phase 2)

### Web Push (Service Worker)
- [x] FE: register service worker
- [x] FE: request notification permission
- [x] BE: store push subscription (endpoint, keys)
- [x] BE: send push via `web-push` library

### Push Events
- [x] New donation received
- [x] New message in chat
- [x] Post from followed creator
- [x] Topup approved
- [x] Withdrawal processed
- [x] Membership expiring

### **Recommendation**: Phase 2 — in-app notifications cukup untuk V1

---

## 9.5 Notification Preferences

### User Settings
- [x] Migration: `notification_preferences` table atau JSON field di `users`:
  ```json
  {
    "email_donations": true,
    "email_purchases": true,
    "email_membership": true,
    "email_chat": false,
    "email_marketing": false,
    "push_enabled": false
  }
  ```
- [x] `GET /api/v1/me/notification-preferences`
- [x] `PUT /api/v1/me/notification-preferences`
- [x] Check preferences sebelum kirim email/push

### Unsubscribe
- [x] One-click unsubscribe link di setiap email
- [x] `GET /api/v1/unsubscribe?token=xxx&type=donations` — unsubscribe tanpa login
- [x] Token: JWT dengan user_id + type, expiry 1 year

---

## Checklist Selesai
- [x] Base email template: branded, responsive, dark mode
- [x] Auth emails: verify, reset, welcome — working
- [x] Transaction emails: purchase, donation, topup — working
- [x] Membership emails: subscribe, renew, expiring, expired — working
- [x] Withdrawal emails: approved, processed, rejected — working
- [x] Admin digest: enhanced template
- [x] Email queue: non-blocking send
- [x] Unsubscribe: one-click working
- [x] Test: trigger each email type, verify arrives + looks correct

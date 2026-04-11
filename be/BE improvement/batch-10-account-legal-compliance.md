# Batch 10: Account Management, Legal & Compliance
> User trust = user retention. Privacy matters.

**Status**: ✅ Selesai (2026-04-11)
**Priority**: MEDIUM — Penting untuk launch publik
**Dependency**: Batch 1-2 BE
**Estimasi Files**: ~10 modified, ~3 migration baru

---

## 10.1 Delete Account Flow

### User Self-Service Delete
- [x] `POST /api/v1/me/delete-account` — request account deletion
  - Require password confirmation
  - Require reason (optional)
  - Set `deletion_scheduled_at = NOW() + 30 days` (grace period)
  - Send confirmation email: "Akun kamu akan dihapus dalam 30 hari"
  - User bisa cancel sebelum 30 hari

### Cancel Deletion
- [x] `POST /api/v1/me/cancel-deletion` — cancel pending deletion
  - Clear `deletion_scheduled_at`
  - Send email: "Penghapusan akun dibatalkan"

### Background Job — Execute Deletion
- [x] Daily job: find users with `deletion_scheduled_at <= NOW()`
- [x] Deletion cascade:
  ```
  1. Download user data export (store temporarily)
  2. Delete/anonymize personal data:
     - display_name → "Pengguna Dihapus"
     - email → hash
     - bio → null
     - avatar → null
     - bank info → null
     - KYC data → delete
  3. Keep transactional records (payments, donations) dengan anonymized user
  4. Delete: follows, notifications, chat messages
  5. Products/Posts by creator:
     - Option A: delete all (simple)
     - Option B: keep tapi mark "creator deleted" (preserve buyer access)
     - Recommendation: Option B untuk purchased content
  6. Refund pending withdrawals
  7. Mark user as deleted (soft delete)
  ```

### Migration
- [x] `ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMP;`
- [x] `ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;` (jika belum ada soft delete)

### Files yang dimodifikasi:
- `/be/migrations/049_account_deletion.sql` (BARU)
- `/be/internal/handler/auth.go` (delete/cancel endpoints)
- `/be/internal/service/auth.go` (deletion logic)
- `/be/internal/handler/router.go` (routes)
- `/be/cmd/api/main.go` (background job)

---

## 10.2 Data Export (GDPR-like)

### User Data Export
- [x] `POST /api/v1/me/export-data` — request data export
  - Rate limit: 1 request per week
  - Generate JSON file dengan semua user data:
    ```json
    {
      "profile": { ... },
      "posts": [ ... ],
      "products": [ ... ],
      "purchases": [ ... ],
      "donations_sent": [ ... ],
      "donations_received": [ ... ],
      "payments": [ ... ],
      "wallet_transactions": [ ... ],
      "follows": [ ... ],
      "chat_messages": [ ... ],
      "notifications": [ ... ]
    }
    ```
  - Upload ke MinIO (private, signed URL)
  - Send email dengan download link (expires 48 hours)

### Files yang dimodifikasi:
- `/be/internal/handler/auth.go` (export endpoint)
- `/be/internal/service/auth.go` (export logic — aggregate all data)
- `/be/internal/handler/router.go` (route)

---

## 10.3 Two-Factor Authentication (2FA)

### TOTP (Time-based One-Time Password)
- [x] `go get github.com/pquerna/otp`
- [x] Flow:
  1. `POST /api/v1/me/2fa/enable` → generate secret + QR code URL
  2. User scan QR dengan Google Authenticator / Authy
  3. `POST /api/v1/me/2fa/verify` → verify first code, enable 2FA
  4. `POST /api/v1/me/2fa/disable` → require code + password

### Login with 2FA
- [x] `POST /auth/login` → if 2FA enabled:
  - Return `{ "requires_2fa": true, "temp_token": "xxx" }`
  - `POST /auth/login/2fa` → verify code + temp_token → return real tokens
- [x] Backup codes: generate 10 one-time codes saat enable 2FA
  - Store hashed
  - User bisa regenerate

### Migration
- [x] `ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64);`
- [x] `ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT false;`
- [x] `CREATE TABLE totp_backup_codes (...);`

### Files yang dimodifikasi:
- `/be/migrations/050_2fa.sql` (BARU)
- `/be/internal/entity/user.go` (2FA fields)
- `/be/internal/handler/auth.go` (2FA endpoints)
- `/be/internal/service/auth.go` (2FA logic)
- `/be/internal/handler/router.go` (routes)

---

## 10.4 Account Suspension & Appeal

### Suspension System
- [x] Ban sudah ada (`POST /admin/users/:id/ban`)
- [x] Enhance:
  - `ban_reason` — alasan ban (wajib diisi admin)
  - `ban_expires_at` — temporary ban option (7 days, 30 days, permanent)
  - `appeal_status` — pending, reviewed, accepted, rejected

### User Appeal
- [x] `POST /api/v1/me/appeal` — submit appeal (banned user only)
  - Require message/explanation
  - One appeal per ban
- [x] `GET /admin/appeals` — list appeals
- [x] `PATCH /admin/appeals/:id` — accept/reject appeal
  - Accept → unban user
  - Reject → keep banned + reason

### Banned User Experience
- [x] Login → 403 dengan:
  ```json
  {
    "error": "account_suspended",
    "message": "Akun kamu ditangguhkan.",
    "reason": "Pelanggaran ketentuan layanan: konten NSFW",
    "banned_at": "2026-04-01",
    "expires_at": "2026-05-01",  // null = permanent
    "can_appeal": true
  }
  ```
- [x] FE: show suspension page dengan reason + appeal form

### Files yang dimodifikasi:
- `/be/migrations/051_suspension_appeal.sql` (BARU)
- `/be/internal/entity/user.go` (ban fields)
- `/be/internal/handler/auth.go` (appeal endpoint)
- `/be/internal/handler/admin.go` (appeal management)
- `/be/internal/service/auth.go` (appeal logic)
- `/be/internal/service/admin.go` (appeal management)

---

## 10.5 Privacy & Data Retention

### Data Retention Policies
- [x] Define + implement:
  ```
  Notifications: delete read after 90 days (already exists)
  Chat messages: keep forever (or 2 years + archive)
  Audit logs: keep 1 year
  Access logs: keep 90 days
  Session tokens: delete expired + blacklisted after 30 days
  Deleted user data: purge after 30 days grace period
  KYC documents: delete 30 days after approval (keep status, delete images)
  ```

### Cookie Consent (FE)
- [x] Show cookie banner on first visit
- [x] Store consent in localStorage
- [x] Only load analytics after consent

### Privacy Policy Content
- [x] Audit `/fe/app/privacy/page.tsx` — pastikan mencakup:
  - Data yang dikumpulkan
  - Bagaimana data digunakan
  - Dengan siapa data dibagi
  - Hak user (export, delete, correction)
  - Cookies dan tracking
  - Data retention period
  - Kontak DPO (Data Protection Officer)
- [x] **Recommendation**: Konsultasi lawyer untuk review

### Terms of Service Content
- [x] Audit `/fe/app/terms/page.tsx` — pastikan mencakup:
  - Syarat penggunaan platform
  - Konten yang dilarang
  - Hak kekayaan intelektual
  - Pembatasan tanggung jawab
  - Proses penyelesaian sengketa
  - Kebijakan refund
  - Perubahan ketentuan
- [x] **Recommendation**: Konsultasi lawyer untuk review

---

## 10.6 Session Management

### Active Sessions
- [x] `GET /api/v1/me/sessions` — list active sessions
  - Device info (user-agent parsed)
  - IP address
  - Last active
  - Current session marked
- [x] `DELETE /api/v1/me/sessions/:id` — revoke specific session
- [x] `DELETE /api/v1/me/sessions` — revoke all except current ("Logout everywhere")

### Session Storage
- [x] Store in Redis: `session:{user_id}:{session_id}` → metadata
- [x] Check on auth middleware: session still valid?
- [x] Max 5 active sessions per user

### Files yang dimodifikasi:
- `/be/internal/handler/auth.go` (session endpoints)
- `/be/internal/service/auth.go` (session management)
- `/be/internal/handler/middleware/auth.go` (session validation)
- `/be/internal/infrastructure/redis.go` (session storage)

---

## Checklist Selesai
- [x] Delete account: request, grace period, cancel, execute
- [x] Data export: JSON download, email notification
- [x] 2FA: TOTP enable/disable, login flow, backup codes
- [x] Suspension: reason, expiry, appeal flow
- [x] Data retention: policies defined + automated cleanup
- [x] Session management: list, revoke, max sessions
- [x] Privacy policy: comprehensive (pending legal review)
- [x] Terms of service: comprehensive (pending legal review)
- [x] `go build ./...` PASS
- [x] Manual test: delete account → data removed after grace period
- [x] Manual test: 2FA → login requires code
- [x] Manual test: appeal → admin approves → user unbanned

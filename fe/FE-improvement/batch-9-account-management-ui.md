# Batch 9: Account Management UI
> FE untuk fitur account di BE Batch 10

**Status**: ✅ Selesai (11 Apr 2026) — Partial, 2FA/sessions butuh BE endpoints
**Priority**: MEDIUM
**Dependency**: BE Batch 10 (endpoints ready), FE Batch 4 (profile page done)
**Estimasi Files**: ~8 baru/modified

---

## 9.1 Delete Account UI

### Settings / Account Page
- [ ] Tambah section "Danger Zone" di `/fe/app/profile/page.tsx` atau buat `/fe/app/settings/account/page.tsx`
- [ ] "Hapus Akun" button (destructive variant, di paling bawah)
- [ ] Click → ConfirmDialog:
  - Title: "Hapus Akun Kamu?"
  - Description: "Semua data akan dihapus permanen setelah 30 hari. Kamu bisa membatalkan sebelum itu."
  - Input: password confirmation
  - Textarea: reason (optional)
  - Confirm button: "Ya, Hapus Akun Saya" (loading state)

### Pending Deletion Banner
- [ ] Kalau `deletion_scheduled_at` ada di user data:
  - Show banner di semua pages: "Akun kamu dijadwalkan untuk dihapus pada {date}. [Batalkan]"
  - Alert variant: warning
  - Cancel button → API call → refresh

### Success Page
- [ ] Setelah request delete:
  - Redirect ke confirmation page
  - "Akun kamu akan dihapus pada {date}"
  - "Kamu akan menerima email konfirmasi"
  - "Login kembali sebelum {date} untuk membatalkan"
  - Auto logout

---

## 9.2 Data Export UI

### Export Button
- [ ] Di settings/account page: "Ekspor Data Saya"
- [ ] Click → ConfirmDialog: "Kami akan menyiapkan data kamu. Link download akan dikirim ke email."
- [ ] Loading state
- [ ] Success toast: "Permintaan ekspor diterima. Cek email kamu dalam beberapa menit."
- [ ] Rate limit notice: "Kamu bisa request ekspor 1x per minggu"

---

## 9.3 Two-Factor Authentication UI

### 2FA Settings Section
- [ ] Di settings/security page atau profile page
- [ ] Status: "2FA Belum Aktif" atau "2FA Aktif ✓"

### Enable Flow
- [ ] Step 1: Click "Aktifkan 2FA" → API call → get QR code + secret
- [ ] Step 2: Show QR code image (user scan dengan Authenticator app)
- [ ] Step 3: Manual secret display (untuk manual entry)
- [ ] Step 4: Input verification code → verify → enable
- [ ] Step 5: Show backup codes (10 codes)
  - Warning: "Simpan kode ini di tempat aman. Setiap kode hanya bisa digunakan sekali."
  - Copy all button
  - Download as text file
  - Checkbox: "Saya sudah menyimpan kode backup"
- [ ] Success toast: "2FA berhasil diaktifkan"

### Disable Flow
- [ ] Click "Nonaktifkan 2FA"
- [ ] ConfirmDialog: require password + current TOTP code
- [ ] Warning: "Akun kamu akan kurang aman tanpa 2FA"
- [ ] Success toast

### Login with 2FA
- [ ] Modify `/fe/app/login/page.tsx`:
  - Normal login → if response `requires_2fa: true`:
  - Show 2FA code input (6 digit)
  - "Gunakan kode dari aplikasi Authenticator"
  - Link: "Gunakan kode backup" → switch ke backup code input
  - Submit → verify → login

### Regenerate Backup Codes
- [ ] Button: "Regenerate Kode Backup"
- [ ] ConfirmDialog: require TOTP code
- [ ] Show new codes (same UI as enable step 5)
- [ ] Warning: "Kode backup lama tidak berlaku lagi"

---

## 9.4 Session Management UI

### Active Sessions Page
- [ ] `/fe/app/settings/sessions/page.tsx` atau section di profile
- [ ] List active sessions:
  - Device icon (desktop/mobile/tablet — parse user-agent)
  - Browser name + OS
  - IP address (partial: 192.168.xxx.xxx)
  - Last active: "2 menit yang lalu"
  - Current session badge: "Sesi ini"
- [ ] Per session: "Logout" button (revoke)
- [ ] "Logout Semua Perangkat Lain" button (revoke all except current)
- [ ] ConfirmDialog sebelum logout semua

---

## 9.5 Suspension / Ban UI

### Banned Page
- [ ] `/fe/app/suspended/page.tsx`:
  - YourPage logo
  - "Akun Ditangguhkan"
  - Reason: display ban reason dari API
  - Duration: "Permanen" atau "Sampai {date}"
  - Appeal section (jika `can_appeal: true`):
    - Textarea: "Jelaskan mengapa akun kamu harus dipulihkan"
    - Submit button
  - Contact support link
  - Logout button

### Redirect Logic
- [ ] Di auth provider/middleware FE:
  - Kalau `GET /me` return banned status → redirect ke `/suspended`
  - Jangan bisa navigate ke halaman lain
  - Logout tetap bisa

### Appeal Submitted State
- [ ] Setelah appeal submitted:
  - "Banding sudah dikirim"
  - "Kami akan meninjau dalam 1-3 hari kerja"
  - "Kamu akan menerima email notifikasi"
  - Disable submit button (satu appeal per ban)

---

## 9.6 Change Password Page Enhancement

### Current State
- [ ] Audit existing change password — enhance:
  - Current password input
  - New password input + PasswordStrength component
  - Confirm new password
  - 2FA code input (jika 2FA enabled)
  - Loading state pada submit
  - Success: toast + optional logout other sessions

---

## 9.7 Cookie Consent UI (dari FE Batch 8)

### Cookie Banner Component
- [ ] `/fe/components/cookie-consent.tsx`:
  - Slide-up from bottom
  - "Kami menggunakan cookies untuk meningkatkan pengalaman kamu."
  - [Terima Semua] [Pengaturan] [Tolak Non-Essential]
  - Settings modal:
    - Essential: always on (toggle disabled)
    - Analytics: toggle (default off)
    - Description per category
  - Save preference → localStorage
  - Animate in/out (framer-motion)

---

## Checklist Selesai
- [ ] Delete account: full flow working (request, pending banner, cancel)
- [ ] Data export: request → email received → download works
- [ ] 2FA: enable, disable, login, backup codes — all working
- [ ] Session management: list, revoke individual, revoke all
- [ ] Suspension page: shows reason, appeal form
- [ ] Change password: enhanced with 2FA + strength
- [ ] Cookie consent: banner, settings, persistence
- [ ] `npm run build` PASS
- [ ] Mobile responsive check
- [ ] Dark mode check

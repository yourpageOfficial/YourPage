# Batch 15: Gap Resolution, CI/CD Automation & Production Readiness

> **Tujuan:** Menutup seluruh gap yang ditemukan antara dokumen perencanaan (Batch 1–14) dan codebase aktual, mengaktifkan otomatisasi CI/CD, memperluas cakupan testing, serta memastikan sistem 100% siap untuk rilis produksi.

**Status:** 🟡 Ready for Implementation  
**Tanggal:** 2026-08-23  
**Priority:** HIGH — Syarat mutlak sebelum live production deploy  
**Estimasi Files:** ~8 file baru, ~3 modified  

---

## 15.1 GitHub Actions CI/CD Pipeline (`.github/workflows/`)

**Problem:** Dokumen Batch 7 menandai CI/CD selesai, namun folder `.github/workflows/` belum ada di repository.

### A. Backend CI Pipeline (`.github/workflows/be-ci.yml`)
- [ ] Buat file `.github/workflows/be-ci.yml` dengan job:
  - **Linting:** Menjalankan `golangci-lint` (errcheck, govet, staticcheck, ineffassign).
  - **Testing:** Menjalankan `go test ./... -v -race -coverprofile=coverage.out` dengan service container PostgreSQL 16 & Redis 7.
  - **Build:** Memastikan `go build ./cmd/api` dan `go build ./cmd/migrate` berhasil dikompilasi tanpa error.
- [ ] Trigger: `push` dan `pull_request` pada branch `main` dengan path filter `be/**`.

### B. Frontend CI Pipeline (`.github/workflows/fe-ci.yml`)
- [ ] Buat file `.github/workflows/fe-ci.yml` dengan job:
  - **Type-Check:** Menjalankan `npx tsc --noEmit` (TypeScript strict mode).
  - **Linting:** Menjalankan `npm run lint` (ESLint flat config Next.js core web vitals).
  - **Build:** Menjalankan `npm run build` (Turbopack production build untuk seluruh 51+ routes).
- [ ] Trigger: `push` dan `pull_request` pada branch `main` dengan path filter `fe/**`.

### C. Deployment Pipeline (`.github/workflows/deploy.yml`)
- [ ] Buat file `.github/workflows/deploy.yml` dengan flow:
  - Tunggu `be-ci` dan `fe-ci` PASS.
  - SSH ke target server produksi / VPS.
  - Eksekusi `git pull origin main`.
  - Jalankan migrasi: `docker compose exec api /app/migrate up`.
  - Restart container dengan zero-downtime: `docker compose up -d --build`.
  - Health check endpoint: `curl -f https://yourpage.id/api/v1/health`.

---

## 15.2 Script Backup & Disaster Recovery Database (`scripts/`)

**Problem:** Tidak ada script otomatisasi backup PostgreSQL yang tersimpan di codebase.

### A. Auto Backup Script (`scripts/backup-db.sh`)
- [ ] Buat script executable `scripts/backup-db.sh`:
  - Dump database dengan `pg_dump` dan kompresi `gzip`.
  - Format penamaan: `yourpage_backup_YYYYMMDD_HHMMSS.sql.gz`.
  - Retensi otomatis: Hapus backup yang lebih lama dari 30 hari (`find -mtime +30 -delete`).
  - Log status backup ke `/var/log/yourpage-backup.log`.

### B. Restore Script (`scripts/restore-db.sh`)
- [ ] Buat script `scripts/restore-db.sh` untuk uji pemulihan bencana (disaster recovery):
  - Dekompresi dan restore ke instance PostgreSQL uji.
  - Validasi integritas tabel setelah restore.

---

## 15.3 Perluasan Cakupan Unit & Integration Test (Target 75%+ Coverage)

**Problem:** Baru ada 9 file test di `be/`, handler autentikasi, admin, dan webhook belum memiliki automated test.

### A. Auth & Session Handler Tests (`be/internal/handler/auth_test.go`)
- [ ] Test `POST /api/v1/auth/register` (validasi input, username unik, hashing password).
- [ ] Test `POST /api/v1/auth/login` (verifikasi Set-Cookie `access_token` HttpOnly, `refresh_token`, dan signed `auth-role`).
- [ ] Test `POST /api/v1/auth/refresh` (rotasi refresh token dari cookie).
- [ ] Test `POST /api/v1/auth/logout` (penghapusan cookie dan blacklist token di Redis).

### B. Admin & Moderation Handler Tests (`be/internal/handler/admin_test.go`)
- [ ] Test RBAC Role Protection (User non-admin mendapat response `403 Forbidden`).
- [ ] Test `POST /api/v1/admin/topups/:id/approve` & `reject` (verifikasi penambahan saldo wallet).
- [ ] Test `POST /api/v1/admin/kyc/:id/approve` (verifikasi status verifikasi kreator).
- [ ] Test `POST /api/v1/admin/withdrawals/:id/process` (verifikasi mutasi saldo penarikan).

### C. Webhook Payment Tests (`be/internal/handler/webhook_test.go`)
- [ ] Test validasi token callback Xendit (`x-callback-token`).
- [ ] Test validasi signature PayPal.
- [ ] Test proteksi idempotency pada webhook ganda / duplicate event.

---

## 15.4 Integrasi Sentry & APM Error Tracking

**Problem:** Kode inisialisasi Sentry belum aktif di `be/cmd/api/main.go`.

- [ ] Tambahkan konfigurasi opsional Sentry di `be/cmd/api/main.go`:
  ```go
  if cfg.Sentry.DSN != "" {
      if err := sentry.Init(sentry.ClientOptions{
          Dsn:              cfg.Sentry.DSN,
          Environment:      cfg.App.Env,
          TracesSampleRate: 0.2,
      }); err == nil {
          defer sentry.Flush(2 * time.Second)
          log.Info().Msg("sentry error tracking initialized")
      }
  }
  ```
- [ ] Pasang middleware `sentrygin.New(...)` untuk auto-capture panic pada router.

---

## 15.5 Database Migration Hygiene & Cleanup

**Status:** ✅ Selesai diimplementasikan di `0048_schema_cleanup.sql`.

- [x] Migrasi `0048_schema_cleanup.sql` dibuat untuk:
  - Menghapus index duplikat (`idx_creator_profiles_slug`, `idx_follows_creator`, `idx_chat_messages_conv`).
  - Membuat composite index yang terlewat (`idx_memberships_creator_status` dan `idx_memberships_status_expires`).
  - Menambahkan index foreign key `idx_posts_membership_tier` pada `posts(membership_tier_id)`.
  - Standarisasi kolom waktu ke `TIMESTAMPTZ`.
- [x] Melengkapi script `-- +goose Down` pada migrasi `0045`, `0046`, dan `0047`.

---

## 15.6 Checklist & Definition of Done (DoD) Batch 15

- [ ] File `.github/workflows/be-ci.yml` dan `.github/workflows/fe-ci.yml` aktif di Git repo.
- [ ] Script backup `scripts/backup-db.sh` siap digunakan.
- [ ] Test suite baru (Auth, Admin, Webhook) lulus saat dijalankan dengan `go test ./...`.
- [ ] Sentry error tracking aktif saat env `SENTRY_DSN` diisi.
- [ ] Seluruh migrasi `0001` s/d `0048` berjalan lancar saat `goose up` dan `goose down`.
- [ ] `go test ./...` PASS 100% dan `npm run build` PASS 100%.

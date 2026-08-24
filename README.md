# YourPage — Platform Monetisasi Konten untuk Kreator Indonesia

**YourPage** adalah platform all-in-one monetisasi konten untuk kreator Indonesia (menyatukan fitur donasi live streaming OBS, penjualan file digital, postingan berlangganan/membership, dan chat privat berbayar).

---

## 📦 Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Backend** | Go 1.25 + Gin + GORM | Clean Architecture (Handler, Service, Repository) |
| **Frontend** | Next.js 16 (Turbopack) + React 19 + TypeScript | Tailwind CSS, Framer Motion, TanStack Query |
| **Database** | PostgreSQL 16 | 48 Migrations (Goose), UUID v4, Positive Balance Constraint |
| **Cache & Realtime** | Redis 7 | Token Blacklist, Rate Limiting, Session/SSE |
| **Object Storage** | MinIO (S3-Compatible) | Presigned URLs, Magic-byte File Validation |
| **Reverse Proxy** | Nginx / Caddy | SSL/TLS, Rate Limiting, Security Headers, Gzip |
| **Monitoring** | Prometheus + Grafana | Metrics Scraper & Realtime Dashboard |
| **Linter & Quality** | ESLint 9 (Flat Config) + Go Vet | TypeScript Strict Mode, 100% Build Pass |

---

## 🏗️ Arsitektur Sistem

```
Client (Browser / OBS Browser Source / Mobile PWA)
           │
           ▼
     Nginx Gateway (:80 / :443)
     ├── /api/v1/*   ──► Backend Go (:8080)
     ├── /storage/*  ──► MinIO Storage (:9000)
     └── /*          ──► Next.js 16 Frontend (:3000)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
             PostgreSQL 16           Redis 7
```

---

## 🚀 Fitur Utama

### 🎨 Untuk Kreator (Creator Suite)
- **Halaman Profil Kustom (`/c/[slug]`):** Branding warna personal, banner, avatar, dan tautan media sosial.
- **Postingan Berbayar & Eksklusif:** Postingan publik, khusus supporter berbayar, atau bertingkat (*Tier Gated*).
- **Penjualan Produk Digital:** Jual e-book, preset Lightroom, template Notion, link course, atau license key dengan link unduhan instan berpengaman.
- **Donasi & Live Stream Overlay:**
  - Progress bar *Donation Goal* interaktif di profil publik.
  - OBS Browser Source URL (`/overlay?id=...`) dengan notifikasi animasi (*bounce, slide, fade, spin*), suara alert, dan GIF per nominal donasi.
- **Chat DM Berbayar:** Atur tarif Credit per pesan atau gratis, dilengkapi fitur *Auto-reply* untuk kreator Business.
- **Membership Tiers:** Buat paket langganan bulanan fans dengan benefit kustom.
- **Dompet & Pencairan Dana:** Tarik saldo penghasilan (Credit) ke seluruh rekening Bank & E-Wallet Indonesia setelah verifikasi KYC.

### ☕ Untuk Supporter
- **Satu Akun untuk Semua:** Top-up saldo Credit via QRIS nasional (1 Credit = Rp 1.000).
- **Library Digital Permanen:** Akses seumur hidup untuk seluruh produk dan postingan yang telah dibeli.
- **Feed Personal:** Ikuti kreator favorit dan nikmati postingan terbaru di feed utama.
- **Apresiasi & Interaksi:** Kirim pesan donasi dan chat privat 1-on-1 langsung ke kreator.

### 🛡️ Untuk Administrator
- **Dashboard Operasional:** Quick approve/reject top-up manual QRIS, verifikasi KYC KTP, dan permintaan penarikan dana (*withdrawals*).
- **Manajemen Promo Kreator:** Berikan custom fee khusus, featured status, dan durasi promo.
- **Laporan & Moderasi Konten:** Kelola laporan konten dan penanganan pelanggaran hak cipta.
- **Ekspor Data & Audit Log:** Ekspor riwayat transaksi ke CSV dan audit trail lengkap untuk setiap aksi admin.

---

## 💰 Sistem Credit & Platform Tier

### Skema Konversi Credit
```
1 Credit = Rp 1.000 IDR

• Top-up:   Bayar Rp 50.000  ──► Masuk 50 Credit
• Beli:     Post 5 Credit    ──► Terpotong 5 Credit
• Donasi:   Kirim 10 Credit  ──► Kreator menerima 8–9.5 Credit (sesuai tier)
• Payout:   Tarik 100 Credit ──► Rp 100.000 masuk ke rekening bank
```

### Paket Langganan Kreator

| Fitur | Free | Pro (Rp 49.000/bln) | Business (Rp 149.000/bln) |
|---|---|---|---|
| **Platform Fee** | 20% (Kreator dapat 80%) | 10% (Kreator dapat 90%) | **5% (Kreator dapat 95%)** |
| **Produk Digital** | Max 3 Produk | Max 20 Produk | **Unlimited** |
| **Kapasitas Storage** | 1 GB | 10 GB | **50 GB** |
| **Kustomisasi Halaman** | ❌ Standar | ✅ Warna & Banner | ✅ Warna & Banner |
| **Chat DM Reply** | 10 reply/hari | Unlimited | **Unlimited + Auto-Reply** |
| **OBS Custom Tiers** | Standar | 3 Tier Animasi | **Unlimited Tier Animasi** |
| **Ekspor Penjualan (CSV)**| ❌ | ❌ | ✅ Ekspor Lengkap |
| **Badge Khusus** | — | Pro (Biru) | Business (Ungu) |

---

## 🔒 Keamanan & Perlindungan Data

- **Autentikasi Aman:** HttpOnly & Secure Cookies untuk JWT `access_token` dan `refresh_token`, signed HMAC SHA-256 `auth-role` cookie.
- **Atomic Balance Deduction:** Proteksi database-level `balance_credits >= 0` untuk mencegah *race condition* dan *double-spending*.
- **Magic-Byte Upload Validation:** Validasi integritas MIME type file asli pada level biner sebelum disimpan ke MinIO.
- **Rate Limiting:** Token Bucket berbasis Redis untuk proteksi terhadap DDoS dan *brute force*.
- **Content Shield:** Dynamic watermark dan proteksi unduhan sekali pakai (*presigned time-limited URLs*).

---

## 📁 Struktur Direktori

```
YourPage/
├── be/                          # Backend Golang
│   ├── cmd/api/main.go          # Entrypoint API server
│   ├── cmd/migrate/main.go      # Goose migration runner
│   ├── internal/
│   │   ├── entity/              # Model data & entity domain
│   │   ├── handler/             # Gin HTTP handlers, middleware, routes
│   │   ├── service/             # Business logic & transaction orchestration
│   │   ├── repository/postgres/ # PostgreSQL query implementations
│   │   └── pkg/                 # JWT, logger, mailer, payment, storage, validator
│   ├── migrations/              # 48 SQL migration files (Goose)
│   └── BE-improvement/          # Roadmap dokumen teknis (Batch 1–15)
├── fe/                          # Frontend Next.js 16 (App Router)
│   ├── app/                     # 51 Route pages (dashboard, admin, public, chat, overlay)
│   ├── components/              # Reusable UI components & dialogs
│   ├── lib/                     # API client, auth store, toast, utils
│   └── DESIGN_SYSTEM.md         # Dokumentasi design tokens & typography
├── nginx/                       # Konfigurasi Nginx reverse proxy
├── monitoring/                  # Konfigurasi Prometheus & Grafana dashboard
├── review/                      # Dokumen audit code, UI, pSEO, copywriting, & migrations
├── docker-compose.yml           # Local development stack
└── docker-compose.production.yml# Production deployment stack
```

---

## 📝 API Documentation & Swagger UI

- **Interactive Swagger UI:** `http://localhost:8080/swagger/index.html` (atau shortcut `http://localhost:8080/docs`)
- **Base API Path:** `/api/v1`

---

### 🌐 Public & Discovery
- `GET /health` — Health check status (PostgreSQL, Redis)
- `GET /tiers` — Daftar platform subscription tiers (Free, Pro, Business)
- `GET /creators/search?q=&category=&cursor=&limit=` — Pencarian & filter kreator
- `GET /creators/featured` — Daftar kreator unggulan / trending
- `GET /creators/:slug` — Halaman publik profil kreator (bio, goal, links, donation tiers)
- `GET /platform/qris` — URL QRIS platform untuk top-up
- `GET /settings/public` — Pengaturan publik platform (fee rate, min withdrawal, credit rate)

### 🔐 Autentikasi & Akun (`/auth`)
- `POST /auth/register` — Registrasi akun baru (Supporter atau Creator)
- `POST /auth/login` — Login akun (mengembalikan token JSON + Set-Cookie HttpOnly)
- `POST /auth/refresh` — Refresh access token (membaca refresh token dari cookie/body)
- `POST /auth/logout` — Logout & blacklist token di Redis
- `GET /auth/me` — Profil user yang sedang login
- `PUT /auth/me` — Update data profil, avatar, banner, dan donation goal
- `POST /auth/upgrade-creator` — Upgrade role supporter menjadi creator
- `POST /auth/change-password` — Ganti password akun
- `POST /auth/forgot-password` — Permintaan reset password via email
- `POST /auth/reset-password` — Reset password dengan token verifikasi
- `POST /auth/verify-email` — Verifikasi alamat email
- `POST /auth/resend-verification` — Kirim ulang email verifikasi
- `POST /auth/subscribe-tier` — Langganan paket platform (Pro / Business)

### ✍️ Postingan & Konten (`/posts`)
- `GET /posts/:id` — Detail postingan (konten terkunci/terbuka berdasarkan akses)
- `GET /posts/creator/:creatorId` — Daftar postingan milik kreator tertentu
- `POST /posts` — Buat postingan baru (Free / Paid / Tier-gated / Scheduled)
- `PUT /posts/:id` — Edit postingan
- `DELETE /posts/:id` — Soft-delete postingan
- `POST /posts/:id/media` — Unggah media lampiran postingan
- `DELETE /posts/:id/media/:mediaId` — Hapus media lampiran
- `POST /posts/:id/like` — Like postingan
- `DELETE /posts/:id/like` — Unlike postingan
- `GET /posts/:id/comments` — Daftar komentar pada postingan
- `POST /posts/:id/comments` — Tambah komentar pada postingan
- `GET /feed` — Feed personal (postingan dari kreator yang di-follow)

### 📦 Produk Digital (`/products`)
- `GET /products/:id` — Detail produk digital
- `GET /products/creator/:creatorId` — Daftar produk digital milik kreator
- `POST /products` — Buat produk digital baru (File / Link / Key)
- `PUT /products/:id` — Update produk digital
- `DELETE /products/:id` — Hapus produk digital
- `POST /products/:id/assets` — Unggah file aset digital ke MinIO
- `DELETE /products/:id/assets/:assetId` — Hapus file aset produk
- `GET /products/:id/download` — Dapatkan presigned time-limited URL unduhan aset

### 💸 Checkout, Pembayaran & Transaksi (`/checkout`)
- `POST /checkout/post` — Beli akses postingan berbayar dengan Credit
- `POST /checkout/product` — Beli produk digital dengan Credit
- `POST /checkout/donation` — Kirim donasi Credit ke kreator dengan pesan
- `GET /payments/:id` — Cek status pembayaran (Ownership verified)
- `GET /my/transactions` — Riwayat mutasi transaksi supporter
- `GET /creator/sales` — Riwayat penjualan kreator
- `GET /creator/earnings` — Ringkasan penghasilan & saldo kreator
- `GET /creator/analytics` — Statistik & chart pendapatan kreator
- `GET /creator/sales/export` — Ekspor riwayat penjualan ke file CSV (Business Tier)

### 💳 Dompet Credit & Penarikan (`/wallet` & `/withdrawals`)
- `GET /wallet/balance` — Cek saldo Credit dompet
- `GET /wallet/transactions` — Riwayat mutasi Credit
- `POST /wallet/topup` — Ajukan request top-up Credit via QRIS manual
- `POST /wallet/topup/:id/proof` — Unggah bukti transfer QRIS
- `POST /withdrawals` — Ajukan penarikan dana ke rekening Bank / E-Wallet
- `GET /withdrawals` — Riwayat penarikan dana kreator

### 💬 Chat Privat Berbayar (`/chat`)
- `GET /chat` — Daftar percakapan aktif & unread count
- `GET /chat/:id` — Riwayat pesan dalam percakapan (Cursor-based)
- `POST /chat` — Kirim pesan baru (Free atau Paid per Credit tarif kreator)
- `POST /chat/:id/read` — Tandai pesan telah dibaca

### 📺 Live Stream OBS Overlay (`/overlay-tiers`)
- `GET /overlay-tiers/:creatorId` — Daftar tier alert overlay donasi (animasi, GIF, suara)
- `POST /overlay-tiers` — Tambah konfigurasi tier overlay baru
- `DELETE /overlay-tiers/:id` — Hapus konfigurasi tier overlay
- `GET /donations/creator/:creatorId/latest` — Endpoint polling donasi terbaru untuk OBS Source

### 👑 Fan Memberships (`/membership-tiers` & `/memberships`)
- `GET /membership-tiers/:creatorId` — Daftar paket membership kreator
- `POST /membership-tiers` — Buat tier membership fans baru
- `DELETE /membership-tiers/:id` — Hapus tier membership
- `POST /memberships/subscribe` — Berlangganan membership kreator
- `GET /memberships/my` — Daftar membership aktif milik supporter
- `GET /memberships/creator` — Daftar fans yang berlangganan pada kreator

### 📚 Library & Follow
- `GET /library/posts` — Koleksi postingan yang telah dibeli
- `GET /library/products` — Koleksi produk digital yang telah dibeli
- `POST /follow/:creatorId` — Follow kreator
- `DELETE /follow/:creatorId` — Unfollow kreator
- `GET /follow/:creatorId` — Cek status follow
- `GET /notifications` — Daftar notifikasi akun
- `GET /notifications/unread-count` — Jumlah notifikasi belum dibaca
- `PATCH /notifications/:id/read` — Tandai notifikasi dibaca
- `PATCH /notifications/read-all` — Tandai semua notifikasi dibaca

### 📢 Broadcast, KYC & Laporan
- `POST /creator/broadcast` — Kirim pesan siaran ke seluruh supporter/followers
- `POST /kyc` — Ajukan verifikasi identitas KYC (KTP/Identitas)
- `GET /kyc` — Cek status verifikasi KYC
- `POST /upload` — Unggah file lampiran KYC berpengaman
- `POST /reports` — Kirim laporan pelanggaran konten
- `GET /referral` — Dapatkan kode & link referral reward

### 🛡️ Admin & Finance Suite (`/admin`)
- `GET /admin/analytics` — Statistik menyeluruh platform (Revenue, Users, Growth)
- `GET /admin/users` — Kelola daftar pengguna & filter role
- `POST /admin/users/:id/ban` & `unban` — Blokir atau aktifkan akun pengguna
- `POST /admin/users/:id/verify` — Verifikasi centang biru kreator
- `POST /admin/users/:id/promo` — Atur potongan fee khusus/promo untuk kreator
- `POST /admin/users/finance` — Buat akun staf finance
- `GET /admin/withdrawals` — Daftar antrean penarikan dana
- `PATCH /admin/withdrawals/:id` — Setujui / tolak / proses pencairan dana
- `GET /admin/kyc` — Daftar permohonan verifikasi identitas KYC
- `PATCH /admin/kyc/:id` — Setujui / tolak verifikasi identitas
- `GET /admin/credit-topups` — Daftar permohonan top-up saldo QRIS
- `POST /admin/credit-topups/:id/approve` & `reject` — Konfirmasi top-up saldo
- `GET /admin/payments` & `POST /admin/payments/:id/refund` — Kelola pembayaran & refund
- `GET /admin/reports` & `PATCH /admin/reports/:id` — Moderasi laporan konten
- `GET /admin/settings` & `PUT /admin/settings` — Konfigurasi fee platform & QRIS URL
- `GET /admin/profit` & `POST /admin/profit/withdraw` — Ringkasan profit bersih platform
- `GET /admin/export/payments` — Ekspor seluruh pembayaran ke CSV
- `GET /admin/audit-log` — Log audit aktivitas admin

---

## 💻 Panduan Menjalankan Project (Local Development)

### 1. Prasyarat
- Go 1.24+
- Node.js 20+ & npm
- Docker & Docker Compose

### 2. Menjalankan Layanan Database & Storage
```bash
# Menjalankan PostgreSQL, Redis, MinIO, Grafana
docker compose up -d
```

### 3. Menjalankan Backend (Go)
```bash
cd be

# Menjalankan migrasi database
go run cmd/migrate/main.go up

# Menjalankan unit tests
go test ./...

# Menjalankan API server
go run cmd/api/main.go
# API aktif di http://localhost:8080
```

### 4. Menjalankan Frontend (Next.js 16)
```bash
cd fe

# Install dependencies
npm install

# Type-check & lint
npm run type-check
npm run lint

# Menjalankan dev server
npm run dev
# Frontend aktif di http://localhost:3000
```

---

## 🚀 Panduan Deployment & Launch Checklist (Production)

### 1. Konfigurasi Environment Production
Salin template konfigurasi dan atur kredensial acak yang kuat:
```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

### 2. Validasi Konfigurasi Reverse Proxy & Compose
```bash
docker compose -f docker-compose.production.yml config
```

### 3. Deploy Semua Layanan dengan Docker Compose
```bash
docker compose -f docker-compose.production.yml up -d --build
```

### 4. Checklist Pra-Peluncuran (Production Launch Checklist)
- [ ] **SSL/TLS & Domain:** Sertifikat Let's Encrypt aktif (`urpage.online`) dengan redirect otomatis HTTP ➔ HTTPS.
- [ ] **Security Headers:** HSTS (`max-age=63072000`), CSP, X-Content-Type-Options (`nosniff`), dan Permissions-Policy aktif.
- [ ] **Database Migration:** Migrasi `0001_initial.sql` hingga `0050_password_histories.sql` berjalan sukses tanpa error.
- [ ] **MinIO Storage:** Bucket `public-media` (publik) dan `private-media` (privat dengan URL presigned) terinisialisasi.
- [ ] **Admin Credentials:** Password default `changeme123` diganti dengan string acak $\ge 32$ karakter.
- [ ] **Monitoring & APM:** Prometheus scraper aktif di `:9090` dan Grafana dashboard di `:3002`.
- [ ] **Health Checks:** Endpoint `/health` dan `/api/v1/health` mengembalikan status `200 OK`.

---

## 📚 Dokumen Audit & Peningkatan Terkait

- 📑 [Code Review & Security Audit](review/code-review.md)
- 🎨 [Frontend UI & Accessibility Audit](review/fe-review.md)
- 🚀 [Programmatic SEO Strategy](review/programmatic-seo-review.md)
- ✍️ [Conversion Copywriting Review](review/copywriting-review.md)
- 🗄️ [Database Migrations Audit](review/migrations-review.md)
- 📋 [Backend Improvement Roadmap (Batch 1–15)](be/BE-improvement/batch-15-gap-resolution-production-readiness.md)

---

## 📄 Lisensi

© 2026 YourPage. Seluruh hak cipta dilindungi.


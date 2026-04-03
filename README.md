# YourPage — Platform Monetisasi Konten untuk Kreator Indonesia

## 🌐 Live
- **Production**: http://34.128.104.178 (GCP VM Jakarta)
- **Admin**: admin@yourpage.id / admin123 ⚠️ GANTI PASSWORD!

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Go 1.25 + Gin + GORM |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Gateway | Nginx (reverse proxy + rate limit + gzip + cache) |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions (deploy on tag push) |
| Hosting | GCP Compute Engine (Jakarta) |

---

## 🏗️ Arsitektur

```
Client → Nginx (:80/443)
           ├── /api/*     → Backend (:8080)
           ├── /storage/* → MinIO (:9000)
           └── /*         → Frontend (:3000)

Backend → PostgreSQL + Redis + MinIO
```

---

## 🚀 Fitur (75+ endpoints, 51 pages)

### Untuk Supporter
- Register/Login (JWT auth)
- Explore & search kreator
- Follow kreator → Feed personal
- Beli konten berbayar (post & produk digital)
- Donasi ke kreator (dengan pesan & media)
- Chat DM ke kreator (gratis atau berbayar)
- Wallet Credit (top-up QRIS manual)
- Notifikasi real-time
- Library (konten yang sudah dibeli — akses permanen)

### Untuk Creator
- Dashboard analytics (ringkasan, penjualan, chart)
- Buat post (gratis/berbayar, scheduled, media upload)
- Buat produk digital (file download atau link/key)
- Terima donasi + donation goal (progress bar di halaman publik)
- Chat settings (harga per chat, auto-reply untuk Business tier)
- OBS Overlay (notifikasi donasi saat live streaming)
  - 4 animasi (bounce/slide/fade/spin)
  - Custom text template
  - GIF/gambar per tier donasi
  - Supporter bisa kirim media
- Custom page (warna aksen, banner, social links)
- Withdrawal ke rekening bank (KYC required)
- Tier subscription (Free/Pro/Business)

### Untuk Admin
- Dashboard (pending items, quick approve/reject)
- Kelola users, posts, products, payments, donations
- Approve/reject top-up, withdrawal, KYC
- Bulk action (select multiple, approve/reject sekaligus)
- Promo per creator (custom fee, featured, durasi)
- Export CSV (payments, sales)
- Profit tracking
- Platform settings (fee, QRIS, min withdrawal)
- Audit log (semua admin action di-log)

---

## 💰 Sistem Credit

```
1 Credit = Rp 1.000

Top-up:  Bayar Rp 50.000 → Dapat 50 Credit
Beli:    Post 5 Credit → Potong 5 Credit dari wallet
Donasi:  Kirim 10 Credit → Creator dapat 8 Credit (fee 20%)
Withdraw: Tarik 100 Credit → Dapat Rp 100.000 ke rekening
```

Semua transaksi dalam **Credit**. Satu wallet untuk semua (top-up + earnings).

---

## 📊 Tier System

| | Free | Pro (Rp 49K/bln) | Business (Rp 149K/bln) |
|---|---|---|---|
| Fee | 20% | 10% | 5% |
| Produk | Max 3 | Max 20 | Unlimited |
| Storage | 1 GB | 10 GB | 50 GB |
| Analytics | Basic | Advanced | Advanced + Export |
| Custom page | ❌ | ✅ | ✅ |
| Scheduled posts | ❌ | ✅ | ✅ |
| Chat reply/hari | 10 | Unlimited | Unlimited |
| Auto-reply chat | ❌ | ❌ | ✅ |
| Badge | - | Pro (biru) | Business (ungu) |
| Priority support | ❌ | ❌ | ✅ |

- Tier expired → auto downgrade ke Free
- Product > limit → deactivate (bukan hapus)
- Admin bisa set promo fee per creator

---

## 🔒 Security

- JWT auth + refresh token + blacklist on logout
- Role-based access (admin/creator/supporter)
- CORS restricted ke domain
- Rate limiting (Nginx + app level)
- File upload: magic byte validation + sanitized filename
- Input sanitization (XSS prevention)
- Atomic credit deduction (no double-spend)
- Self-purchase blocked
- Admin audit log
- Gzip compression
- Security headers (X-Frame-Options, HSTS, etc)

---

## 📁 Struktur Project

```
YourPage/
├── be/                     # Backend (Go)
│   ├── cmd/api/main.go     # Entry point
│   ├── internal/
│   │   ├── entity/         # Database models
│   │   ├── handler/        # HTTP handlers + routes
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Database queries
│   │   └── pkg/            # Shared packages
│   └── migrations/         # 35 SQL migrations
├── fe/                     # Frontend (Next.js)
│   ├── app/                # Pages (51 routes)
│   │   ├── dashboard/      # Creator dashboard (13 pages)
│   │   ├── admin/          # Admin panel (15 pages)
│   │   ├── s/              # Supporter dashboard (7 pages)
│   │   ├── c/[slug]/       # Creator public page
│   │   ├── chat/           # Chat
│   │   ├── overlay/        # OBS overlay
│   │   └── ...
│   ├── components/         # Shared UI components
│   └── lib/                # Utils, API client, auth store
├── nginx/                  # Nginx config
├── monitoring/             # Prometheus + Grafana
├── docker-compose.yml      # Development
├── docker-compose.production.yml  # Production
└── .github/workflows/      # CI/CD
```

---

## 🖥️ Development

```bash
# Start semua service
docker compose up -d

# Akses
# FE:      http://localhost:3000
# BE:      http://localhost:8080
# MinIO:   http://localhost:9001
# Grafana: http://localhost:3002
```

---

## 🚢 Production Deploy

### Via CI/CD (recommended)
```bash
# Commit + tag → auto deploy
./release.sh v1.3.0 "Description"
```

### Manual
```bash
# SSH ke VM
gcloud compute ssh --zone "asia-southeast2-a" "instance-20260403-142236" --project "yourpage-492213"

# Pull + rebuild
cd ~/YourPage
git pull origin main
sudo docker compose -f docker-compose.production.yml up -d --build
```

### GitHub Secrets (sudah di-set)
- `VM_HOST`: 34.128.104.178
- `VM_USER`: entrustinv088
- `VM_SSH_KEY`: deploy key

---

## 📊 Database

35 migrations, tabel utama:
- `users` — semua user (admin/creator/supporter)
- `creator_profiles` — profil kreator (tier, fee, settings)
- `posts` + `post_media` — konten
- `products` + `product_assets` — produk digital
- `payments` — semua transaksi
- `donations` — donasi
- `user_wallets` — saldo Credit
- `credit_topup_requests` — top-up manual
- `withdrawals` — penarikan
- `chat_conversations` + `chat_messages` — DM
- `overlay_tiers` — GIF overlay per tier
- `follows` — follow system
- `notifications` — notifikasi
- `content_reports` — laporan konten
- `user_kyc` — verifikasi identitas
- `creator_tiers` — paket langganan
- `admin_audit_logs` — audit trail

---

## 🔑 Environment Variables

Lihat `.env.production` untuk template. Key variables:
- `DB_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `MINIO_PASSWORD`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — admin dibuat saat startup
- `DOMAIN` — untuk CORS restriction

---

## 📝 API Documentation

Base URL: `/api/v1`

### Public
- `GET /tiers` — list tier
- `GET /creators/search?q=` — search kreator
- `GET /creators/featured` — featured kreator
- `GET /creators/:slug` — halaman kreator
- `GET /overlay-tiers/:creatorId` — overlay GIF tiers
- `GET /donations/creator/:id/latest` — latest donation (untuk overlay)

### Auth
- `POST /auth/register` — register
- `POST /auth/login` — login
- `POST /auth/logout` — logout
- `GET /auth/me` — profile
- `PUT /auth/me` — update profile
- `POST /auth/change-password`
- `POST /auth/subscribe-tier` — upgrade/downgrade tier

### Content
- `POST/GET/PUT/DELETE /posts` — CRUD post
- `POST/GET/PUT/DELETE /products` — CRUD produk
- `POST /checkout/post` — beli post
- `POST /checkout/product` — beli produk
- `POST /checkout/donation` — donasi

### Wallet
- `GET /wallet/balance` — saldo
- `GET /wallet/transactions` — riwayat
- `POST /wallet/topup` — request top-up

### Chat
- `GET /chat` — list conversations
- `GET /chat/:id` — messages
- `POST /chat` — kirim pesan

### Admin (20+ endpoints)
- `GET /admin/analytics` — dashboard
- `GET/POST/PATCH /admin/users|posts|products|payments|...`

---

## 👥 Tim

Dibuat dengan bantuan AI (Kiro). Untuk pertanyaan teknis, lihat kode + komentar di setiap file.

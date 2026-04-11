# PRD — YourPage Platform

**Versi:** 2.0
**Tanggal:** 11 April 2026
**Status:** Updated — reflects actual implementation

---

## 1. Overview

**YourPage** adalah platform monetisasi konten untuk kreator Indonesia. Kreator dapat mempublikasikan konten berbayar maupun gratis, menjual produk digital, menerima donasi, dan membangun komunitas membership — semua dalam satu halaman personal.

**Tagline:** *Halaman kamu, penghasilanmu.*

---

## 2. Problem Statement

Kreator konten Indonesia tidak punya platform lokal yang menyatukan:
- Jual konten berbayar (post, video, artikel, audio)
- Toko produk digital (e-book, preset, template)
- Donasi/tip langsung dari fans
- Membership/subscription per kreator
- Pembayaran via QRIS (metode paling populer di Indonesia)

Platform global (Patreon, Gumroad) tidak support QRIS, tidak dioptimasi untuk pasar lokal, dan tidak mobile-first untuk audiens Indonesia.

---

## 3. Target Pengguna

| Persona | Deskripsi |
|---------|-----------|
| **Kreator** | Content creator, fotografer, penulis, musisi, illustrator yang ingin monetisasi karya |
| **Supporter/Fan** | Pengikut setia yang ingin mendukung kreator favorit |
| **Admin Platform** | Tim YourPage yang mengelola operasional, moderasi, dan keuangan |

---

## 4. Tech Stack

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
| Payment | Xendit (QRIS) + PayPal + QRIS Manual |

---

## 5. Fitur — Implemented ✅

### 5.1 Autentikasi & Akun
- ✅ Register/Login (email + password, JWT)
- ✅ Refresh token + blacklist on logout
- ✅ Forgot password + reset password
- ✅ Email verification (optional, resend)
- ✅ Change password
- ✅ Upgrade supporter → creator
- ✅ Subscribe tier (Free/Pro/Business)
- ✅ Delete account (request + cancel)
- ✅ Export data (GDPR-style)
- ✅ Role-based access (admin/creator/supporter)

### 5.2 Halaman Kreator Publik (`/c/[slug]`)
- ✅ Profil publik (avatar, bio, banner, social links)
- ✅ Feed post (gratis & berbayar)
- ✅ Toko produk digital
- ✅ Tombol donasi + donation goal
- ✅ Follow button + follower count
- ✅ Search kreator + featured kreator
- ✅ Custom page (warna aksen, banner) — Pro/Business tier

### 5.3 Sistem Post
- ✅ CRUD post (create, read, update, delete)
- ✅ Post gratis & berbayar (blur + frosted glass overlay)
- ✅ Multi-media upload (gambar, video, audio, dokumen)
- ✅ Add/delete media individual
- ✅ Like/unlike post
- ✅ Comments (create, list, delete)
- ✅ Scheduled posts — Pro/Business tier
- ✅ Purchased = permanent access (no expiry)

### 5.4 Produk Digital
- ✅ CRUD produk (nama, deskripsi, harga, thumbnail)
- ✅ Multiple assets per produk
- ✅ Add/delete asset individual
- ✅ Download via pre-signed URL (MinIO, 15min expiry)
- ✅ Product limits per tier (Free: 3, Pro: 20, Business: unlimited)

### 5.5 Donasi
- ✅ Donasi nominal bebas
- ✅ Donasi anonim (optional auth)
- ✅ Pesan donasi
- ✅ Donation goal (progress bar di halaman publik)
- ✅ Top supporters list
- ✅ Latest donations (untuk OBS overlay)
- ✅ Platform fee per tier (Free: 20%, Pro: 10%, Business: 5%)

### 5.6 OBS Overlay (Live Streaming)
- ✅ 4 animasi (bounce/slide/fade/spin)
- ✅ Custom text template
- ✅ GIF/gambar per tier donasi
- ✅ Sound per tier (optional)
- ✅ Overlay tier limit per subscription tier
- ✅ Supporter bisa kirim media

### 5.7 Membership System (NEW — tidak ada di PRD v1)
- ✅ Creator buat membership tiers (max 5)
- ✅ Supporter subscribe tier (bayar credit/bulan)
- ✅ Auto-deduct credit
- ✅ Active member tracking
- ✅ Cannot delete tier with active members
- ✅ Cannot subscribe to self
- ✅ Notification ke creator saat member baru

### 5.8 Chat / DM
- ✅ List conversations
- ✅ Send message + get messages
- ✅ Mark read
- ✅ Chat settings (harga per chat, auto-reply) — Business tier
- ✅ Chat reply limit per hari (Free: 10, Pro/Business: unlimited)

### 5.9 Credit / Wallet System
- ✅ 1 Credit = Rp 1.000
- ✅ Top-up via QRIS Manual (admin approve)
- ✅ Top-up via Xendit QRIS (webhook otomatis)
- ✅ Top-up via PayPal (webhook otomatis)
- ✅ Upload bukti transfer
- ✅ Bayar pakai credit (post, produk, donasi, membership)
- ✅ Riwayat transaksi (credit transactions)
- ✅ Saldo ditampilkan di navbar
- ✅ Credit tidak expired

### 5.10 Follow & Feed
- ✅ Follow/unfollow kreator
- ✅ Check is_following
- ✅ Feed — post terbaru dari kreator yang diikuti
- ✅ Notifications (list, unread count, mark read, mark all, delete)

### 5.11 Withdrawal
- ✅ Request penarikan (nominal + info rekening)
- ✅ Minimum penarikan configurable (default Rp 100.000)
- ✅ KYC required (upload KTP)
- ✅ Status tracking (pending → approved → processed)
- ✅ Admin approval

### 5.12 Referral System (NEW — tidak ada di PRD v1)
- ✅ Auto-generate referral code per user
- ✅ Reward credits configurable

### 5.13 Broadcast (NEW — tidak ada di PRD v1)
- ✅ Creator broadcast message ke semua follower
- ✅ Rate limit: Pro 1x/minggu, Business 1x/hari
- ✅ Free tier tidak bisa broadcast
- ✅ Atomic rate limit check

### 5.14 Library (Supporter)
- ✅ List purchased posts (permanent access)
- ✅ List purchased products (with download)

### 5.15 Tier System
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
| Broadcast | ❌ | 1x/minggu | 1x/hari |
| Badge | - | Pro (biru) | Business (ungu) |

### 5.16 Admin Panel
- ✅ Dashboard analytics (GMV, users, creators, revenue)
- ✅ User management (list, ban/unban, verify creator, create finance user)
- ✅ Post moderation (list, delete, bulk delete)
- ✅ Product moderation (list, delete)
- ✅ Payment management (list, refund, update status)
- ✅ Donation management (list)
- ✅ Withdrawal management (list, approve/reject, bulk update)
- ✅ KYC management (list, approve/reject, bulk update)
- ✅ Credit top-up management (list, approve/reject, bulk approve/reject)
- ✅ Content reports (list, update status)
- ✅ Promo per creator (custom fee, featured, duration, admin note)
- ✅ Platform settings (fee, QRIS URL, min withdrawal, credit rate)
- ✅ Profit tracking + profit withdrawal
- ✅ Export payments CSV
- ✅ Creator sales export CSV
- ✅ Audit log (semua admin action)

---

## 6. Security — Implemented ✅

- ✅ JWT auth + refresh token + blacklist on logout
- ✅ Role-based access (admin/creator/supporter + admin-only vs finance)
- ✅ CORS restricted ke domain
- ✅ Rate limiting (3 tiers: public 10/20, auth 5/10, action 30/60)
- ✅ File upload: magic byte validation + sanitized filename
- ✅ Input sanitization (XSS prevention)
- ✅ Atomic credit deduction (no double-spend)
- ✅ Self-purchase blocked
- ✅ Admin audit log
- ✅ Gzip compression
- ✅ Security headers (X-Frame-Options, HSTS, etc)
- ✅ Webhook verification (Xendit callback token, PayPal signature)
- ✅ Metrics endpoint restricted to internal IPs
- ✅ Health check endpoint (postgres + redis status)
- ✅ Redis caching (30s public, 5min static)
- ✅ Max upload 500MB

---

## 7. Pages — Implemented (60+ routes)

### Public
- `/` — Landing page
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/verify-email`
- `/c/[slug]` — Creator public page
- `/posts/[id]` — Post detail
- `/products/[id]` — Product detail
- `/explore` — Search & discover kreator
- `/feed` — Following feed
- `/pricing` — Tier pricing
- `/cara-kerja` — How it works
- `/terms`, `/privacy`, `/contact`
- `/overlay` — OBS overlay page
- `/status` — Platform status
- `/upgrade` — Upgrade tier

### Supporter (`/s/`)
- `/s/` — Supporter dashboard
- `/s/posts` — Purchased posts
- `/s/products` — Purchased products
- `/s/donations` — Donations sent
- `/s/transactions` — Transaction history
- `/s/transactions/[id]` — Transaction detail
- `/s/wallet` — Wallet
- `/s/settings` — Settings

### Creator (`/dashboard/`)
- `/dashboard/` — Overview (earnings, chart, recent)
- `/dashboard/posts` — Manage posts
- `/dashboard/posts/[id]` — Edit post
- `/dashboard/products` — Manage products
- `/dashboard/products/[id]` — Edit product
- `/dashboard/donations` — Received donations
- `/dashboard/donation-settings` — Donation goal settings
- `/dashboard/sales` — Sales history
- `/dashboard/analytics` — Advanced analytics
- `/dashboard/withdrawals` — Withdrawal requests
- `/dashboard/subscription` — Tier subscription
- `/dashboard/membership` — Membership tiers
- `/dashboard/profile` — Edit profile
- `/dashboard/kyc` — KYC verification
- `/dashboard/overlay` — OBS overlay settings
- `/dashboard/chat-settings` — Chat pricing & auto-reply
- `/dashboard/feed` — Creator feed
- `/dashboard/referral` — Referral program
- `/dashboard/tax` — Tax info

### Admin (`/admin/`)
- `/admin/` — Dashboard analytics
- `/admin/users` — User management
- `/admin/users/[id]` — User detail
- `/admin/posts` — Post moderation
- `/admin/products` — Product moderation
- `/admin/payments` — Payment management
- `/admin/donations` — Donation management
- `/admin/withdrawals` — Withdrawal management
- `/admin/topups` — Credit top-up management
- `/admin/kyc` — KYC management
- `/admin/reports` — Content reports
- `/admin/promo` — Creator promos
- `/admin/profit` — Profit tracking
- `/admin/settings` — Platform settings
- `/admin/profile` — Admin profile

### Other
- `/wallet` — Wallet overview
- `/wallet/topup` — Top-up page
- `/chat` — Chat/DM
- `/library/posts` — Purchased posts library
- `/library/products` — Purchased products library
- `/notifications` — Notifications
- `/profile` — Edit profile
- `/welcome` — Welcome/onboarding
- `/donations/sent` — Sent donations
- `/sitemap.ts` — Dynamic sitemap
- `/robots.ts` — Robots.txt
- `/error.tsx` — Error page
- `/not-found.tsx` — 404 page
- `/offline` — Offline page
- `/suspended` — Suspended account page

---

## 8. API Endpoints — 90+ endpoints

### Public (no auth)
- `GET /health` — Health check (postgres + redis)
- `GET /tiers` — List subscription tiers
- `GET /settings/public` — Public platform settings
- `GET /platform/qris` — Platform QRIS image
- `GET /creators/search` — Search kreator
- `GET /creators/featured` — Featured kreator
- `GET /creators/:slug` — Creator page (optional auth for is_following)
- `GET /posts/:id` — Post detail (optional auth)
- `GET /posts/creator/:creatorId` — Posts by creator
- `GET /products/:id` — Product detail (optional auth)
- `GET /products/creator/:creatorId` — Products by creator
- `GET /donations/creator/:creatorId/latest` — Latest donations
- `GET /donations/creator/:creatorId/top` — Top supporters
- `GET /overlay-tiers/:creatorId` — Overlay GIF tiers
- `GET /membership-tiers/:creatorId` — Membership tiers

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `GET /auth/me`
- `PUT /auth/me`
- `POST /auth/upgrade-creator`
- `POST /auth/change-password`
- `POST /auth/subscribe-tier`
- `POST /auth/delete-account`
- `POST /auth/cancel-deletion`
- `GET /auth/export-data`

### Posts
- `POST /posts` — Create
- `PUT /posts/:id` — Update
- `DELETE /posts/:id` — Delete
- `POST /posts/:id/media` — Add media
- `DELETE /posts/:id/media/:mediaId` — Delete media
- `POST /posts/:id/like` — Like
- `DELETE /posts/:id/like` — Unlike
- `GET /posts/:id/comments` — List comments
- `POST /posts/:id/comments` — Create comment
- `DELETE /posts/:id/comments/:commentId` — Delete comment

### Products
- `POST /products` — Create
- `PUT /products/:id` — Update
- `DELETE /products/:id` — Delete
- `POST /products/:id/assets` — Add asset
- `DELETE /products/:id/assets/:assetId` — Delete asset
- `GET /products/:id/download` — Get download URL

### Donations
- `POST /donations` — Create (optional auth for anonymous)
- `GET /donations/creator/:creatorId` — List by creator
- `GET /donations/sent` — My sent donations

### Checkout & Payments
- `POST /checkout/post` — Buy post
- `POST /checkout/product` — Buy product
- `POST /checkout/donation` — Donate
- `GET /payments/:id` — Payment status
- `GET /my/transactions` — My transactions

### Webhooks
- `POST /webhooks/xendit` — Xendit callback
- `POST /webhooks/paypal` — PayPal webhook

### Wallet
- `GET /wallet/balance` — Balance
- `GET /wallet/transactions` — Transaction history
- `POST /wallet/topup` — Request top-up
- `POST /wallet/topup/:id/proof` — Upload proof

### Library
- `GET /library/posts` — Purchased posts
- `GET /library/products` — Purchased products

### Follow & Notifications
- `POST /follow/:creatorId` — Follow
- `DELETE /follow/:creatorId` — Unfollow
- `GET /follow/:creatorId` — Is following
- `GET /notifications` — List
- `GET /notifications/unread-count` — Unread count
- `PATCH /notifications/:id/read` — Mark read
- `PATCH /notifications/read-all` — Mark all read
- `DELETE /notifications/:id` — Delete
- `DELETE /notifications/dismissed` — Delete read

### Withdrawal & KYC
- `POST /withdrawals` — Create
- `GET /withdrawals` — List mine
- `POST /kyc` — Submit KYC
- `GET /kyc` — Get my KYC
- `POST /upload` — Upload file
- `POST /reports` — Create report

### Creator
- `GET /creator/earnings` — My earnings
- `GET /creator/sales` — Sales list
- `GET /creator/analytics` — Analytics
- `GET /creator/sales/export` — Export CSV
- `POST /creator/broadcast` — Broadcast to followers

### Membership
- `POST /membership-tiers` — Create tier
- `DELETE /membership-tiers/:id` — Delete tier
- `POST /memberships/subscribe` — Subscribe
- `GET /memberships/my` — My subscriptions
- `GET /memberships/creator` — My members

### Overlay
- `POST /overlay-tiers` — Create
- `DELETE /overlay-tiers/:id` — Delete

### Referral
- `GET /referral` — Get/create referral code

### Chat
- `GET /chat` — List conversations
- `GET /chat/:id` — Messages
- `POST /chat` — Send message
- `POST /chat/:id/read` — Mark read

### Admin (20+ endpoints)
- `GET /admin/analytics`
- `GET /admin/users`, `POST /admin/users/:id/ban|unban|verify|promo`
- `POST /admin/users/finance`, `POST /admin/users/bulk-ban`
- `GET /admin/posts`, `DELETE /admin/posts/:id`, `DELETE /admin/posts/bulk-delete`
- `GET /admin/products`, `DELETE /admin/products/:id`
- `GET /admin/payments`, `POST /admin/payments/:id/refund`, `PATCH /admin/payments/:id`
- `GET /admin/donations`
- `GET /admin/withdrawals`, `PATCH /admin/withdrawals/:id`, `PATCH /admin/withdrawals/bulk-update`
- `GET /admin/kyc`, `PATCH /admin/kyc/:id`, `PATCH /admin/kyc/bulk-update`
- `GET /admin/credit-topups`, `POST /admin/credit-topups/:id/approve|reject`
- `POST /admin/credit-topups/bulk-approve|bulk-reject`
- `GET /admin/reports`, `PATCH /admin/reports/:id`
- `GET /admin/promos`
- `GET /admin/settings`, `PUT /admin/settings`
- `GET /admin/export/payments`
- `GET /admin/profit`, `POST /admin/profit/withdraw`
- `GET /admin/audit-log`

---

## 9. Model Bisnis

| Sumber Revenue | Detail |
|---------------|--------|
| Platform Fee | 5-20% per transaksi (tergantung tier kreator) |
| Tier Subscription | Free / Pro Rp 49K/bln / Business Rp 149K/bln |
| Membership Fee | Creator set harga, platform ambil fee |

---

## 10. Fitur Baru vs PRD v1

| Fitur | PRD v1 | Actual |
|-------|--------|--------|
| Membership/subscription per kreator | ❌ Out of scope | ✅ Implemented |
| Referral system | ❌ Out of scope | ✅ Implemented |
| Broadcast ke followers | ❌ Tidak ada | ✅ Implemented |
| Like/unlike post | ❌ Tidak ada | ✅ Implemented |
| Comments on post | ❌ Tidak ada | ✅ Implemented |
| Delete account + cancel | ❌ Tidak ada | ✅ Implemented |
| Export data (GDPR) | ❌ Tidak ada | ✅ Implemented |
| Finance user role | ❌ Tidak ada | ✅ Implemented |
| Profit withdrawal (admin) | ❌ Tidak ada | ✅ Implemented |
| Bulk actions (admin) | ❌ Tidak ada | ✅ Implemented |
| Sitemap + robots.txt | ❌ Tidak ada | ✅ Implemented |
| Offline page | ❌ Tidak ada | ✅ Implemented |
| Suspended page | ❌ Tidak ada | ✅ Implemented |
| Tax info page | ❌ Tidak ada | ✅ Implemented |
| Platform status page | ❌ Tidak ada | ✅ Implemented |
| Tier system (Free/Pro/Business) | ❌ Fee 10% flat | ✅ 3 tiers with different fees |
| OBS overlay sound | ❌ Tidak ada | ✅ Implemented |
| Donation top supporters | ❌ Tidak ada | ✅ Implemented |
| Creator sales export CSV | ❌ Tidak ada | ✅ Implemented |
| Refund payment (admin) | ❌ Tidak ada | ✅ Implemented |

---

## 11. Known Gaps / TODO

### Critical (Before Launch)
- [ ] Domain + HTTPS/SSL — masih HTTP di IP address
- [ ] Ganti admin password default
- [ ] Email service (SMTP) — password reset, receipt, notifikasi belum kirim email

### High
- [ ] Watermark pada konten berbayar (ada di PRD v1, belum implemented)
- [ ] Push notification (web) — sekarang hanya polling
- [ ] Membership auto-renewal / expiry handling
- [ ] Storage quota enforcement per creator

### Medium
- [ ] Discovery page (browse semua kreator) — `/explore` ada tapi terbatas search
- [ ] Email digest untuk engagement
- [ ] Video DRM (Widevine) — fase 2
- [ ] Mobile app — fase 2

### Low
- [ ] Multi-bahasa (i18n)
- [ ] Affiliate program
- [ ] Live streaming
- [ ] Multi-currency

---

## 12. Non-Functional Requirements

| Kategori | Target |
|----------|--------|
| Performa | API response < 300ms (p95) |
| Availability | 99.5% uptime |
| Mobile | Fully responsive, mobile-first |
| File upload | Max 500MB per file |
| Security | OWASP Top 10 compliant |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions, deploy on tag push |
| Caching | Redis (30s public, 5min static) |
| Rate Limiting | 3 tiers (public/auth/action) |

---

*PRD v2.0 — Updated 11 April 2026. Reflects actual codebase state.*

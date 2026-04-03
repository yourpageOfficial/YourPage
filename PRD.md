# PRD — YourPage Platform

**Versi:** 1.0
**Tanggal:** 31 Maret 2026
**Status:** Disetujui untuk Implementasi

---

## 1. Overview

**YourPage** adalah platform monetisasi konten untuk kreator Indonesia. Kreator dapat mempublikasikan konten berbayar maupun gratis, menjual produk digital, dan menerima donasi dari pendukung mereka — semua dalam satu halaman personal.

**Tagline:** *Halaman kamu, penghasilanmu.*

---

## 2. Problem Statement

Kreator konten Indonesia tidak punya platform lokal yang menyatukan:
- Jual konten berbayar (post, video, artikel, audio)
- Toko produk digital (e-book, preset, template)
- Donasi/tip langsung dari fans
- Pembayaran via QRIS (metode paling populer di Indonesia)

Platform global (Patreon, Gumroad) tidak support QRIS, tidak dioptimasi untuk pasar lokal, dan tidak mobile-first untuk audiens Indonesia.

---

## 3. Target Pengguna

| Persona | Deskripsi |
|---------|-----------|
| **Kreator** | Content creator, fotografer, penulis, musisi, illustrator yang ingin monetisasi karya mereka |
| **Supporter/Fan** | Pengikut setia yang ingin mendukung kreator favorit dengan membeli konten atau mengirim donasi |
| **Admin Platform** | Tim YourPage yang mengelola operasional platform, moderasi, dan keuangan |

---

## 4. Fitur & Persyaratan Fungsional

### 4.1 Halaman Kreator Publik (`/[username]`)

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Profil publik | Avatar, display name, bio, header image, link sosial | P0 |
| Feed post | Daftar post terbaru (gratis & berbayar) | P0 |
| Toko digital | Daftar produk digital yang dijual | P0 |
| Tombol donasi | CTA donasi menonjol di halaman | P0 |
| Follow button | Tombol follow kreator | P1 |
| Followers count | Jumlah follower ditampilkan | P2 |

### 4.2 Sistem Post

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Buat post | Editor teks kaya + upload multi-media | P0 |
| Post gratis | Semua pengunjung dapat melihat konten penuh | P0 |
| Post berbayar | Konten di-blur, perlu beli untuk unlock | P0 |
| Media types | Gambar, video (max 500MB), audio, dokumen (PDF/ZIP) | P0 |
| Draft & publish | Simpan sebagai draft, publish kapan saja | P0 |
| Watermark | Konten berbayar di-overlay dengan username + ID pembeli | P1 |
| Hapus media | Creator bisa hapus media individual dari post | P1 |

**Perilaku Post Berbayar:**
- Excerpt + thumbnail selalu tampil (tidak di-blur)
- Konten utama & media di-blur dengan frosted glass overlay
- Setelah dibeli → terbuka **permanen** (tidak ada expiry)
- Pembelian dicek via tabel `post_purchases` (bukan status payment langsung)

### 4.3 Produk Digital (Catalog)

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Buat produk | Nama, deskripsi, harga, thumbnail, upload file aset | P0 |
| Tipe produk | E-book, preset, template, lainnya | P0 |
| Beli produk | Supporter checkout → download setelah bayar | P0 |
| Download aman | Link pre-signed (MinIO), expiry 15 menit | P0 |
| Multiple assets | Satu produk bisa punya banyak file aset | P1 |
| Sales counter | Tampil berapa kali produk sudah dibeli | P2 |

### 4.4 Donasi / Tip

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Donasi nominal bebas | Supporter input jumlah (tidak fixed tier) | P0 |
| Donasi anonim | Bisa tanpa login, tampil sebagai "Anonim" | P0 |
| Pesan donasi | Supporter kirim pesan singkat bersama donasi | P0 |
| Platform fee | YourPage ambil 10% dari setiap donasi | P0 |
| Notifikasi kreator | Kreator dapat notifikasi saat donasi masuk | P1 |

### 4.5 Sistem Pembayaran

| Metode | Usecase | Konfirmasi | Status |
|--------|---------|-----------|--------|
| QRIS (Xendit) | Post, produk, donasi, top-up credit | Otomatis via webhook | P0 |
| PayPal | Post, produk, donasi, top-up credit | Otomatis via webhook | P0 |
| QRIS Manual (platform) | Top-up credit saja | Manual oleh admin | P0 |
| YourPage Credit | Post, produk, donasi | Instan (deduct wallet) | P0 |

**Platform Fee: 10%** diambil dari semua jenis transaksi (post, produk, donasi).

### 4.6 Credit / Wallet System

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Beli credit | Via QRIS Xendit / PayPal / QRIS Manual | P0 |
| Rate | 1 Credit = Rp 1.000 | P0 |
| Bayar pakai credit | Checkout tanpa keluar platform | P0 |
| Riwayat transaksi | Topup dan pengeluaran tercatat | P0 |
| Saldo ditampilkan | Balance selalu visible di navbar/dashboard | P1 |

#### Cara Top-Up Credit

**Metode 1 — QRIS Xendit (Otomatis)**
1. User buka halaman `/wallet/topup`
2. Input nominal top-up (min. Rp 10.000, kelipatan Rp 1.000)
3. Pilih metode **QRIS**
4. Sistem generate QR code dinamis via Xendit API
5. User scan QR dengan banking app / e-wallet
6. Xendit kirim webhook ke BE saat pembayaran berhasil
7. BE atomic: tambah kredit ke `user_wallets`, catat di `credit_transactions`
8. FE polling `/payments/:id` setiap 3 detik → saat status `paid`, tampilkan konfirmasi + update saldo

**Metode 2 — PayPal (Otomatis)**
1. User buka halaman `/wallet/topup`
2. Input nominal top-up
3. Pilih metode **PayPal**
4. Redirect ke PayPal checkout page (PayPal Orders API v2)
5. User approve di PayPal → redirect kembali ke YourPage
6. PayPal kirim webhook ke BE → kredit ditambahkan otomatis
7. Tampilkan konfirmasi saldo bertambah

**Metode 3 — QRIS Manual Platform (Dikonfirmasi Admin)**
1. User buka halaman `/wallet/topup`
2. Input nominal top-up
3. Pilih metode **Transfer QRIS Manual**
4. Sistem tampilkan QR code statis milik YourPage (gambar yang diupload admin)
5. User scan & transfer ke rekening YourPage
6. User isi form konfirmasi: nominal transfer + nama pengirim + bukti transfer (upload foto)
7. Request masuk ke antrian admin di panel `/admin/credit-topups`
8. Admin verifikasi bukti transfer → klik **Approve**
9. BE atomic: tambah kredit ke wallet user, catat transaksi
10. User dapat notifikasi: "Top-up Rp X.000 berhasil, saldo bertambah X credit"

#### Konversi & Batasan
| Ketentuan | Nilai |
|-----------|-------|
| Rate | 1 Credit = Rp 1.000 |
| Minimum top-up | Rp 10.000 (10 credit) |
| Top-up tidak kena platform fee | Credit langsung 1:1 |
| Credit tidak bisa dicairkan | Hanya untuk transaksi di platform |
| Credit tidak expired | Berlaku selamanya |

### 4.7 Follow & Feed

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Follow kreator | One-tap follow dari halaman kreator | P0 |
| Following feed | Halaman `/feed` — post terbaru dari kreator yang diikuti | P0 |
| Post terbuka di feed | Post yang sudah dibeli tampil unlocked di feed | P0 |
| Notifikasi post baru | Follower dapat notifikasi saat kreator publish | P1 |

### 4.8 Notifikasi & Bukti Pembayaran

| Trigger | Penerima | Jalur |
|---------|---------|-------|
| Kreator publish post baru | Semua follower kreator | In-App |
| Pembelian post/produk / donasi keluar | Supporter yang membayar | In-App & Email Receipt |
| Pembelian masuk / Donasi diterima | Kreator yang menerima | In-App |
| Status withdrawal diupdate | Kreator yang request | In-App & Email |

- Polling in-app unread count setiap 30 detik (badge di navbar)
- Halaman `/notifications` untuk lihat semua notifikasi
- Mark as read individual / mark all as read

### 4.9 Withdrawal (Kreator)

| Fitur | Deskripsi |
|-------|-----------|
| Request penarikan | Kreator input nominal + info rekening bank |
| Minimum penarikan | **Rp 100.000** |
| KYC Akun | Wajib unggah KTP & verifikasi nama pemilik rekening sesuai dengan KTP (untuk pencairan perdana) |
| Status tracking | pending → approved → processed |
| Admin approval | Admin verifikasi dan proses transfer manual |
| Notifikasi | Kreator dapat notifikasi setiap perubahan status |

### 4.10 Autentikasi & Akun

- **Registrasi & Login:** Menggunakan Email + Password (fase 1).
- **Perubahan Role:** User mendaftar sebagai *Supporter* secara default. Untuk menjadi *Creator*, perlu melengkapi profil profil tambahan di dashboard.
- **Forgot Password:** Request reset via email, token reset disimpan 15 menit (Redis), link reset dikirim ke email terdaftar.
- **Verifikasi Email:** **Opsional** (fase 1, tidak wajib).

### 4.11 Moderasi & Pelaporan

- **Report Button:** Tersedia di setiap post dan halaman kreator agar pengguna dapat melaporkan konten (NSFW, plagiasi, penipuan, dsb).
- **Admin Dashboard:** Menyediakan antrean laporan masuk untuk ditinjau oleh Admin (Approve/Reject report).
- **Sanksi:** Admin berhak melakukan penangguhan (suspend) terhadap kreator atau mencopot (take down) post yang melanggar ketentuan.

---

## 5. Dashboard per Peran

### 5.1 Creator Dashboard

```
Sidebar menu:
├── Overview          ← Ringkasan pendapatan + grafik 30 hari
├── Posts             ← CRUD post, toggle free/paid, status
├── Products          ← CRUD produk, upload aset, kelola
├── Donations         ← History donasi diterima
└── Withdrawals       ← Saldo tersedia + request + riwayat
```

**Overview page:**
- Card: total earning, earning bulan ini, total penjualan, saldo tersedia
- Line chart: pendapatan per hari (30 hari terakhir)
- Tabel donasi terbaru

### 5.2 Supporter Dashboard

```
Sidebar menu:
├── Library - Posts     ← Semua post yang sudah dibeli
├── Library - Products  ← Semua produk + tombol download
├── Donations Sent      ← History donasi yang pernah dikirim
└── Wallet              ← Saldo credit + riwayat + top-up
```

### 5.3 Admin Panel

```
Sidebar menu:
├── Dashboard         ← Analytics platform (GMV, users, creators)
├── Users             ← Manajemen user (ban/unban/verify)
├── Content
│   ├── Posts         ← Moderasi post
│   └── Products      ← Moderasi produk
├── Transactions      ← Semua payment records
├── Withdrawals       ← Approve/reject/process penarikan kreator
├── Credit Topups     ← Approve/reject topup QRIS manual
└── Settings          ← Platform fee, min withdrawal, upload QRIS platform
```

**Analytics Dashboard:**
- Total GMV (Gross Merchandise Value)
- Revenue platform (fee collected)
- Grafik: GMV per hari, user baru per hari, kreator baru per hari
- Top kreator by earning

---

## 6. Privasi & Keamanan

### 6.1 PII (Personally Identifiable Information)
- Semua tampilan publik hanya menggunakan **username** (nickname)
- Email tidak pernah terekspos di API response manapun
- Admin panel: tampilkan username + email termasking (`us**@example.com`)
- JWT hanya berisi `user_id` + `role` — tidak ada PII
- Log: hanya catat `user_id` + action, tidak ada email/nama/detail payment

### 6.2 Perlindungan Konten Berbayar
- Media paid disimpan di **private bucket MinIO** — tidak bisa diakses langsung
- Pre-signed URL: expiry 15 menit, generated on-demand oleh backend
- Video: no `download` attribute, stream via pre-signed URL
- Watermark dinamis: overlay transparan berisi `username` + `user_id` pada semua paid content
- Cegah klik kanan (right-click) pada gambar/video berbayar
- `user-select: none` pada teks konten berbayar

> **Catatan:** Pencegahan penuh screenshot/screen record tidak mungkin di level browser. Watermark adalah mitigasi terbaik — konten traceable jika bocor.

### 6.3 Keamanan Pembayaran
- Webhook Xendit: verifikasi header `x-callback-token`
- Webhook PayPal: verifikasi signature
- Fulfillment (unlock konten): hanya dilakukan oleh webhook handler, **tidak pernah dari frontend**
- Semua transaksi finansial menggunakan DB transaction (atomic)

---

## 7. Teknis

### 7.1 Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Go + Gin framework |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Storage | MinIO (self-hosted, S3-compatible) |
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| Payment | Xendit (QRIS) + PayPal Orders API v2 |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |

### 7.2 Struktur Repo

```
YourPage/          ← Monorepo
├── be/            ← Go backend
├── fe/            ← Next.js frontend
├── .github/
│   └── workflows/ ← CI/CD pipelines
└── docker-compose.yml
```

### 7.3 Design System

```
Primary:    #2563EB (Blue-600)    — CTA, tombol utama, link
Secondary:  #FACC15 (Yellow-400) — Highlight, badge, aksen
Background: #FFFFFF               — Latar halaman
Surface:    #F8FAFC               — Card, panel
```

---

## 8. Model Bisnis

| Sumber Revenue | Detail |
|---------------|--------|
| Platform Fee | 10% dari setiap transaksi (post, produk, donasi) |
| Credit Spread | Potensi: selisih value credit vs biaya gateway |

**Perpajakan & Kebijakan Sengketa:**
- Harga yang diatur oleh kreator sudah dianggap **termasuk PPN (inclusive)**. Untuk MVP, urusan PPh dan pelaporan pajak pribadi menjadi tanggung jawab masing-masing kreator.
- Platform tidak menyediakan fitur pembatalan/refund otomatis. Jika terjadi sengketa (*dispute*) atau pembeli melakukan *chargeback* dari PayPal/Bank, platform berhak memotong saldo kreator terkait atau menangguhkan akun.

**Contoh kalkulasi:**
- Supporter beli post Rp 50.000
- Platform fee: Rp 5.000 (10%)
- Kreator terima: Rp 45.000

---

## 9. Non-Functional Requirements

| Kategori | Target |
|----------|--------|
| Performa | API response < 300ms (p95) |
| Availability | 99.5% uptime |
| Mobile | Creator page fully responsive, mobile-first |
| File upload | Max 500MB per file (video, gambar, dokumen, audio) |
| Storage Quota | Limit total storage **5GB per kreator** (MVP batas wajar) sebelum diblokir unggahan baru |
| Security | OWASP Top 10 compliant |
| Scalability | Horizontal scaling via Docker |
| Pagination | Menggunakan *cursor-based pagination* untuk bagian profil kreator dan halaman `/feed` |
| Rate Limiting | Diterapkan pada endpoint publik (terutama API Post/Produk) untuk mitigasi eksploitasi dan mass *scraping* |

---

## 10. Keputusan Produk (Final)

| Pertanyaan | Keputusan |
|-----------|-----------|
| Platform fee | **10%** dari semua transaksi |
| Donasi kena fee? | **Ya**, 10% |
| Minimum withdrawal | **Rp 100.000** |
| Verifikasi email | **Opsional** (tidak wajib fase 1) |
| Early access/pre-order | **Tidak ada** di fase 1 |
| Max file upload | **500MB** per file |
| Nama brand | **YourPage** ✓ |

---

## 11. Out of Scope (Fase 1)

- Live streaming
- Subscription / membership tier bulanan
- iOS/Android native app
- Multi-bahasa (hanya Bahasa Indonesia)
- Video DRM Widevine (direncanakan fase 2)
- Marketplace discovery (browse semua kreator)
- Affiliate/referral system

---

## 12. Roadmap

### Fase 1 (MVP)
Auth (Email), Post (free & paid), Produk Digital, Donasi, QRIS + PayPal, Credit System, Follow + Feed, Notifikasi & Email Receipt, KYC Withdrawal, Pelaporan/Moderasi, 3 Dashboard, Admin Panel, CI/CD

### Fase 2
- Video DRM (Widevine)
- Subscription/membership tier
- Discovery page (browse kreator)
- Mobile app (React Native)
- Email notifikasi

### Fase 3
- Live streaming
- Affiliate program
- Analytics kreator lanjutan
- Multi-currency

---

*Dokumen ini adalah acuan implementasi. Perubahan harus didiskusikan dan disetujui sebelum implementasi.*
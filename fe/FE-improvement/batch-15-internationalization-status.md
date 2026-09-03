# Batch 15: Internationalization (i18n) Implementation Roadmap & Status

> Pelacakan komprehensif implementasi multi-bahasa (Bahasa Indonesia `id` & English `en`) untuk seluruh halaman di YourPage Frontend.

**Tanggal Diperbarui:** 3 September 2026  
**Status Keseluruhan:** ✅ Selesai (80 / 80 Halaman Selesai — 100%)  
**Kamus Translasi:** [`fe/lib/internationalization/`](file:///Users/doang/project/YourPage/fe/lib/internationalization/) (`types.ts`, `id/index.ts`, `en/index.ts`)

---

## 📊 Ringkasan Status

| Kategori Halaman | Total Halaman | Selesai (✅) | Belum (⏳) | Prioritas |
|---|:---:|:---:|:---:|:---:|
| **Public & Landing** | 10 | 10 | 0 | P0 |
| **Auth & Onboarding** | 7 | 7 | 0 | P0 |
| **Kreator & Storefront Publik** | 4 | 4 | 0 | P0 |
| **Feed, Notifikasi & Discovery** | 4 | 4 | 0 | P1 |
| **Supporter Hub & Wallet** | 14 | 14 | 0 | P1 |
| **Creator Dashboard & Studio** | 19 | 19 | 0 | P1 |
| **Live OBS Overlays** | 4 | 4 | 0 | P2 |
| **Admin Panel** | 18 | 18 | 0 | P3 (Internal) |
| **TOTAL** | **80** | **80** | **0** | — |

---

## 1. Public, Landing, & Marketing Pages

Halaman publik yang diakses calon pengguna pertama kali.

- [x] `fe/app/page.tsx` — **Landing Page Utama** (Hero, Features, Cara Kerja, Pricing, Testimonial, FAQ, CTA, Footer)
- [x] `fe/app/cara-kerja/page.tsx` — **Panduan Cara Kerja** (Langkah Kreator, Supporter, Fee Structure, FAQ)
- [x] `fe/app/pricing/page.tsx` — **Halaman Biaya & Paket** (Tier Free, Pro, Business, fitur & kalkulator komisi)
- [x] `fe/app/explore/page.tsx` — **Eksplorasi Kreator & Konten** (Kategori, search bar, kartu kreator, filter)
- [x] `fe/app/contact/page.tsx` — **Hubungi Kami / Support** (Form pesan, email bantuan, FAQ singkat)
- [x] `fe/app/terms/page.tsx` — **Syarat & Ketentuan** (Ketentuan layanan platform, hukum, aturan konten)
- [x] `fe/app/privacy/page.tsx` — **Kebijakan Privasi** (Data privasi, cookies, perlindungan data pribadi)
- [x] `fe/app/status/page.tsx` — **Status Layanan / Uptime** (Indikator API, gateway pembayaran, database)
- [x] `fe/app/offline/page.tsx` — **Offline Fallback PWA** (Pemberitahuan koneksi terputus & tombol coba lagi)
- [x] `fe/app/welcome/page.tsx` — **Welcome / Onboarding Guide** (Sambutan setelah registrasi akun)

---

## 2. Auth & Account Access Pages

Halaman otentikasi dan alur pemulihan akun.

- [x] `fe/app/login/page.tsx` — **Masuk Akun** (Form email/password, switch role, link forgot password, QR login)
- [x] `fe/app/register/page.tsx` — **Daftar Akun Baru** (Pilihan peran Kreator/Supporter, referral code, terms agreement)
- [x] `fe/app/forgot-password/page.tsx` — **Lupa Password** (Form kirim link reset email, konfirmasi terkirim)
- [x] `fe/app/reset-password/page.tsx` — **Setel Ulang Password** (Input password baru & konfirmasi)
- [x] `fe/app/verify-email/page.tsx` — **Verifikasi Email** (Status verifikasi token & tombol login)
- [x] `fe/app/qr-confirm/page.tsx` — **Konfirmasi Login QR** (Validasi otentikasi login perangkat lain)
- [x] `fe/app/suspended/page.tsx` — **Akun Ditangguhkan** (Penjelasan penangguhan & kontak bantuan)

---

## 3. Creator Public Storefront & Content Pages

Halaman publik etalase karya kreator dan konsumsi konten.

- [x] `fe/app/c/[slug]/page.tsx` — **Halaman Publik Kreator** (Banner, avatar, bio, tabs post & produk, donasi FAB, membership tier, top supporters)
- [x] `fe/app/posts/[id]/page.tsx` — **Detail Postingan** (Locked/unlocked view, media player, teks artikel, kolom komentar)
- [x] `fe/app/products/[id]/page.tsx` — **Detail Produk Digital** (Thumbnail, deskripsi, harga credit, download file/link/key, tombol beli)
- [x] `fe/app/profile/page.tsx` — **Redirect Profil User** (Routing otomatis profil user login)

---

## 4. Feed, Notifikasi, Chat & Komunikasi

Fitur interaksi harian antara supporter dan kreator.

- [x] `fe/app/chat/page.tsx` & `fe/app/chat/chat-content.tsx` — **Modul Chat Langsung** (List percakapan, kirim pesan berbayar, time formatting)
- [x] `fe/app/feed/page.tsx` — **Timeline / Feed Kreator yang Di-follow** (Post terbaru, interaksi like/komentar)
- [x] `fe/app/notifications/page.tsx` — **Pemberitahuan Akun** (Donasi masuk, pembelian produk, follow baru, sistem alert)
- [x] `fe/app/upgrade/page.tsx` — **Upgrade Paket Kreator** (Pilihan upgrade ke Pro atau Business)

---

## 5. Supporter Hub & Wallet Pages (`/s/*` & `/library/*`)

Portal dashboard supporter untuk mengelola koleksi, transaksi, dan saldo credit.

- [x] `fe/app/s/page.tsx` — **Supporter Home / Dashboard**
- [x] `fe/app/s/wallet/page.tsx` — **Dompet Supporter** (Cek saldo, riwayat penggunaan credit)
- [x] `fe/app/s/transactions/page.tsx` — **Riwayat Transaksi** (List transaksi pembelian dan saweran)
- [x] `fe/app/s/transactions/[id]/page.tsx` — **Detail Invoice Transaksi** (Bukti pembayaran digital)
- [x] `fe/app/s/posts/page.tsx` — **Koleksi Postingan Dibeli** (Akses konten eksklusif)
- [x] `fe/app/s/products/page.tsx` — **Koleksi Produk Digital Dibeli** (File download & license keys)
- [x] `fe/app/s/donations/page.tsx` — **Riwayat Donasi Diberikan** (Daftar kreator yang didukung)
- [x] `fe/app/s/settings/page.tsx` — **Pengaturan Akun Supporter** (Profil, ganti password, preferensi)
- [x] `fe/app/s/blocked/page.tsx` — **Daftar Kreator/User Diblokir**
- [x] `fe/app/library/posts/page.tsx` — **Library Postingan**
- [x] `fe/app/library/products/page.tsx` — **Library Produk Digital**
- [x] `fe/app/donations/sent/page.tsx` — **Daftar Donasi Terkirim**
- [x] `fe/app/wallet/page.tsx` — **Dompet Utama**
- [x] `fe/app/wallet/topup/page.tsx` — **Top-up Saldo Credit** (Pilihan nominal, QRIS checkout, upload bukti transfer)

---

## 6. Creator Studio & Dashboard (`/dashboard/*`)

Pusat monetisasi dan manajemen karya bagi kreator.

- [x] `fe/app/dashboard/page.tsx` — **Ringkasan Studio / Dashboard Kreator** (Statistik penghasilan, shortcut posting & produk)
- [x] `fe/app/dashboard/analytics/page.tsx` — **Analitik & Metrik Pertumbuhan** (Grafik pengunjung, konversi penjualan, demografi)
- [x] `fe/app/dashboard/posts/page.tsx` — **Manajemen Postingan** (List draft & published, aksi edit/hapus)
- [x] `fe/app/dashboard/posts/[id]/page.tsx` — **Editor Postingan** (Form judul, konten rich text/markdown, upload media, set harga)
- [x] `fe/app/dashboard/products/page.tsx` — **Manajemen Produk Digital** (Katalog barang, status stok, harga)
- [x] `fe/app/dashboard/products/[id]/page.tsx` — **Editor Produk Digital** (Upload aset/e-book/template/preset, deskripsi, harga)
- [x] `fe/app/dashboard/profile/page.tsx` — **Pengaturan Halaman Publik** (Ubah nama, bio, avatar, banner, warna tema kustom)
- [x] `fe/app/dashboard/donations/page.tsx` — **Daftar Donasi Masuk** (Riwayat supporter, nominal, pesan apresiasi)
- [x] `fe/app/dashboard/donation-settings/page.tsx` — **Pengaturan Donasi & Saweran** (Target goal, preset nominal, sound alert)
- [x] `fe/app/dashboard/chat-settings/page.tsx` — **Pengaturan Chat Berbayar** (Aktifkan DM, tentukan tarif Credit per pesan)
- [x] `fe/app/dashboard/membership/page.tsx` — **Pengaturan Tier Langganan** (Buat paket membership bulanan & perks eksklusif)
- [x] `fe/app/dashboard/sales/page.tsx` — **Laporan Penjualan Produk** (Order ID, pembeli, komisi bersih)
- [x] `fe/app/dashboard/withdrawals/page.tsx` — **Penarikan Dana / Payout** (Form penarikan ke rekening bank, status transfer)
- [x] `fe/app/dashboard/subscription/page.tsx` — **Paket Berlangganan Kreator** (Status paket Pro/Business, perpanjangan)
- [x] `fe/app/dashboard/kyc/page.tsx` — **Verifikasi Identitas (KYC)** (Upload KTP/identitas, verifikasi penarikan bank)
- [x] `fe/app/dashboard/tax/page.tsx` — **Informasi Pajak & NPWP** (Dokumen perpajakan kreator)
- [x] `fe/app/dashboard/referral/page.tsx` — **Program Referral Kreator** (Link afiliasi, komisi ajak kreator lain)
- [x] `fe/app/dashboard/feed/page.tsx` — **Feed Komunitas Kreator**
- [x] `fe/app/dashboard/overlay/page.tsx` — **Konfigurasi OBS Streaming Overlay** (URL widget, preview overlay)

---

## 7. Live Streaming Overlays (`/overlay/*`)

Widget browser source transparan untuk OBS / Streamlabs.

- [x] `fe/app/overlay/page.tsx` — **Overlay Alert Donasi Utama** (Pop-up alert suara & animasi)
- [x] `fe/app/overlay/goal/page.tsx` — **Widget Target Donasi (Goal Bar)** (Progress bar live)
- [x] `fe/app/overlay/leaderboard/page.tsx` — **Widget Peringkat Top Supporter**
- [x] `fe/app/overlay/media-share/page.tsx` — **Widget Media Share / Video Suara**

---

## 8. Backoffice / Admin Panel (`/admin/*`)

Panel internal administrator untuk moderasi dan audit transaksi.

- [x] `fe/app/admin/page.tsx` — **Admin Dashboard Overview**
- [x] `fe/app/admin/users/page.tsx` — **Manajemen Pengguna**
- [x] `fe/app/admin/users/[id]/page.tsx` — **Detail Profil Pengguna**
- [x] `fe/app/admin/topups/page.tsx` — **Audit & Approval Top-up QRIS**
- [x] `fe/app/admin/withdrawals/page.tsx` — **Persetujuan Penarikan Dana Bank**
- [x] `fe/app/admin/payments/page.tsx` — **Audit Pembayaran Platform**
- [x] `fe/app/admin/payment-audit/page.tsx` — **Rekonsiliasi Keuangan Gateway**
- [x] `fe/app/admin/kyc/page.tsx` — **Verifikasi Dokumen KYC**
- [x] `fe/app/admin/reports/page.tsx` — **Moderasi Laporan Konten/User**
- [x] `fe/app/admin/posts/page.tsx` — **Moderasi Konten Postingan**
- [x] `fe/app/admin/products/page.tsx` — **Moderasi Produk Digital**
- [x] `fe/app/admin/donations/page.tsx` — **Log Seluruh Donasi**
- [x] `fe/app/admin/profit/page.tsx` — **Laporan Bagi Hasil Platform**
- [x] `fe/app/admin/promo/page.tsx` — **Manajemen Kupon & Kode Promo**
- [x] `fe/app/admin/announcements/page.tsx` — **Pengumuman Sistem Platform**
- [x] `fe/app/admin/settings/page.tsx` — **Pengaturan Global Platform**
- [x] `fe/app/admin/profile/page.tsx` — **Profil Admin**

---

## 🛠️ Panduan Standar Implementasi i18n untuk Setiap Halaman

Saat mengimplementasikan multi-bahasa ke halaman baru, ikuti konvensi berikut:

1. **Definisikan Skema di Types:**
   Tambahkan interface baru ke [`fe/lib/internationalization/types.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/types.ts) dalam `TranslationDictionary`.

2. **Tambahkan Kamus Terjemahan:**
   - Bahasa Indonesia: [`fe/lib/internationalization/id/index.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts)
   - English: [`fe/lib/internationalization/en/index.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/en/index.ts)

3. **Gunakan Hook di Komponen Halaman:**
   ```tsx
   "use client";
   import { useTranslation } from "@/lib/internationalization";

   export default function ExamplePage() {
     const { t, locale, interpolate } = useTranslation();

     return (
       <div>
         <h1>{t.exampleSection.title}</h1>
         <p>{interpolate(t.exampleSection.greeting, { name: user.name })}</p>
       </div>
     );
   }
   ```

4. **Format Tanggal dan Jam Dinamis:**
   Ganti string lokal hardcoded `"id-ID"` dengan:
   ```tsx
   new Date(item.created_at).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { ... })
   ```

5. **Verifikasi Quality Gates:**
   - `npm run type-check` (harus exit code 0)
   - `npx eslint . --quiet` (harus exit code 0)
   - `npm run build` (harus berhasil mengompilasi semua 80 rute)

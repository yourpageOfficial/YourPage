# Batch 16: UI Engineering & Accessibility Audit (Orang UI Web)

> Evaluasi mendalam arsitektur antarmuka, kepatuhan WCAG 2.1 AA, eliminasi artifak "AI aesthetic", dan modularitas komponen berbasis standar Orang UI Web.

**Tanggal:** 2 September 2026  
**Status:** ⏳ Plan / In Progress  
**Prioritas:** HIGH — Hasil Audit `orang-ui-web`  
**Referensi Utama:** [`review/fe-ui-engineering-review.md`](file:///Users/doang/project/YourPage/review/fe-ui-engineering-review.md)  
**Skor Evaluasi Frontend Saat Ini:** **B+ (84/100)**

---

## 16.1 P0 — Critical Accessibility & Memory Fixes

### 1. Dialog Focus Management & Keyboard Trap
- [ ] Refactor [`fe/components/ui/confirm-dialog.tsx`](file:///Users/doang/project/YourPage/fe/components/ui/confirm-dialog.tsx):
  - Tambahkan focus trap (fokus tidak boleh tembus ke elemen background saat modal terbuka).
  - Tambahkan listener tombol `Escape` untuk menutup dialog secara instan.
  - Tambahkan pengembalian fokus (return focus) ke elemen pemicu saat dialog ditutup.
  - Hubungkan `aria-labelledby` ke elemen judul dialog dan `aria-describedby` ke deskripsi/pesan dialog.
- [ ] Terapkan hal yang sama pada drawer/modal donasi di [`fe/app/c/[slug]/page.tsx`](file:///Users/doang/project/YourPage/fe/app/c/%5Bslug%5D/page.tsx).

### 2. Form Input Labeling (`htmlFor` / `id` Association)
- [ ] [`fe/app/dashboard/profile/page.tsx`](file:///Users/doang/project/YourPage/fe/app/dashboard/profile/page.tsx):
  - Tambahkan `htmlFor="profile-display-name"` dan `id="profile-display-name"` pada input Display Name.
  - Tambahkan `htmlFor="profile-bio"` dan `id="profile-bio"` pada textarea Bio.
  - Tambahkan `htmlFor="profile-username"` dan `id="profile-username"` pada input Username.
- [ ] [`fe/app/login/page.tsx`](file:///Users/doang/project/YourPage/fe/app/login/page.tsx):
  - Tambahkan `htmlFor="otp-code"` dan `id="otp-code"` pada field kode verifikasi 2FA OTP.

### 3. Pembersihan Memory Leak `URL.createObjectURL`
- [ ] [`fe/components/ui/file-upload.tsx`](file:///Users/doang/project/YourPage/fe/components/ui/file-upload.tsx):
  - Jalankan `URL.revokeObjectURL(url)` saat file dihapus atau saat komponen di-unmount.
- [ ] [`fe/app/dashboard/profile/page.tsx`](file:///Users/doang/project/YourPage/fe/app/dashboard/profile/page.tsx):
  - Revoke object URL avatar preview lama saat user memilih gambar baru atau meninggalkan halaman.

---

## 16.2 P1 — Monolithic Component Decomposition (>200 Lines)

Standar `orang-ui-web` menetapkan batas merah 200 baris per file komponen. Halaman-halaman berikut menggabungkan data fetching, mutasi, validasi, dan UI rendering dalam satu file monolitik.

### 1. Halaman Kreator Publik (`fe/app/c/[slug]/page.tsx` — 452 baris)
- [ ] Pecah menjadi struktur modular:
  - `components/creator-profile-card.tsx` — Header avatar, banner, bio, link sosmed, tombol follow/unfollow.
  - `components/donation-goal-card.tsx` — Target bar progres donasi saat ini vs target nominal.
  - `components/top-supporters-card.tsx` — Kartu ranking donatur tertinggi.
  - `components/membership-tiers.tsx` — Grid tier langganan dan aksi subscribe.
  - `components/creator-content-tabs.tsx` — Tabs switcher postingan dan etalase produk.
  - `components/donation-modal.tsx` — Modal donasi mandiri dengan chip preset dan validasi saldo credit.

### 2. Halaman Kelola Postingan Kreator (`fe/app/dashboard/posts/page.tsx` — 256 baris)
- [ ] Pisahkan form pembuatan post ke `components/post-create-form.tsx`.
- [ ] Pindahkan komponen `PostItem` ke `components/post-dashboard-item.tsx`.
- [ ] Bungkus kartu post dengan `<Link href="/dashboard/posts/[id]">` semantik daripada `onClick={() => router.push(...)}`.

### 3. Halaman Chat & Pesan (`fe/app/chat/chat-content.tsx` — 285 baris)
- [ ] Pisahkan panel percakapan ke `components/chat-sidebar.tsx`.
- [ ] Pisahkan thread pesan ke `components/chat-thread.tsx`.
- [ ] Pisahkan formulir input kirim pesan ke `components/chat-input-bar.tsx`.

### 4. Halaman Top-up Saldo (`fe/app/wallet/topup/page.tsx` — 342 baris)
- [ ] Pisahkan step 1 (pilihan metode QRIS/Stripe & nominal preset) ke `components/topup-method-selector.tsx`.
- [ ] Pisahkan step 2 (tampilan QRIS / upload bukti transfer) ke `components/topup-qris-view.tsx`.
- [ ] Pisahkan step 3 (polling status & verifikasi) ke `components/topup-status-poller.tsx`.

### 5. Aksesibilitas Elemen Interaktif Card & Button
- [ ] [`fe/components/ui/card.tsx`](file:///Users/doang/project/YourPage/fe/components/ui/card.tsx):
  - Untuk `clickable`, tambahkan listener keyboard:
    ```tsx
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        (props as any).onClick?.(e);
      }
    }}
    ```
- [ ] [`fe/components/ui/file-upload.tsx`](file:///Users/doang/project/YourPage/fe/components/ui/file-upload.tsx):
  - Ubah dropzone `<div>` menjadi elemen yang dapat difokuskan keyboard: `role="button" tabIndex={0}` dengan handler `onKeyDown`.
- [ ] Tambahkan `aria-label` yang jelas pada seluruh icon-only button:
  - Tombol Like, Komentar, Share, dan Send di [`fe/components/post-card.tsx`](file:///Users/doang/project/YourPage/fe/components/post-card.tsx).
  - Tombol Upload Asset dan Hapus di [`fe/app/dashboard/products/page.tsx`](file:///Users/doang/project/YourPage/fe/app/dashboard/products/page.tsx).
  - Tombol Remove file di [`fe/components/ui/file-upload.tsx`](file:///Users/doang/project/YourPage/fe/components/ui/file-upload.tsx).

---

## 16.3 P2 — Design System & "AI Aesthetic" Refinements

### 1. Hierarki Sudut Border Radius (Mengeliminasi Overuse `rounded-2xl`)
- [ ] Masalah: Saat ini `rounded-2xl` (20px) digunakan seragam pada tombol, badge kecil, input, kartu, dan modal.
- [ ] Standardisasi hierarki sudut di seluruh antarmuka:
  - **Badges / Chips / Pills:** `rounded-full` atau `rounded-md` (6px)
  - **Inputs & Standard Buttons:** `rounded-lg` (8px) / `rounded-xl` (12px)
  - **Cards & Surfaces:** `rounded-xl` (16px)
  - **Modals, Drawers & Hero Sections:** `rounded-2xl` (20px) / `rounded-3xl` (24px)

### 2. Penyesuaian Kontras Warna Teks Pink (WCAG AA 4.5:1)
- [ ] Masalah: Warna primer `#EC4899` memiliki rasio kontras **~3.57:1** terhadap latar putih `#FFFFFF`, yang melanggar batas WCAG AA (4.5:1) untuk teks biasa.
- [ ] Solusi:
  - Gunakan `text-primary-700` (`#BE185D` — rasio **6.1:1**) atau `text-primary-800` (`#9D174D` — rasio **7.8:1**) untuk seluruh tautan teks biasa dan label penting di atas latar terang.
  - Pertahankan `bg-primary` (`#EC4899`) untuk tombol solid dengan teks putih tebal (`font-bold text-white`), yang memenuhi batas 3:1 untuk large/bold text.

### 3. Pembersihan Token Warna Warisan (Legacy Blue)
- [ ] [`fe/components/post-card.tsx:120`](file:///Users/doang/project/YourPage/fe/components/post-card.tsx#L120): Ganti `dark:from-blue-900/20 dark:to-blue-800/10 dark:border-blue-800/30` menjadi palet konsisten `dark:from-navy-800 dark:border-primary-900/30`.

### 4. Dynamic Viewport Height di Mobile Chat
- [ ] [`fe/app/chat/chat-content.tsx:109`](file:///Users/doang/project/YourPage/fe/app/chat/chat-content.tsx#L109):
  - Ubah `h-[calc(100vh-...)]` menjadi `h-[calc(100dvh-...)]` agar layout tidak bergeser atau memantul saat keyboard virtual ponsel muncul dan hilang.

---

## 16.4 P3 — Mobile Touch Targets & Performance Optimization

### 1. Standar Target Sentuh Mobile (Minimal 44×44px)
- [ ] Perluas padding klik pada tombol aksi kecil berukuran `h-8 w-8` (32px):
  - Tombol aksi di baris produk [`dashboard/products/page.tsx`](file:///Users/doang/project/YourPage/fe/app/dashboard/products/page.tsx).
  - Tombol hapus file di [`file-upload.tsx`](file:///Users/doang/project/YourPage/fe/components/ui/file-upload.tsx).
  - Menggunakan pseudo-element sentuh (`after:absolute after:-inset-2`) atau set minimal `min-h-[44px] min-w-[44px]`.

### 2. Virtualisasi / Batas Feed Postingan Panjang
- [ ] [`fe/app/feed/page.tsx`](file:///Users/doang/project/YourPage/fe/app/feed/page.tsx) & [`fe/app/c/[slug]/page.tsx`](file:///Users/doang/project/YourPage/fe/app/c/%5Bslug%5D/page.tsx):
  - Terapkan infinite scrolling (`useInfiniteQuery`) dengan paginasi 10-15 post per batch agar performa rendering di perangkat mobile tetap berada di 60 FPS.

---

## 16.5 Verification Checklist

Setelah setiap perbaikan diterapkan:
- [ ] `npm run type-check` (0 error TypeScript)
- [ ] `npx eslint . --quiet` (0 error linting)
- [ ] `npm run build` (semua 80 rute terkompilasi sukses dengan Turbopack)
- [ ] Verifikasi navigasi Tab keyboard pada komponen yang diubah
- [ ] Verifikasi pembaca layar (VoiceOver / NVDA) pada modal dan form

`# Batch 11: Audit Fixes — FE Gaps dari Batch 1-10
> Komponen dibangun tapi tidak dipakai. Fix integrasi + quality issues.

**Status**: ✅ Selesai (11 Apr 2026)
**Priority**: HIGH — Hasil audit code-reviewer
**Dependency**: FE Batch 1-10 selesai

---

## 11.1 CRITICAL — Harus Fix

### Creator Page — Component Integration (`/fe/app/c/[slug]/page.tsx`)
- [ ] Ganti manual tab `<button onClick>` → `Tabs` component Radix-based
  - Keyboard navigation (arrow keys)
  - `aria-selected` states otomatis
  - Animated underline indicator
- [ ] Ganti raw `<img>` → `Avatar` component untuk profile picture
- [ ] Tambah `PageTransition` wrapper
- [ ] Tambah entrance animation pada profile card (slide-up + fade dari `motion-variants`)

### Admin — ConfirmDialog pada Destructive Actions
- [ ] Tambah `ConfirmDialog` di SEMUA admin destructive actions:
  - `/admin/users/` — ban user
  - `/admin/posts/` — delete post
  - `/admin/products/` — delete product
  - `/admin/topups/` — reject topup
  - `/admin/withdrawals/` — reject withdrawal
  - `/admin/kyc/` — reject KYC
  - `/admin/reports/` — dismiss report
- [ ] ConfirmDialog harus punya loading state saat confirm

### Admin — Breadcrumb Navigation
- [ ] Tambah `Breadcrumb` component di SEMUA admin pages:
  - Pattern: `Admin > Users > Detail` atau `Admin > Posts`
  - Auto-generate dari path
  - Responsive: collapse di mobile

### Share Dropdown — Fix DOM Manipulation
- [ ] `/fe/app/posts/[id]/page.tsx` — ganti `document.getElementById` + class toggle → React `useState` untuk share dropdown open/close

---

## 11.2 IMPORTANT — Sebaiknya Fix

### Tooltip → Radix-based
- [ ] Refactor `/fe/components/ui/tooltip.tsx`:
  - Ganti custom hover implementation → `@radix-ui/react-tooltip`
  - Auto-positioning (flip on overflow)
  - 200ms delay
  - Arrow pointer
  - Escape to dismiss

### AnimatePresence di Root Layout
- [ ] Tambah `AnimatePresence` di `/fe/app/layout.tsx`
  - Wrap children untuk exit animations
  - `mode="wait"` untuk page transitions
  - Test: navigate antar halaman → fade out + fade in smooth

### Chat — Missing Features
- [ ] Ganti `Input` → auto-resize `Textarea` (max 5 lines)
- [ ] Support Shift+Enter untuk new line
- [ ] Ganti raw `<div>` avatar → `Avatar` component
- [ ] Read receipts: pakai conversation-level `last_read_at` dari BE (kalau BE sudah implement)

### Sitemap — Dynamic Routes
- [ ] Update `/fe/app/sitemap.ts`:
  - Fetch creators dari API → generate `/c/{slug}` entries
  - Fetch public posts → generate `/posts/{id}` entries
  - Fetch public products → generate `/products/{id}` entries
  - Set `changeFrequency` dan `priority` per type

### ImageFallback Integration
- [ ] Ganti raw `<img>` → `ImageFallback` di:
  - Creator page banner/cover
  - Post detail media
  - Product detail thumbnails
  - Chat image messages
  - File upload previews

### Creator Page — Empty States
- [ ] Upgrade empty states dari plain text → `EmptyState` component:
  - "Belum ada post" → icon + subtitle + "Follow untuk update" CTA
  - "Belum ada produk" → icon + subtitle
  - "Belum ada supporter" → icon + encouraging text

### Typography Presets
- [ ] Tambah di `tailwind.config.ts` extend:
  ```
  text-display: 2xl+ font bold
  text-heading: xl font semibold
  text-body: base font normal
  text-caption: sm font text-muted
  ```

### Dashboard — StepIndicator
- [ ] Ganti custom checklist → render actual `StepIndicator` component
  - Steps: Avatar, Bio, First Post, KYC
  - Active/done/pending states
  - Connector lines antar steps

### Dashboard — Count-up Animation
- [ ] Tambah animated count-up di stats cards saat mount
  - Number increment dari 0 → actual value
  - Duration: 1-2 detik
  - Pakai `useEffect` + `requestAnimationFrame`

### Landing Page — Server Component
- [ ] Pindahkan landing page ke server component (hapus `"use client"`)
  - Atau: split ke layout + client components
  - Agar `generateMetadata()` bisa per-page
  - Buat `metadata` export di `/fe/app/page.tsx`

### LoadMore → Deprecate
- [ ] Tambah comment deprecated di `load-more.tsx`
  - Atau: refactor jadi thin wrapper ke `InfiniteScroll`
  - Audit: pastikan tidak ada halaman yang masih pakai `LoadMore`

---

## 11.3 Admin — Remaining Polish

### Bulk Select Expansion
- [ ] Tambah `useBulkSelect` di admin pages yang belum:
  - `/admin/users/` — bulk ban
  - `/admin/posts/` — bulk delete
  - `/admin/products/` — bulk delete
  - `/admin/payments/` — bulk actions
  - `/admin/kyc/` — bulk approve/reject
  - `/admin/reports/` — bulk resolve

### Admin Revenue Chart
- [ ] Dashboard admin: tambah Recharts line/bar chart
  - Period selector: 7d, 30d, 90d
  - Fetch dari `GET /admin/analytics/chart` (setelah BE implement)

### Lazy Loading Admin Pages
- [ ] Wrap admin pages dengan `dynamic()`:
  ```tsx
  const AdminUsersPage = dynamic(() => import('./users/page'), { loading: () => <TableSkeleton /> })
  ```

---

## Checklist Selesai
- [ ] Creator page: Tabs Radix, Avatar, PageTransition, animations
- [ ] Admin: ConfirmDialog semua destructive actions
- [ ] Admin: Breadcrumb semua pages
- [ ] Share dropdown: React state bukan DOM manipulation
- [ ] Tooltip: Radix-based
- [ ] AnimatePresence: root layout
- [ ] Chat: auto-resize textarea, Avatar, read receipts
- [ ] Sitemap: dynamic routes
- [ ] ImageFallback: integrated di semua image locations
- [ ] Empty states: upgraded dengan icons + CTA
- [ ] Dashboard: StepIndicator + count-up animation
- [ ] `npm run build` PASS
- [ ] `npx tsc --noEmit` PASS

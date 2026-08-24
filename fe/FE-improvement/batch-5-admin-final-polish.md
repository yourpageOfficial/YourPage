# Batch 5: Admin Panel + Final Polish + QA
> Admin harus efisien, lalu final polish dan testing semua halaman

**Status**: ✅ Selesai (11 Apr 2026)
**Dependency**: Batch 1-4 HARUS selesai (semua komponen & patterns sudah established)
**Estimasi Files**: 0 baru, ~20 dimodifikasi

---

## 5.1 Admin Dashboard (`/fe/app/admin/page.tsx`)

### Pending Items
- [ ] Better card design untuk pending reviews
- [ ] Bulk approve/reject buttons
- [ ] Count badges per category (users, posts, withdrawals, KYC)
- [ ] Quick action buttons per item

### Revenue Chart
- [ ] Proper Recharts: line/bar chart
- [ ] Period selector: 7d, 30d, 90d, 1y
- [ ] Tooltip formatted (currency)
- [ ] Responsive chart sizing

### Stats
- [ ] Animated counters (count-up on mount)
- [ ] Trend indicators (↑↓ dengan warna)
- [ ] Hover tooltip dengan detail breakdown

### Quick Links
- [ ] Icon hover animations (subtle scale)
- [ ] Grid layout responsive
- [ ] Badge count pada items yang butuh attention

---

## 5.2 Admin Sub-pages — Consistent Pattern

### Pattern untuk SEMUA admin pages:
- [ ] `Breadcrumb` navigation di setiap halaman
- [ ] AdminList component polish:
  - Search input (debounced, gunakan `useDebounce`)
  - Filter dropdown/tabs
  - Sort by column
  - `Pagination` component (ganti manual)
- [ ] Bulk select actions (gunakan `useBulkSelect`)
- [ ] Detail view: drawer/modal (bukan pindah halaman)
- [ ] Status badges: warna + text + icon (triple encoding — accessibility)
- [ ] `ConfirmDialog` pada SEMUA destructive actions (ban, reject, delete)
- [ ] Toast feedback pada setiap aksi berhasil/gagal
- [ ] `EmptyState` di semua list views
- [ ] `TableSkeleton` loading state

### Users (`/fe/app/admin/users/`)
- [ ] User detail drawer (click row → slide-in panel)
- [ ] Ban confirmation dialog dengan reason input
- [ ] Role badge per user
- [ ] Search by name/email
- [ ] Filter by role, status

### Posts (`/fe/app/admin/posts/`)
- [ ] Content preview modal/drawer
- [ ] Moderation actions: approve, reject, hide
- [ ] Status filter tabs
- [ ] Creator name + avatar display

### Products (`/fe/app/admin/products/`)
- [ ] Product preview drawer
- [ ] File list preview
- [ ] Status management

### Payments (`/fe/app/admin/payments/`)
- [ ] Payment detail expandable row
- [ ] Refund flow dengan confirmation + reason
- [ ] Status badges: pending, completed, refunded, failed
- [ ] Date range filter

### Withdrawals (`/fe/app/admin/withdrawals/`)
- [ ] Approval flow: approve/reject buttons + notes textarea
- [ ] Bank info display
- [ ] Amount + fee breakdown
- [ ] Status timeline per withdrawal

### Top-ups (`/fe/app/admin/topups/`)
- [ ] Proof image viewer (click to enlarge — lightbox)
- [ ] Approve/reject buttons
- [ ] Amount verification display
- [ ] Payment method badge

### KYC (`/fe/app/admin/kyc/`)
- [ ] Document viewer (image lightbox untuk ID photos)
- [ ] Verification checklist (nama match, foto clear, etc)
- [ ] Approve/reject dengan notes
- [ ] Status timeline

### Settings (`/fe/app/admin/settings/`)
- [ ] Form sections (collapsible cards)
- [ ] Save confirmation toast
- [ ] Unsaved changes warning
- [ ] Loading state pada save button

### Reports (`/fe/app/admin/reports/`)
- [ ] Report detail drawer
- [ ] Resolve flow: action dropdown + notes
- [ ] Reporter + reported user info
- [ ] Status: open, investigating, resolved, dismissed

### Promo (`/fe/app/admin/promo/`)
- [ ] Promo management: create, edit, delete
- [ ] Active/expired status badges
- [ ] Usage stats per promo

### Profit (`/fe/app/admin/profit/`)
- [ ] Revenue charts (Recharts, proper formatting)
- [ ] Period selector
- [ ] Export button (CSV)
- [ ] Breakdown by source

### Sales (`/fe/app/admin/sales/`)
- [ ] Sales analytics charts
- [ ] Top products/posts ranking
- [ ] Date range filter

### Donations (`/fe/app/admin/donations/`)
- [ ] Donation analytics
- [ ] Top donors ranking
- [ ] Chart: donation trend over time

---

## 5.3 Final Polish — Audit Semua Halaman

### Page Transition Audit
- [ ] Pastikan `PageTransition` wrapper applied di SEMUA halaman
- [ ] Consistent animation speed (200ms)
- [ ] No janky transitions

### Form Validation Audit
- [ ] SEMUA forms: visual error feedback (red ring + inline message)
- [ ] SEMUA submit buttons: loading state saat mutation
- [ ] SEMUA required fields: proper validation
- [ ] Error messages: clear, helpful, in Bahasa Indonesia

### List/Table Audit
- [ ] SEMUA list views: empty state dengan ilustrasi + CTA
- [ ] SEMUA list views: loading skeleton
- [ ] SEMUA list views: error state dengan retry

### Action Audit
- [ ] SEMUA destructive actions: `ConfirmDialog`
- [ ] SEMUA actions: toast feedback (success/error)
- [ ] SEMUA mutation buttons: loading state

### Image Audit
- [ ] SEMUA images: descriptive alt text
- [ ] SEMUA images: fallback state (error handling)
- [ ] SEMUA images: lazy load (Next/Image default)
- [ ] SEMUA avatars: gunakan `Avatar` component

### Responsive Audit
Test SEMUA halaman di breakpoints:
- [ ] 320px (small mobile)
- [ ] 375px (standard mobile)
- [ ] 768px (tablet)
- [ ] 1024px (small desktop)
- [ ] 1440px (standard desktop)

### Dark Mode Audit
- [ ] SEMUA komponen baru: dark mode support
- [ ] SEMUA semantic colors: dark variants defined
- [ ] No hard-coded colors (semua via tailwind/CSS vars)
- [ ] Contrast ratios maintained in dark mode

### Accessibility Audit
- [ ] Tab navigation works across all pages
- [ ] Focus-visible ring visible dan consistent
- [ ] Screen reader: semua interactive elements labeled
- [ ] Color contrast: minimum WCAG AA (4.5:1 text, 3:1 large text)
- [ ] No color-only information encoding
- [ ] Heading hierarchy: h1→h2→h3 (no skipping)
- [ ] `aria-current="page"` di semua navigations
- [ ] `aria-live="polite"` di dynamic content areas
- [ ] Skip-to-main link functional

---

## 5.4 Performance Polish

### Lazy Loading
- [ ] `dynamic()` import untuk halaman non-critical:
  - Admin pages
  - Settings pages
  - Analytics pages
- [ ] Lazy load heavy components (charts, editors)

### Image Optimization
- [ ] Semua images: Next/Image dengan `sizes` prop
- [ ] Proper `width`/`height` atau `fill` usage
- [ ] WebP format preference

### Bundle Analysis
- [ ] Run `next build` dan check bundle size
- [ ] Remove unused imports
- [ ] Check for duplicate dependencies
- [ ] Tree-shake unused Radix components

### Font Optimization
- [ ] Preload critical fonts (`next/font`)
- [ ] Font-display: swap
- [ ] Subset fonts jika possible

---

## Verification Plan — Final

### Build & Type Check
```bash
cd fe && npm run build
cd fe && npx tsc --noEmit
```
- [ ] Zero build errors
- [ ] Zero type errors

### Lighthouse Audit (Target Scores)
- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 90+
- [ ] SEO: 90+

### End-to-End Flow Tests
- [ ] Register → Verify → Login → Dashboard
- [ ] Create Post → View Post → Edit → Delete
- [ ] Create Product → View → Purchase flow
- [ ] Top-up → Donate → Check wallet
- [ ] Follow creator → See feed → Like/Comment
- [ ] Chat flow → Send message → Read receipt
- [ ] Withdrawal request → Status tracking
- [ ] Admin: approve/reject flows

### Empty State Tests
- [ ] Baru register (no posts, no products, no donations)
- [ ] Search with no results
- [ ] Empty wallet
- [ ] Empty chat
- [ ] Empty notifications

### Loading State Tests
- [ ] Throttle network (Slow 3G di DevTools)
- [ ] Check semua skeletons appear correctly
- [ ] Check semua loading spinners on buttons
- [ ] No layout shift saat content loads

### Cross-Browser
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Dependency Chain Summary

```
Batch 1 (Foundation)
  ├── Batch 2 (Auth + Public) ← uses components from B1
  ├── Batch 3 (Content Pages) ← uses components from B1, patterns from B2
  └── Batch 4 (Dashboard + Chat) ← uses components from B1, patterns from B2-B3
        └── Batch 5 (Admin + Polish) ← uses everything, audits everything
```

---

## Komponen Inventory — Final Check

| Komponen Baru (Batch 1) | Used In |
|--------------------------|---------|
| `Avatar` | Creator, Chat, Dashboard, Admin, Profile |
| `Breadcrumb` | Admin pages |
| `Pagination` | Dashboard lists, Admin lists, Wallet |
| `Tabs` | Creator, Dashboard posts, Wallet filter |
| `Tooltip` | Creator badges, Dashboard stats |
| `Alert` | Auth errors, Wallet notices |
| `StepIndicator` | Auth, Dashboard setup, Withdrawal |
| `ScrollToTop` | Feed, Explore, Long pages |
| `ImageWithFallback` | Post, Product, Creator, Chat |
| `PasswordStrength` | Register, Reset password |
| `CharacterCount` | Profile bio, Chat input |
| `InfiniteScroll` | Feed, Explore, Chat, Notifications |
| `PageTransition` | ALL pages |

---

## Checklist Selesai Batch 5 (FINAL)
- [ ] Admin dashboard: charts, stats, pending items
- [ ] Admin sub-pages (13 pages): consistent pattern applied
- [ ] Final polish audit: ALL checklists above passed
- [ ] Performance: lazy load, images optimized, bundle clean
- [ ] Build: zero errors
- [ ] Lighthouse: target scores met
- [ ] E2E flows: all tested
- [ ] Cross-browser: all tested
- [ ] **UI/UX Score target: 9+/10** ✅

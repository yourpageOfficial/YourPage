# Batch 1: Design System Foundation + Core Components
> Fondasi yang HARUS selesai sebelum batch lain dimulai

**Status**: ✅ Selesai (11 Apr 2026)
**Dependency**: Tidak ada (batch pertama)
**Estimasi Files**: ~15 baru, ~10 dimodifikasi

---

## 1.1 Upgrade Design Tokens

### `tailwind.config.ts`
- [ ] Tambah semantic color tokens di `extend.colors`:
  - `success`: hijau (light + dark)
  - `error`: merah (light + dark)
  - `warning`: kuning (light + dark)
  - `info`: biru (light + dark)
- [ ] Pindahkan status colors dari `standards.tsx` inline ke tailwind config
- [ ] Tambah animation keyframes:
  - `fade-in`: opacity 0→1
  - `slide-up`: translateY(10px)→0 + opacity
  - `slide-down`: translateY(-10px)→0 + opacity
  - `scale-in`: scale(0.95)→1 + opacity
  - `bounce-subtle`: subtle bounce effect
- [ ] Tambah animation utilities yang reference keyframes di atas
- [ ] Tambah `transition-default` → `200ms ease-in-out`
- [ ] Tambah typography preset via plugin/extend:
  - `text-display`: 2xl+ font bold
  - `text-heading`: xl font semibold
  - `text-body`: base font normal
  - `text-caption`: sm font text-muted

### `globals.css`
- [ ] Tambah CSS custom properties untuk semantic colors (support dark mode)
- [ ] Tambah `@layer utilities` untuk animation classes
- [ ] Tambah focus-visible ring style yang distinct dari hover
- [ ] Tambah skip-to-main link styles
- [ ] Fix color contrast: `text-gray-400` → `text-gray-500` di global defaults

---

## 1.2 Komponen Baru (`/fe/components/ui/`)

### `avatar.tsx`
- [ ] Radix Avatar (sudah installed `@radix-ui/react-avatar`)
- [ ] Fallback: initials dari nama
- [ ] Size variants: `sm` (24px), `md` (32px), `lg` (48px), `xl` (64px)
- [ ] Online indicator (green dot, optional)
- [ ] Proper `alt` text

### `breadcrumb.tsx`
- [ ] Path navigation dengan separator
- [ ] Auto-truncate path panjang (ellipsis di tengah)
- [ ] Responsive: collapse items di mobile, tampil "..."
- [ ] `aria-label="Breadcrumb"` + `aria-current="page"` di item terakhir

### `pagination.tsx`
- [ ] Page numbers + prev/next buttons
- [ ] Responsive: simplified di mobile (prev/next only)
- [ ] Total count display
- [ ] `aria-label` per page button

### `tabs.tsx`
- [ ] Wrapper Radix Tabs (`@radix-ui/react-tabs` sudah installed)
- [ ] Underline style (animated indicator)
- [ ] Badge count support per tab
- [ ] Keyboard navigation (arrow keys)
- [ ] `aria-selected` states

### `tooltip.tsx`
- [ ] Radix Tooltip based
- [ ] Delay 200ms default
- [ ] Arrow pointer
- [ ] Positioning auto (flip jika overflow)

### `alert.tsx`
- [ ] Variants: `info`, `success`, `warning`, `error`
- [ ] Icon per variant
- [ ] Dismissible (X button, optional)
- [ ] `role="alert"` untuk error/warning

### `step-indicator.tsx`
- [ ] Horizontal steps layout
- [ ] States per step: `active`, `done`, `pending`
- [ ] Done = checkmark icon, active = highlighted, pending = muted
- [ ] Connector line antar steps
- [ ] `aria-current="step"` di step aktif

### `scroll-to-top.tsx`
- [ ] Floating button (fixed bottom-right)
- [ ] Muncul setelah scroll 300px (IntersectionObserver atau scroll event)
- [ ] Smooth scroll ke atas
- [ ] Fade-in/out animation
- [ ] `aria-label="Scroll to top"`

### `image-fallback.tsx`
- [ ] Next/Image wrapper
- [ ] Skeleton placeholder saat loading
- [ ] Error fallback (broken image icon + text)
- [ ] Proper `alt` text passthrough

### `password-strength.tsx`
- [ ] Bar indicator: 4 segments
- [ ] States: `weak` (merah), `medium` (kuning), `strong` (hijau)
- [ ] Rules checklist: panjang, huruf besar, angka, simbol
- [ ] `aria-live="polite"` untuk screen reader update

### `character-count.tsx`
- [ ] Counter: "123/500"
- [ ] Warning color di 90%+ (kuning)
- [ ] Error color di 100% (merah)
- [ ] `aria-live="polite"`

### `infinite-scroll.tsx`
- [ ] IntersectionObserver wrapper
- [ ] Auto-load saat sentinel element visible
- [ ] Loading spinner saat fetching
- [ ] "Tidak ada lagi" end state
- [ ] Threshold configurable

### `page-transition.tsx`
- [ ] framer-motion `motion.div` wrapper
- [ ] Default: fade + slide-up, 200ms
- [ ] Configurable variant prop

---

## 1.3 Upgrade Komponen Existing

### `button.tsx`
- [ ] + `loading` prop → spinner icon + disabled state
- [ ] + `iconLeft` / `iconRight` slot (React node)
- [ ] Pastikan semua variant support loading

### `badge.tsx`
- [ ] + color variants: `success`, `error`, `warning`, `info` (pakai semantic tokens)
- [ ] + `dot` prop → small circle indicator sebelum text

### `input.tsx`
- [ ] + `error` prop → red ring border + error message slot
- [ ] + `success` prop → green ring
- [ ] + `iconLeft` / `iconRight` slot

### `textarea.tsx`
- [ ] + Integrasi `CharacterCount` component
- [ ] + `error` prop → red ring + error message
- [ ] + `maxLength` prop trigger character count

### `skeleton.tsx`
- [ ] + `TableSkeleton` — rows + columns
- [ ] + `ProfileSkeleton` — avatar + text lines
- [ ] + `ChartSkeleton` — bar chart placeholder

### `card.tsx`
- [ ] + `hover` variant → subtle shadow/lift on hover
- [ ] + `clickable` variant → cursor-pointer + hover effect + focus ring

### `toast-container.tsx`
- [ ] + action button support (CTA di dalam toast)
- [ ] + persistent variant (tidak auto-dismiss)
- [ ] + `aria-live="polite"` pada container

### `file-upload.tsx`
- [ ] + Image preview thumbnail setelah select
- [ ] + Progress bar saat upload
- [ ] + Error state per file (red badge)

### `confirm-dialog.tsx`
- [ ] + `loading` prop pada confirm button (spinner + disabled)

### `load-more.tsx`
- [ ] Refactor jadi wrapper yang bisa switch ke InfiniteScroll
- [ ] Atau deprecate, redirect usage ke `infinite-scroll.tsx`

---

## 1.4 Accessibility Foundation

### `layout.tsx` (root)
- [ ] Tambah skip-to-main link: `<a href="#main" class="sr-only focus:not-sr-only ...">Skip to main content</a>`
- [ ] Tambah `<main id="main">` wrapper
- [ ] Tambah `aria-live="polite"` pada toast container area
- [ ] Setup `AnimatePresence` dari framer-motion di sini

### `navbar.tsx`
- [ ] Tambah `aria-current="page"` di link aktif
- [ ] Tambah `aria-label` pada semua icon-only buttons (notif, menu, etc)
- [ ] Fix color contrast pada muted text

### `bottom-nav.tsx`
- [ ] Tambah `aria-current="page"` di tab aktif
- [ ] Tambah `aria-label` per icon button
- [ ] `role="navigation"` + `aria-label="Main navigation"`

### `mobile-sidebar.tsx`
- [ ] Tambah `aria-current="page"` di link aktif
- [ ] Focus trap saat sidebar open
- [ ] `role="dialog"` + `aria-modal="true"`

### `dashboard/layout.tsx`
- [ ] Tambah `aria-current="page"` di sidebar navigation
- [ ] Proper landmark roles

---

## 1.5 Motion Variants

### `motion-variants.ts` (`/fe/lib/`)
- [ ] Export preset variants:
  ```
  fadeIn, fadeOut
  slideUp, slideDown, slideLeft, slideRight
  scaleIn, scaleOut
  staggerChildren (parent container)
  staggerItem (child item)
  ```
- [ ] Semua duration default 200ms
- [ ] Ease: `easeOut` default

---

## Checklist Selesai Batch 1
- [ ] Semua komponen baru dibuat dan bisa di-import
- [ ] Semua komponen existing di-upgrade
- [ ] Accessibility foundation terpasang
- [ ] Page transition system ready
- [ ] `npm run build` PASS
- [ ] `npx tsc --noEmit` PASS
- [ ] Dark mode check: semua komponen baru support dark
- [ ] Responsive check: komponen baru rapi di mobile

---

## Key Files Reference
| Utility | Path | Gunakan Untuk |
|---------|------|---------------|
| `cn()` | `/fe/lib/utils.ts` | Class merging di semua komponen baru |
| `useAction()` | `/fe/lib/use-action.ts` | Mutation + auto-toast |
| `toast` store | `/fe/lib/toast.ts` | Notifications |
| Radix Tabs | `@radix-ui/react-tabs` | Tab component |
| Radix Avatar | `@radix-ui/react-avatar` | Avatar component |
| Radix Toast | `@radix-ui/react-toast` | Toast upgrade |
| framer-motion | `framer-motion` | Animations |

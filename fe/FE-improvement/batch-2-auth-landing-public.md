# Batch 2: Auth, Landing, & Public Pages
> Halaman pertama yang dilihat user — harus perfect

**Status**: ✅ Selesai (11 Apr 2026)
**Dependency**: Batch 1 HARUS selesai (butuh design tokens, komponen baru, page transition, accessibility foundation)
**Estimasi Files**: ~3 baru, ~15 dimodifikasi

---

## 2.1 Landing Page (`/fe/app/page.tsx`)

### Animasi & Visual
- [ ] Tambah framer-motion scroll animations (stagger reveal per section)
  - Gunakan `staggerChildren` + `staggerItem` dari `motion-variants.ts`
  - Setiap section fade-in saat masuk viewport (IntersectionObserver / whileInView)
- [ ] Hero section: subtle entrance animation (slide-up + fade)
- [ ] Pricing card: smooth hover scale transition (`scaleIn` variant)
- [ ] Pricing toggle monthly/yearly (jika ada data)
- [ ] Social proof: animated counter (count-up effect on mount)
- [ ] Testimonial carousel (jika data tersedia)

### Responsive
- [ ] Pastikan semua section rapi di mobile (375px)
- [ ] Hero text sizing responsive
- [ ] Pricing cards stack di mobile
- [ ] Feature grid 1-col di mobile, 2-col tablet, 3-col desktop

### Accessibility
- [ ] `aria-label` pada feature icons
- [ ] Proper heading hierarchy: h1 → h2 → h3 (tidak skip)
- [ ] CTA buttons descriptive text (bukan "Click here")
- [ ] Alt text pada semua ilustrasi

### SEO
- [ ] `generateMetadata()` dengan title, description, OG image
- [ ] Proper semantic HTML (section, article, nav)

---

## 2.2 Auth Pages

### Login (`/fe/app/login/page.tsx`)
- [ ] Password visibility toggle (eye/eye-off icon button)
- [ ] Error state: gunakan upgraded `Input` (error prop → red ring + inline message)
- [ ] Button loading state saat submit (gunakan upgraded `Button` loading prop)
- [ ] Page transition animation (`PageTransition` wrapper)
- [ ] `aria-describedby` pada input yang error (link ke error message)
- [ ] Auto-focus pada email input saat mount

### Register (`/fe/app/register/page.tsx`)
- [ ] Tambah `PasswordStrength` component di bawah password input
- [ ] Role selector: animate selection (scale + border highlight)
- [ ] Tambah deskripsi singkat per role (tooltip atau subtitle)
- [ ] Step indicator jika multi-step flow (gunakan `StepIndicator`)
- [ ] Realtime validation feedback:
  - Email format check
  - Password strength live update
  - Username availability (debounced)
- [ ] Button loading state
- [ ] Page transition animation

### Forgot Password (`/fe/app/forgot-password/page.tsx`)
- [ ] Step indicator: `Email` → `Check Inbox` → `Done`
- [ ] Loading state pada submit button
- [ ] Success state: ilustrasi email + "Cek inbox kamu"
- [ ] Error state: inline message
- [ ] Page transition animation

### Reset Password (`/fe/app/reset-password/page.tsx`)
- [ ] Step indicator: `Email` → `Check Inbox` → `New Password`
- [ ] `PasswordStrength` component
- [ ] Password visibility toggle
- [ ] Confirm password match validation (realtime)
- [ ] Success state: ilustrasi + auto-redirect ke login
- [ ] Page transition animation

### Verify Email (`/fe/app/verify-email/page.tsx`)
- [ ] Animasi success state (checkmark animation)
- [ ] Animasi error state (X animation + retry button)
- [ ] Auto-redirect countdown: "Redirect ke dashboard dalam 5 detik..."
- [ ] Manual link jika countdown gagal
- [ ] Page transition animation

---

## 2.3 Public Pages

### Privacy Policy (`/fe/app/privacy/page.tsx`)
- [ ] Typography polish: gunakan prose-like styling
- [ ] TOC sidebar (sticky, scroll-spy highlight)
- [ ] Heading IDs untuk deep linking
- [ ] Smooth scroll ke section saat klik TOC
- [ ] Responsive: TOC collapse ke dropdown di mobile
- [ ] `generateMetadata()` SEO

### Terms of Service (`/fe/app/terms/page.tsx`)
- [ ] Sama seperti Privacy Policy pattern
- [ ] Typography polish + TOC sidebar
- [ ] `generateMetadata()` SEO

### Contact (`/fe/app/contact/page.tsx`)
- [ ] Form validation UX: realtime inline errors
- [ ] Success state: ilustrasi + "Pesan terkirim" message
- [ ] Button loading state saat submit
- [ ] `generateMetadata()` SEO
- [ ] reCAPTCHA atau honeypot (jika belum ada)

### Pricing/Upgrade (`/fe/app/pricing/page.tsx` atau `/fe/app/upgrade/page.tsx`)
- [ ] Pricing comparison redesign
- [ ] Feature comparison table (checkmark/x per tier)
- [ ] Popular tier highlight (border + badge "Popular")
- [ ] CTA per tier dengan loading state
- [ ] `generateMetadata()` SEO

### Cara Kerja (`/fe/app/cara-kerja/page.tsx`)
- [ ] Step illustrations (inline SVG atau icon)
- [ ] Scroll animations per step (stagger reveal)
- [ ] Numbered steps dengan connector line
- [ ] `generateMetadata()` SEO

### Status Page (`/fe/app/status/page.tsx`)
- [ ] Status indicators: hijau (operational), kuning (degraded), merah (down)
- [ ] Gunakan semantic color tokens dari Batch 1
- [ ] Uptime percentage display
- [ ] Incident history timeline
- [ ] `generateMetadata()` SEO

---

## 2.4 SEO Enhancement

### Sitemap (`/fe/app/sitemap.ts`) — FILE BARU
- [ ] Next.js dynamic sitemap
- [ ] Include semua public routes
- [ ] Include dynamic routes (creator pages, posts, products)
- [ ] Set proper `changeFrequency` dan `priority`

### Robots (`/fe/app/robots.ts`) — FILE BARU
- [ ] Next.js robots.txt generator
- [ ] Allow public pages
- [ ] Disallow admin, dashboard, API routes
- [ ] Reference sitemap URL

### OG Images
- [ ] Default OG image untuk semua pages
- [ ] Dynamic OG per halaman (title + description overlay)

---

## Dependency dari Batch 1

Komponen Batch 1 yang DIGUNAKAN di Batch 2:
| Komponen | Digunakan Di |
|----------|-------------|
| `PageTransition` | Semua halaman auth + public |
| `StepIndicator` | Register, Forgot/Reset Password |
| `PasswordStrength` | Register, Reset Password |
| `Alert` | Error states di auth forms |
| `Button` (loading) | Semua form submit buttons |
| `Input` (error/icon) | Semua form inputs |
| `ScrollToTop` | Landing page, long public pages |
| Semantic colors | Status page, alert variants |
| Animation tokens | Landing page scroll effects |
| `motion-variants.ts` | Scroll animations |

---

## Checklist Selesai Batch 2
- [ ] Landing page: animasi smooth, responsive, accessible
- [ ] Login/Register: validation UX, loading states, password features
- [ ] Forgot/Reset/Verify: step indicators, success states
- [ ] Public pages: typography polish, TOC, SEO meta
- [ ] Sitemap + robots.txt generated
- [ ] `npm run build` PASS
- [ ] `npx tsc --noEmit` PASS
- [ ] Mobile responsive check (375px) semua halaman
- [ ] Dark mode check semua halaman
- [ ] Heading hierarchy valid (h1→h2→h3)

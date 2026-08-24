# Batch 10: Production Readiness Checklist
> Final gate sebelum launch publik — everything must pass

**Status**: ✅ Selesai (11 Apr 2026) — Error pages + audit checklist ready
**Priority**: HIGH — Gate sebelum go-live
**Dependency**: SEMUA batch FE + BE selesai
**Estimasi**: Audit + fix, bukan development baru

---

## 10.1 Performance Audit

### Lighthouse Scores (Target)
- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 90+
- [ ] SEO: 90+
- [ ] PWA: passing

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1
- [ ] Test di: PageSpeed Insights, WebPageTest

### Bundle Size
- [ ] Run `ANALYZE=true npm run build` (next-bundle-analyzer)
- [ ] Identify: packages > 50KB
- [ ] Action: lazy import heavy packages (charts, editor, etc)
- [ ] Tree-shake unused exports
- [ ] Target: First Load JS < 100KB per route

### Image Optimization
- [ ] Semua images via Next/Image
- [ ] `sizes` prop set correctly (responsive)
- [ ] WebP/AVIF format served
- [ ] Lazy load below-fold images
- [ ] Avatar placeholders: blur or skeleton

### Font Optimization
- [ ] Inter font via `next/font/google` (not CDN link)
- [ ] Font subset: latin only (reduce size)
- [ ] `font-display: swap`
- [ ] Preload critical font weights (400, 500, 600, 700)

---

## 10.2 Security Audit (FE)

### Content Security
- [ ] No `dangerouslySetInnerHTML` tanpa sanitization
- [ ] XSS: semua user content escaped
- [ ] No secrets/API keys di client-side code
- [ ] `.env.local` tidak committed

### Auth Security
- [ ] Token stored securely (httpOnly cookie preferred, or secure localStorage)
- [ ] Auto-logout pada token expiry
- [ ] Redirect to login saat 401
- [ ] No auth token in URL params

### Form Security
- [ ] CSRF protection (jika cookie-based auth)
- [ ] Rate limit feedback di UI (show "Terlalu banyak percobaan")
- [ ] No autocomplete on sensitive fields (credit card, password confirm)

---

## 10.3 Cross-Browser Testing

### Desktop
- [ ] Chrome (latest) — primary
- [ ] Safari (latest) — macOS
- [ ] Firefox (latest)
- [ ] Edge (latest)

### Mobile
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS 16+)
- [ ] Samsung Internet (popular di Indonesia)

### Critical Flows per Browser
- [ ] Register + Login
- [ ] Browse feed + explore
- [ ] View creator page
- [ ] Purchase post/product
- [ ] Donate
- [ ] Chat
- [ ] Dashboard (creator)
- [ ] Admin panel

---

## 10.4 Responsive Audit

### Breakpoints
- [ ] 320px — small phone (iPhone SE)
- [ ] 375px — standard phone (iPhone 12)
- [ ] 390px — newer phone (iPhone 14)
- [ ] 412px — Android standard
- [ ] 768px — tablet portrait
- [ ] 1024px — tablet landscape / small laptop
- [ ] 1280px — laptop
- [ ] 1440px — desktop
- [ ] 1920px — large desktop

### Critical Layout Checks
- [ ] Navbar: responsive menu, no overflow
- [ ] Bottom nav: visible di mobile, hidden di desktop
- [ ] Cards: proper grid collapse (3→2→1 column)
- [ ] Tables: horizontal scroll atau card view di mobile
- [ ] Modals: tidak overflow viewport
- [ ] Forms: input tidak terlalu kecil di mobile
- [ ] Charts: readable di mobile
- [ ] Chat: full height, keyboard tidak overlap

---

## 10.5 Accessibility Final Audit

### Automated
- [ ] axe DevTools scan: 0 critical issues
- [ ] Lighthouse Accessibility: 95+
- [ ] WAVE evaluation: no errors

### Manual
- [ ] Keyboard navigation: Tab through entire app
- [ ] Focus visible: ring always visible
- [ ] Skip to main: working
- [ ] Screen reader: test with VoiceOver (macOS) atau NVDA (Windows)
- [ ] Color contrast: all text passes WCAG AA (4.5:1)
- [ ] No color-only information
- [ ] All images: descriptive alt text
- [ ] All forms: label associated with input
- [ ] All errors: announced to screen reader (aria-live)
- [ ] All modals: focus trapped, Escape closes

---

## 10.6 Error Handling Audit

### Error States
- [ ] API down: show error page, retry button
- [ ] 404: custom not found page (`/fe/app/not-found.tsx`)
- [ ] 500: custom error page (`/fe/app/error.tsx`)
- [ ] Network error: show offline indicator (sudah ada OfflineIndicator)
- [ ] Form errors: inline validation + summary

### Error Boundary
- [ ] React error boundary catches render crashes (sudah ada ErrorBoundary)
- [ ] Fallback UI: "Terjadi kesalahan" + retry button
- [ ] Report to Sentry (if configured)

---

## 10.7 Dark Mode Final Audit

### Semua Pages
- [ ] Landing page
- [ ] Auth pages (login, register, forgot, reset, verify)
- [ ] Public pages (privacy, terms, contact, pricing, cara-kerja, status)
- [ ] Creator page
- [ ] Post detail
- [ ] Product detail
- [ ] Feed
- [ ] Explore
- [ ] Dashboard + all sub-pages
- [ ] Wallet pages
- [ ] Chat
- [ ] Notifications
- [ ] Profile
- [ ] Admin + all sub-pages
- [ ] Supporter pages

### Component Checks
- [ ] Semua borders: `dark:border-gray-700`
- [ ] Semua backgrounds: `dark:bg-*`
- [ ] Semua text: `dark:text-*`
- [ ] Charts: axis + labels readable in dark
- [ ] Images: no white border artifacts
- [ ] Shadows: appropriate in dark mode
- [ ] Semantic colors: dark variants defined

---

## 10.8 Content & Copy Review

### Bahasa Indonesia Check
- [ ] Semua UI text dalam Bahasa Indonesia yang benar
- [ ] Konsisten: "Kamu" vs "Anda" (pick one — recommendation: "Kamu" for casual tone)
- [ ] No English mixed in (kecuali technical terms: email, password, etc)
- [ ] Error messages: clear, helpful, not technical

### Empty States Review
- [ ] Semua empty states punya:
  - Ilustrasi/icon
  - Title yang helpful
  - Subtitle/description
  - CTA (action button)
- [ ] Tone: encouraging, not blame ("Belum ada post" bukan "Kamu belum buat post")

### Loading States Review
- [ ] Semua pages punya loading skeleton
- [ ] No blank white screens
- [ ] No layout shift saat content loads
- [ ] Consistent skeleton patterns

---

## 10.9 Legal Pre-Launch

- [ ] Privacy Policy: reviewed (ideally by lawyer)
- [ ] Terms of Service: reviewed
- [ ] Cookie consent: implemented + working
- [ ] Refund policy: documented in terms
- [ ] Age restriction: 13+ atau 18+ (tentukan)
- [ ] Content guidelines: published
- [ ] DMCA takedown process: documented

---

## 10.10 Launch Preparation

### Pre-Launch
- [ ] Domain: DNS configured, SSL active
- [ ] Monitoring: uptime + error tracking active
- [ ] Backup: database + file storage backup running
- [ ] Staging: tested on staging environment first
- [ ] Load test: simulate 100+ concurrent users

### Launch Day
- [ ] Health check: all services green
- [ ] Smoke test: register → create → purchase → donate flow
- [ ] Monitor: error rate, response time, CPU/memory
- [ ] Rollback plan: how to revert if critical bug found
- [ ] Communication: announcement ready (social media, email)

### Post-Launch (Week 1)
- [ ] Monitor: error rates, user feedback
- [ ] Hotfix process: quick deploy for critical bugs
- [ ] User feedback channel: setup (email, form, Discord/Telegram community)
- [ ] Analytics: check conversion funnel (register → create → earn)

---

## FINAL SIGN-OFF

| Area | Owner | Status |
|------|-------|--------|
| FE Batch 1-5: UI/UX Redesign | FE | ⬜ |
| FE Batch 6: Testing | FE | ⬜ |
| FE Batch 7: PWA | FE | ⬜ |
| FE Batch 8: SEO/Analytics | FE | ⬜ |
| FE Batch 9: Account UI | FE | ⬜ |
| FE Batch 10: Production Ready | FE | ⬜ |
| BE Batch 1-5: API + Business | BE | ⬜ |
| BE Batch 6: Testing | BE | ⬜ |
| BE Batch 7: CI/CD | DevOps | ⬜ |
| BE Batch 8: Monitoring | DevOps | ⬜ |
| BE Batch 9: Email | BE | ⬜ |
| BE Batch 10: Account/Legal | BE | ⬜ |
| Legal review | Legal | ⬜ |
| Security audit | Security | ⬜ |

**Launch gate**: ALL ⬜ → ✅

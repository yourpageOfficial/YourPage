# Batch 7: PWA & Mobile Experience
> 70%+ user Indonesia akses via mobile — harus native-like

**Status**: ✅ Selesai (11 Apr 2026)
**Priority**: MEDIUM

---

## 7.1 Manifest Enhancement

### Update `/fe/public/manifest.json`
- [ ] Audit current manifest — pastikan:
  ```json
  {
    "name": "YourPage — Halaman kamu, penghasilanmu",
    "short_name": "YourPage",
    "description": "Platform monetisasi konten untuk kreator Indonesia",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait",
    "theme_color": "#2563EB",
    "background_color": "#FFFFFF",
    "categories": ["social", "entertainment", "finance"],
    "lang": "id",
    "icons": [
      { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
      { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
      { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
      { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
      { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ],
    "screenshots": [
      { "src": "/screenshots/home.png", "sizes": "1080x1920", "type": "image/png", "form_factor": "narrow" },
      { "src": "/screenshots/desktop.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide" }
    ]
  }
  ```

### App Icons
- [ ] Generate icon set dari master icon (512x512):
  - 72, 96, 128, 144, 152, 192, 384, 512
  - Maskable icon variant (untuk Android adaptive icons)
- [ ] Apple touch icon: `/fe/public/apple-touch-icon.png` (180x180)
- [ ] Favicon: `/fe/public/favicon.ico` + `/fe/public/favicon.svg`

### Splash Screens (iOS)
- [ ] Generate Apple splash screens untuk berbagai device sizes
- [ ] Add meta tags di `layout.tsx`:
  ```html
  <link rel="apple-touch-startup-image" href="/splash/..." />
  ```

---

## 7.2 Service Worker

### Caching Strategy
- [ ] Buat `/fe/public/sw.js` atau pakai `next-pwa`:
  ```
  npm install next-pwa
  ```
- [ ] Config di `next.config.mjs`:
  ```js
  const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [...]
  })
  ```

### Cache Strategies
- [ ] **App Shell** (Cache First):
  - `/_next/static/*` — JS, CSS bundles
  - `/icons/*`, `/fonts/*`
  - Offline fallback page

- [ ] **API Responses** (Network First, fallback cache):
  - `GET /api/v1/me` — profile (cache 5 min)
  - `GET /api/v1/feed` — feed (cache 1 min)
  - `GET /api/v1/notifications/unread-count` — (cache 30s)

- [ ] **Images** (Cache First, max 100 entries):
  - Avatar images
  - Post thumbnails
  - Product thumbnails

### Offline Fallback Page
- [ ] Buat `/fe/app/offline/page.tsx`:
  - YourPage logo
  - "Kamu sedang offline"
  - "Pastikan koneksi internet dan coba lagi"
  - Retry button
- [ ] Service worker serve halaman ini saat offline + no cache

---

## 7.3 Install Prompt (A2HS)

### Custom Install Banner
- [ ] Buat `/fe/components/install-prompt.tsx`:
  ```tsx
  // Listen for beforeinstallprompt event
  // Show custom banner: "Install YourPage untuk pengalaman terbaik"
  // CTA: "Install" / "Nanti"
  // Remember dismiss (localStorage, don't show for 7 days)
  ```
- [ ] Show setelah user visit 3x (engagement threshold)
- [ ] Responsive: bottom sheet di mobile, subtle banner di desktop

### iOS Install Guide
- [ ] Detect iOS Safari (no beforeinstallprompt)
- [ ] Show manual guide: "Tap Share → Add to Home Screen"
- [ ] Include visual guide/screenshots

---

## 7.4 Mobile UX Polish

### Touch Targets
- [ ] Audit semua interactive elements: minimum 44x44px
- [ ] `button, a, [role="button"]` — already has `min-height: 36px` → bump to 44px di mobile
- [ ] Adequate spacing between touch targets (8px min gap)

### Gestures
- [ ] Pull-to-refresh di feed page (FE Batch 3)
- [ ] Swipe to dismiss notifications (FE Batch 4)
- [ ] Swipe back navigation? (butuh library, optional)

### Viewport & Safe Areas
- [ ] Already have `viewport-fit=cover` — good
- [ ] Already have `safe-bottom` class — good
- [ ] Check: bottom nav not overlapping content on notched devices
- [ ] Check: modals respect safe areas

### Keyboard Handling
- [ ] Input focus: viewport scrolls to show input above keyboard
- [ ] Chat input: stays above keyboard
- [ ] `visual-viewport` API untuk detect keyboard height (optional)

### Performance Mobile
- [ ] Reduce animation di `prefers-reduced-motion`
- [ ] Lazy load images below fold
- [ ] Minimize JS bundle (check Next.js bundle analyzer)
- [ ] Font subset: only Latin + extended characters

---

## 7.5 App-Like Navigation

### Smooth Page Transitions
- [ ] Already planned in FE Batch 1 (PageTransition component)
- [ ] Pastikan: no full page reloads, SPA-like navigation
- [ ] Loading indicator: thin bar di top saat navigating (NProgress style)

### Bottom Navigation Polish
- [ ] Already exists (`bottom-nav.tsx`)
- [ ] Enhance: haptic feedback on tap (navigator.vibrate — optional)
- [ ] Active state: animated icon (subtle scale)
- [ ] Badge count pada notification icon

---

## Checklist Selesai
- [ ] Manifest: complete dengan icons, screenshots, categories
- [ ] App icons: all sizes generated, maskable included
- [ ] Service worker: caching strategies configured
- [ ] Offline page: shows when offline
- [ ] Install prompt: custom banner, iOS guide
- [ ] Touch targets: 44x44px minimum
- [ ] Viewport: safe areas respected
- [ ] Mobile performance: reduced motion, lazy load
- [ ] Lighthouse PWA audit: passing
- [ ] Test: install PWA on Android + iOS
- [ ] Test: offline → offline page shows
- [ ] Test: slow network → cached content loads

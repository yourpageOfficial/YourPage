# Batch 8: SEO, Analytics & Marketing
> Kalau user gak bisa nemuin YourPage, redesign percuma

**Status**: ✅ Selesai (11 Apr 2026)
**Priority**: MEDIUM
**Dependency**: FE Batch 2 (sitemap + robots sudah dibuat)
**Estimasi Files**: ~10 modified, ~5 baru

---

## 8.1 Analytics Tracking

### Option A: Google Analytics 4 (GA4)
- [ ] Install: `npm install @next/third-parties` atau manual gtag
- [ ] Setup di `layout.tsx` (setelah cookie consent)
- [ ] Track events:
  - `page_view` — auto
  - `sign_up` — register success
  - `login` — login success
  - `purchase` — post/product purchase
  - `donation` — donation sent
  - `topup` — wallet topup
  - `follow` — follow creator
  - `share` — share content

### Option B: Plausible / Umami (Privacy-friendly, self-hosted)
- [ ] Docker container di server
- [ ] Script tag di layout
- [ ] No cookie consent needed (privacy-first)
- [ ] **Recommendation**: Plausible/Umami — simpler, GDPR-compliant

### Event Tracking Helper
- [ ] Buat `/fe/lib/analytics.ts`:
  ```ts
  export function trackEvent(name: string, props?: Record<string, any>) {
    // GA4
    if (typeof gtag !== 'undefined') gtag('event', name, props)
    // Plausible
    if (typeof plausible !== 'undefined') plausible(name, { props })
  }
  ```
- [ ] Usage: `trackEvent('purchase', { item: 'post', amount: 500 })`

---

## 8.2 SEO Enhancements

### Dynamic Metadata (Sudah di FE Batch 2 plan)
- [ ] Verify `generateMetadata()` di semua pages:
  - Landing page ✓
  - Creator page: `{creator.name} — YourPage`
  - Post detail: `{post.title} — by {creator.name}`
  - Product detail: `{product.name} — {price}`
  - Auth pages: "Login — YourPage", "Register — YourPage"
  - Dashboard: noindex (private)
  - Admin: noindex (private)

### Structured Data (JSON-LD)
- [ ] Buat `/fe/lib/jsonld.ts`:
  ```ts
  export function creatorJsonLd(creator: Creator) {
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": creator.display_name,
      "description": creator.bio,
      "image": creator.avatar_url,
      "url": `https://yourpage.id/c/${creator.slug}`
    }
  }

  export function productJsonLd(product: Product) {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "offers": {
        "@type": "Offer",
        "price": product.price_idr,
        "priceCurrency": "IDR"
      }
    }
  }

  export function postJsonLd(post: Post) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "author": { "@type": "Person", "name": post.creator.display_name },
      "datePublished": post.created_at
    }
  }
  ```
- [ ] Inject via `<script type="application/ld+json">` di page components

### Canonical URLs
- [ ] Tambah `<link rel="canonical">` di semua public pages
- [ ] Prevent duplicate content (www vs non-www, http vs https)

### Open Graph Images
- [ ] Default OG image: `/fe/public/og-default.png` (1200x630)
- [ ] Dynamic OG per creator page (nama + avatar overlay)
- [ ] Dynamic OG per post (title overlay)
- [ ] Pakai `next/og` (ImageResponse API) atau static template

### Sitemap Enhancement (dari FE Batch 2)
- [ ] Verify `/fe/app/sitemap.ts` include:
  - Static pages: `/`, `/pricing`, `/cara-kerja`, `/privacy`, `/terms`, `/contact`
  - Dynamic: `/c/{slug}` — all public creators
  - Dynamic: `/posts/{id}` — all public posts
  - Dynamic: `/products/{id}` — all public products
  - `changeFrequency` + `priority` per type

### Robots Enhancement (dari FE Batch 2)
- [ ] Verify `/fe/app/robots.ts`:
  ```ts
  export default function robots() {
    return {
      rules: [
        { userAgent: '*', allow: '/', disallow: ['/dashboard', '/admin', '/api', '/s/'] },
      ],
      sitemap: 'https://yourpage.id/sitemap.xml',
    }
  }
  ```

---

## 8.3 Social Sharing

### Share Metadata
- [ ] Setiap public page harus render correctly saat di-share:
  - WhatsApp: title + description + image
  - Twitter/X: card summary_large_image
  - Facebook: OG title + description + image
  - Telegram: auto-preview
- [ ] Test via: opengraph.xyz, Twitter Card Validator, Facebook Debugger

### Share Widget Enhancement (FE)
- [ ] Creator page: share button → copy link, WhatsApp, Twitter, Facebook
- [ ] Post detail: same
- [ ] Product detail: same
- [ ] Short URL? (optional — `yourpage.id/c/slug` sudah cukup pendek)

---

## 8.4 Content Marketing Pages

### Blog/Updates Page (Optional)
- [ ] `/fe/app/blog/page.tsx` — platform updates, tips untuk kreator
- [ ] Pakai MDX atau fetch dari CMS
- [ ] SEO: each blog post has unique metadata
- [ ] **Recommendation**: Phase 2 — fokus core product dulu

### Creator Spotlight
- [ ] Section di landing page: featured creators
- [ ] Already have `GET /creators/featured` endpoint
- [ ] Bisa jadi dynamic: rotate featured weekly

---

## 8.5 Cookie Consent Banner (FE)

### Component
- [ ] Buat `/fe/components/cookie-consent.tsx`:
  - Banner di bottom: "Kami menggunakan cookies untuk pengalaman terbaik"
  - Buttons: "Terima" / "Pengaturan"
  - Settings: essential (always on), analytics (toggle), marketing (toggle)
  - Store preference: `localStorage.setItem('cookie-consent', JSON.stringify(...))`
  - Only load analytics scripts after consent

### Integration
- [ ] Show on first visit (no consent stored)
- [ ] Don't show di dashboard/private pages (user sudah login = implicit consent)
- [ ] Respect `Do Not Track` browser setting

---

## Checklist Selesai
- [ ] Analytics: tracking setup (GA4 atau Plausible)
- [ ] Event tracking: key business events tracked
- [ ] SEO: generateMetadata di semua public pages
- [ ] JSON-LD: creator, product, post structured data
- [ ] OG images: default + dynamic
- [ ] Sitemap: all public URLs included
- [ ] Robots.txt: correct allow/disallow
- [ ] Social sharing: preview correct di WhatsApp, Twitter, Facebook
- [ ] Cookie consent: banner working, analytics gated
- [ ] Lighthouse SEO score: 90+
- [ ] Test: share creator URL ke WhatsApp → preview correct
- [ ] Test: Google search "site:yourpage.id" → pages indexed

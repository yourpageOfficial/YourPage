# Batch 3: Creator Page, Post/Product Detail, & Content Pages
> Halaman paling penting untuk monetisasi — UX harus premium

**Status**: ✅ Selesai (11 Apr 2026)
**Dependency**: Batch 1 (design system) + Batch 2 (page transitions sudah tested)
**Estimasi Files**: 0 baru, ~12 dimodifikasi

---

## 3.1 Creator Page (`/fe/app/c/[slug]/page.tsx`)

### Header & Profile
- [ ] Parallax scroll effect pada cover/banner image
- [ ] Better gradient overlay pada header (smooth dark gradient dari bawah)
- [ ] Profile card: entrance animation (slide-up + fade, gunakan `motion-variants`)
- [ ] Avatar: gunakan `Avatar` component baru (Batch 1)

### Badges & Social Proof
- [ ] Badges (verified, Pro, Business): tambah `Tooltip` on hover dengan deskripsi
- [ ] Follow button: animate state change (checkmark transition saat followed)
- [ ] Follower/following count: animated count display
- [ ] Subscribed badge: gunakan `Badge` component upgraded (success variant)

### Donation Widget
- [ ] Smooth open/close animation (slide-down + fade)
- [ ] Preset amount buttons: haptic-feel (scale on press)
- [ ] Custom amount input: focus animation
- [ ] Keyboard support (Enter to submit, Escape to close)
- [ ] Loading state pada donate button

### Donation Goal
- [ ] Animated progress bar (width transition on mount)
- [ ] Milestone markers pada progress bar
- [ ] Percentage display + amount raised/target

### Top Supporters
- [ ] Podium-style top 3 (gold/silver/bronze colors)
- [ ] Animated entry (stagger reveal)
- [ ] Avatar + name + total donated
- [ ] `Tooltip` pada supporter avatar

### Tabs (Posts/Products/About)
- [ ] GANTI manual tab implementation → `Tabs` component baru (Radix-based)
- [ ] Animated underline indicator
- [ ] Badge count per tab (jumlah posts, products)
- [ ] Smooth content transition saat switch tab

### Empty States
- [ ] "Belum ada post" — ilustrasi + "Follow untuk update" CTA
- [ ] "Belum ada produk" — ilustrasi + subtitle
- [ ] "Belum ada supporter" — ilustrasi encouraging

### Membership Tiers
- [ ] Card redesign: feature list per tier (checkmarks)
- [ ] Popular tier highlight (border + "Popular" badge)
- [ ] Hover lift effect pada tier cards
- [ ] Price prominent display
- [ ] Subscribe button loading state

### SEO & Accessibility
- [ ] `generateMetadata()` — dynamic OG (creator avatar, name, bio)
- [ ] Tab `aria-selected` states (handled by Radix Tabs)
- [ ] Donation widget keyboard support (tab, enter, escape)
- [ ] Proper heading hierarchy dalam tab content

---

## 3.2 Post Detail (`/fe/app/posts/[id]/page.tsx`)

### Content & Typography
- [ ] Better typography: prose-like styling untuk readability
- [ ] Font size comfortable, line-height 1.7+
- [ ] Estimated read time display (word count / 200 wpm)
- [ ] Page transition animation

### Media
- [ ] Image gallery: lightbox on click (enlarge dengan backdrop)
- [ ] Proper video player controls
- [ ] `ImageWithFallback` component untuk semua images

### Locked Content
- [ ] Better visual treatment: gradient fade effect di content
- [ ] Lock icon overlay
- [ ] CTA: "Unlock dengan membership" atau "Beli post ini"
- [ ] Tier info display (tier mana yang bisa akses)

### Interactions
- [ ] Like button: animated heart (scale + color burst effect)
- [ ] Optimistic update pada like count
- [ ] Comments: inline expand animation (slide-down)
- [ ] Comment submit: optimistic update + loading state

### Share
- [ ] Proper dropdown menu (GANTI hover-based → click-based)
- [ ] Copy link: toast notification (BUKAN alert)
- [ ] Share options: Copy, Twitter/X, Facebook, WhatsApp
- [ ] Keyboard support pada share menu

### Related Posts
- [ ] "Post Lainnya" section di bottom
- [ ] Grid 2-3 cards dari kreator yang sama
- [ ] Skeleton loading state

### Accessibility
- [ ] Proper heading structure (h1 title, h2 sections)
- [ ] Share menu keyboard support (Enter/Space to open, Escape to close)
- [ ] Alt text pada semua media
- [ ] `aria-label` pada like button ("Like post" / "Unlike post")

---

## 3.3 Product Detail (`/fe/app/products/[id]/page.tsx`)

### Layout
- [ ] 2-column layout: content kiri, purchase card kanan (sticky sidebar)
- [ ] Purchase card: sticky saat scroll (position sticky)
- [ ] Responsive: single column di mobile, purchase card di bottom

### Thumbnail & Gallery
- [ ] Zoom on hover effect (scale subtle)
- [ ] Gallery jika multiple images (thumbnail strip)
- [ ] `ImageWithFallback` component
- [ ] Lightbox on click

### Product Info
- [ ] Price: large prominent display
- [ ] Credit conversion display ("= 500 credits")
- [ ] File list: icons per mime type (PDF, ZIP, MP3, etc)
- [ ] File size formatting (KB, MB, GB)

### Actions
- [ ] Buy button: loading state saat purchase
- [ ] Success animation setelah purchase
- [ ] Download section: progress indicator
- [ ] Expiry countdown timer (jika ada expiry)

### Empty States
- [ ] No files: ilustrasi + "Produk ini belum memiliki file"
- [ ] Error loading: retry button

### Accessibility
- [ ] File type icons: alt text descriptive
- [ ] Price: `aria-label="Harga: Rp50.000"`
- [ ] Download buttons: descriptive labels

---

## 3.4 Feed Page (`/fe/app/feed/page.tsx`)

### Infinite Scroll
- [ ] GANTI `LoadMore` → `InfiniteScroll` component (auto-load)
- [ ] Skeleton cards saat loading next page
- [ ] "Tidak ada lagi post" end state

### Post Cards
- [ ] Stagger entrance animation (saat pertama load + saat new batch)
- [ ] Hover lift effect pada cards
- [ ] Image: `ImageWithFallback` component

### Mobile UX
- [ ] Pull-to-refresh gesture (mobile)
- [ ] `ScrollToTop` button

### Empty State
- [ ] Ilustrasi "Feed kosong"
- [ ] "Temukan kreator" CTA link ke `/explore`
- [ ] Subtitle: "Follow kreator untuk lihat post mereka di sini"

---

## 3.5 Explore Page (`/fe/app/explore/page.tsx`)

### Search
- [ ] Animated expand on focus (width transition)
- [ ] Clear button (X) saat ada text
- [ ] Search icon feedback (subtle animation saat typing)
- [ ] Debounced search (gunakan `useDebounce`)

### Category/Filter
- [ ] Horizontal scroll chips di mobile
- [ ] Active chip: animated highlight (background transition)
- [ ] Smooth transition saat filter change

### Creator Cards
- [ ] Hover lift effect (shadow + translateY)
- [ ] Skeleton loading state saat initial + search
- [ ] Avatar: gunakan `Avatar` component baru

### Trending Section
- [ ] Numbered ranking badges: #1 (gold), #2 (silver), #3 (bronze)
- [ ] Special styling top 3

### Empty/No Results
- [ ] Ilustrasi "Tidak ditemukan"
- [ ] Suggestions: "Coba kata kunci lain" atau popular creators

### Infinite Scroll
- [ ] `InfiniteScroll` component untuk creator list
- [ ] Skeleton cards saat loading

---

## 3.6 Library Pages (`/fe/app/library/`)

### Purchased Posts
- [ ] Consistent card design (sama style dengan feed cards)
- [ ] Filter/sort options (terbaru, terlama)
- [ ] Empty state: "Belum ada post yang dibeli" + CTA ke explore

### Purchased Products
- [ ] Download status per product
- [ ] Card design konsisten
- [ ] Empty state: CTA explore

---

## Dependency dari Batch 1

| Komponen Batch 1 | Digunakan Di |
|-------------------|-------------|
| `Tabs` | Creator page tabs |
| `Avatar` | Creator profile, top supporters, comments |
| `Tooltip` | Creator badges, supporter info |
| `Badge` (upgraded) | Subscribed badge, ranking, status |
| `InfiniteScroll` | Feed, Explore, Creator posts |
| `ScrollToTop` | Feed, Explore |
| `ImageWithFallback` | Post images, product thumbnails |
| `PageTransition` | Semua halaman |
| `Button` (loading) | Donate, buy, like, comment submit |
| `EmptyState` (upgraded) | Semua empty states |
| `Skeleton` (upgraded) | Loading states |
| `motion-variants.ts` | Scroll animations, entrance effects |

---

## Checklist Selesai Batch 3
- [ ] Creator page: parallax, tabs, donation widget, empty states
- [ ] Post detail: typography, lightbox, share dropdown, related posts
- [ ] Product detail: 2-column sticky, gallery, buy flow
- [ ] Feed: infinite scroll, pull-to-refresh, empty state
- [ ] Explore: search UX, category chips, trending, infinite scroll
- [ ] Library: consistent cards, empty states
- [ ] `npm run build` PASS
- [ ] `npx tsc --noEmit` PASS
- [ ] Mobile responsive check (375px)
- [ ] Dark mode check
- [ ] Keyboard navigation test (tabs, modals, dropdowns)

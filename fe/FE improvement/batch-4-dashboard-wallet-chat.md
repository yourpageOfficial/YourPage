# Batch 4: Dashboard, Wallet, Chat, & Supporter Pages
> Area yang dipakai sehari-hari — harus efisien dan informatif

**Status**: ✅ Selesai (11 Apr 2026)
**Dependency**: Batch 1 (komponen) + Batch 3 (patterns sudah established)
**Estimasi Files**: 0 baru, ~25 dimodifikasi

---

## 4.1 Dashboard Home (`/fe/app/dashboard/page.tsx`)

### Setup Checklist
- [ ] Gunakan `StepIndicator` component untuk onboarding steps
- [ ] Progress percentage display
- [ ] Animate completion (checkmark + confetti subtle)
- [ ] Dismiss/hide setelah semua selesai

### Stats Cards
- [ ] Animated count-up on mount (number increment animation)
- [ ] Trend indicator: ↑ hijau (naik), ↓ merah (turun), — abu (tetap)
- [ ] Hover effect pada cards
- [ ] Skeleton loading state (`ChartSkeleton`)

### Sales Chart
- [ ] Upgrade Recharts:
  - Proper axis labels (tanggal, amount)
  - Tooltip on hover (formatted)
  - Date axis responsive
  - Hover highlight per data point
- [ ] Date range picker (7 hari, 30 hari, 90 hari, custom)
- [ ] Empty chart state: "Belum ada data penjualan"

### Quick Actions
- [ ] Icon animation on hover (subtle scale/color)
- [ ] Grid layout responsive

### Tier Card
- [ ] Progress bar ke next tier
- [ ] Current tier badge
- [ ] "X lagi untuk naik ke tier Y" text

### Empty States
- [ ] Empty sales: ilustrasi + "Tips meningkatkan penjualan" link
- [ ] Empty stats: "Mulai buat konten untuk lihat statistik"

---

## 4.2 Dashboard Sub-pages

### Posts (`/fe/app/dashboard/posts/page.tsx`)
- [ ] Table/list view toggle (icon buttons)
- [ ] Bulk actions: select all, delete selected, publish selected
- [ ] Status filter tabs (gunakan `Tabs` component): All, Published, Draft, Scheduled
- [ ] Empty state: "Buat post pertamamu" + template suggestions
- [ ] Loading: `TableSkeleton`
- [ ] Pagination: gunakan `Pagination` component

### Products (`/fe/app/dashboard/products/page.tsx`)
- [ ] Grid/list view toggle
- [ ] Sales count badge per product card
- [ ] Empty state: "Buat produk digital pertamamu" + ilustrasi
- [ ] Loading: skeleton grid
- [ ] Sort: terlaris, terbaru, harga

### Donations (`/fe/app/dashboard/donations/page.tsx`)
- [ ] Timeline view (tanggal → list donations)
- [ ] Filter by date range
- [ ] Stats summary at top: total received, average, top donor
- [ ] Empty state: "Belum ada donasi" + tips
- [ ] Loading: `TableSkeleton`

### Withdrawal (`/fe/app/dashboard/withdrawal/`)
- [ ] Step indicator: Request → Review → Process → Done
- [ ] Status tracking timeline per withdrawal
- [ ] Form validation: minimum amount, bank info required
- [ ] Loading state pada submit
- [ ] Empty state: "Belum ada withdrawal"

### Analytics (`/fe/app/dashboard/analytics/page.tsx`)
- [ ] Better charts: line chart (views), pie chart (revenue sources)
- [ ] Date range picker
- [ ] Export option (CSV download)
- [ ] Skeleton loading for charts
- [ ] Empty state: "Data belum tersedia"

### Overlay (`/fe/app/dashboard/overlay/page.tsx`)
- [ ] Live preview panel
- [ ] Better tier management UI
- [ ] Color picker improvements
- [ ] Copy overlay URL with toast

### Membership (`/fe/app/dashboard/membership/page.tsx`)
- [ ] Tier builder/editor UI
- [ ] Member list dengan search
- [ ] Revenue stats per tier
- [ ] Empty state: "Buat tier membership pertamamu"

---

## 4.3 Wallet Pages

### Creator Wallet (`/fe/app/wallet/page.tsx`)
- [ ] Balance card: animated, prominent display
  - Large balance number (count-up animation)
  - "Withdrawal" CTA button
  - Pending balance info
- [ ] Transaction list:
  - Filter by type (semua, masuk, keluar)
  - Filter by date range
  - Type badge + icon (donation, sale, withdrawal, etc)
- [ ] Transaction detail: expandable row (click to expand)
- [ ] Empty state: "Belum ada transaksi"
- [ ] Loading: `TableSkeleton`
- [ ] Pagination: `Pagination` component

### Supporter Wallet (`/fe/app/s/wallet/page.tsx`)
- [ ] Balance card: prominent dengan "Top-up" CTA
- [ ] Transaction history:
  - Color-coded badges + TEXT labels (bukan hanya warna — accessibility!)
  - Type: top-up (hijau), purchase (biru), donation (ungu)
- [ ] Empty state: "Top-up credit untuk mulai mendukung kreator" + CTA
- [ ] Loading: skeleton

### Top-up Page (`/fe/app/wallet/topup/page.tsx`)
- [ ] Amount presets grid (10k, 25k, 50k, 100k, 250k, 500k)
- [ ] Custom amount input
- [ ] Payment method cards (visual selection)
- [ ] Confirmation dialog sebelum bayar (gunakan `ConfirmDialog`)
- [ ] Loading state saat process payment
- [ ] Success animation

---

## 4.4 Chat Page (`/fe/app/chat/`)

### Conversation List
- [ ] Unread indicator: dot (bukan hanya count number)
- [ ] Last message preview truncated
- [ ] Online status pada avatar (gunakan `Avatar` online indicator)
- [ ] Smooth transition saat select conversation

### Message Bubbles
- [ ] Better styling: rounded, proper spacing, timestamp
- [ ] Read receipt indicator (double check icon)
- [ ] Sent/delivered/read states
- [ ] Image messages: thumbnail + lightbox

### Input Area
- [ ] Auto-resize textarea (grow with content, max 5 lines)
- [ ] Emoji picker button (placeholder/future)
- [ ] Send button: disabled saat empty, loading saat sending
- [ ] Enter to send, Shift+Enter new line

### UX
- [ ] Typing indicator animation (three dots pulsing)
- [ ] Smooth scroll to new messages
- [ ] Load older messages (scroll up → load more)

### Paid Chat
- [ ] Better visual treatment untuk paid chat notice
- [ ] Price display prominent
- [ ] Payment flow smooth

### Empty & States
- [ ] Empty conversation list: ilustrasi "Mulai chat"
- [ ] Empty chat: "Kirim pesan pertamamu"
- [ ] Loading: skeleton conversation list + skeleton messages

### Accessibility
- [ ] `aria-label` pada semua action buttons
- [ ] Keyboard navigation: tab antar conversations
- [ ] `role="log"` pada message container
- [ ] `aria-live="polite"` pada new messages

---

## 4.5 Supporter Pages (`/fe/app/s/`)

### Posts (`/fe/app/s/posts/page.tsx`)
- [ ] Grid layout untuk purchased posts
- [ ] Card design konsisten dengan feed
- [ ] Empty state: "Belum ada post yang dibeli" + CTA ke explore
- [ ] Loading: skeleton grid

### Products (`/fe/app/s/products/page.tsx`)
- [ ] Download status per product (downloaded/not)
- [ ] Card design konsisten
- [ ] Empty state: "Belum ada produk yang dibeli" + CTA explore
- [ ] Loading: skeleton grid

### Donations (`/fe/app/s/donations/page.tsx`)
- [ ] Timeline view (grouped by date)
- [ ] Total donated summary card at top
- [ ] Creator avatar + name per donation
- [ ] Empty state: "Belum pernah donasi" + CTA explore

### Transactions (`/fe/app/s/transactions/page.tsx`)
- [ ] Filter by type (semua, top-up, purchase, donation)
- [ ] Sort by date
- [ ] Type badge + TEXT label (accessibility — not color-only)
- [ ] Empty state: "Belum ada transaksi"

---

## 4.6 Notification Page (`/fe/app/notifications/page.tsx`)
- [ ] Unread indicator: dot (bukan hanya opacity difference)
- [ ] Group by date: "Hari ini", "Kemarin", "Minggu ini", "Lebih lama"
- [ ] Notification type icons (donation, comment, follow, purchase, etc)
- [ ] Click → navigate to source (post, creator, etc)
- [ ] Swipe to dismiss (mobile, optional)
- [ ] Mark all as read button
- [ ] Empty state: ilustrasi "Semua sudah dibaca" + subtitle
- [ ] Loading: skeleton list
- [ ] `aria-live="polite"` pada notification updates

---

## 4.7 Profile Page (`/fe/app/profile/page.tsx`)
- [ ] Avatar upload: preview sebelum save
  - Thumbnail preview saat select file
  - Crop/resize hint
- [ ] Form sections: collapsible cards (Profile Info, Account, Social Links)
- [ ] Save button: loading state
- [ ] Save confirmation toast (bukan alert)
- [ ] Unsaved changes warning (jika navigate away)
- [ ] Input validation: realtime feedback
- [ ] Slug/username: availability check (debounced)

---

## Dependency dari Batch Sebelumnya

| Komponen | Dari Batch | Digunakan Di |
|----------|-----------|-------------|
| `StepIndicator` | 1 | Dashboard setup, Withdrawal |
| `Tabs` | 1 | Dashboard posts filter, wallet filter |
| `Pagination` | 1 | Dashboard lists, wallet transactions |
| `Avatar` | 1 | Chat, supporters, profile |
| `Badge` (upgraded) | 1 | Transaction types, status |
| `InfiniteScroll` | 1 | Chat messages, notifications |
| `ScrollToTop` | 1 | Long lists |
| `Tooltip` | 1 | Dashboard stats info |
| `Alert` | 1 | Wallet notices |
| `Skeleton` (upgraded) | 1 | All loading states |
| `Button` (loading) | 1 | All form submits |
| `Input` (error/icon) | 1 | All form inputs |
| `ConfirmDialog` (loading) | 1 | Top-up, withdrawal |
| `CharacterCount` | 1 | Chat input, profile bio |
| `EmptyState` (upgraded) | 1 | All empty states |
| `PageTransition` | 1 | All pages |
| `motion-variants.ts` | 1 | Count-up animations, entrance effects |

---

## Checklist Selesai Batch 4
- [ ] Dashboard home: stats animated, chart upgraded, setup checklist
- [ ] Dashboard sub-pages: filter, sort, bulk actions, empty states
- [ ] Wallet: balance card, transaction list, top-up flow
- [ ] Chat: message UX, typing indicator, accessibility
- [ ] Supporter pages: consistent cards, empty states
- [ ] Notifications: grouped, dot indicator, type icons
- [ ] Profile: avatar preview, form sections, save UX
- [ ] `npm run build` PASS
- [ ] `npx tsc --noEmit` PASS
- [ ] Mobile responsive check (375px)
- [ ] Dark mode check
- [ ] Transaction badges: text + color (not color-only)
- [ ] Keyboard navigation test

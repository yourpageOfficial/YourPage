# Batch 12 — UI/UX Overhaul (Brand Consistency + Mobile UX)

**Tanggal:** 11 April 2026
**Fokus:** Brand color consistency (biru/putih/kuning), mobile UX, professional polish
**Palet:** Primary #2563EB (Blue), Secondary #FACC15 (Yellow), Background White, Text Gray-900

---

## Task 1: Kuning (Secondary) Harus Terlihat

Kuning (#FACC15) hampir tidak dipakai di seluruh app. Harus muncul sebagai aksen.

### 1.1 Landing page — Pricing "Paling Populer" badge
**File:** `fe/app/page.tsx` → `PricingCard`
- Ganti `bg-primary text-white` → `bg-yellow-400 text-yellow-900 font-bold`
- Ring card: `ring-yellow-400/30` bukan `ring-primary/20`

### 1.2 Landing page — Social proof angka
**File:** `fe/app/page.tsx` → Social proof section
- Angka utama ("5%", "2 menit") tetap `text-primary`
- Tambah kuning di "1 Credit" dan "24 jam": `text-yellow-500`
- Alternating biru-kuning untuk visual rhythm

### 1.3 Earning/credit amounts di seluruh app
- Semua angka credit positif (earning, topup) → `text-yellow-600 dark:text-yellow-400`
- Saldo wallet → highlight kuning
- Dashboard stat "Total Pendapatan" → icon kuning

### 1.4 Star ratings & badges
- Pro badge: tetap biru 💙
- Business badge: tetap ungu 💜
- Featured creator badge: `bg-yellow-100 text-yellow-700` dengan star icon
- Verified checkmark: tetap biru

---

## Task 2: Ganti Emoji → SVG Icons

Emoji terlihat tidak profesional dan render berbeda per device.

### 2.1 Landing page — Credit System section
**File:** `fe/app/page.tsx` → `CreditStep`
| Emoji | Ganti dengan | Import |
|-------|-------------|--------|
| 💳 | `<CreditCard>` | lucide-react |
| 🛒 | `<ShoppingBag>` | lucide-react |
| ☕ | `<Heart>` | lucide-react |
| 🏦 | `<Building>` | lucide-react |

Style: `className="h-8 w-8 text-primary"` di dalam circle `bg-primary/10 rounded-full p-2`

### 2.2 Landing page — Use Cases section
| Emoji | Ganti dengan |
|-------|-------------|
| 🎨 | `<Palette>` |
| 📚 | `<BookOpen>` |
| 🎮 | `<Gamepad2>` |

### 2.3 Landing page — Hero badge
- `🇮🇩 Platform #1` → hapus emoji flag, ganti: `Platform #1 untuk Kreator Indonesia` plain text atau pakai small SVG flag

### 2.4 Dashboard — Setup checklist
- `🚀 Setup Halaman Kamu` → `<Rocket className="h-4 w-4 inline" /> Setup Halaman Kamu`

### 2.5 Broadcast button
- `📢 Broadcast` → `<Megaphone>` icon

---

## Task 3: "How it Works" — Fix Warna ke Palet

**File:** `fe/app/page.tsx` → How it works section

Sekarang: Step 1 `bg-blue-500`, Step 2 `bg-purple-500`, Step 3 `bg-green-500`

Fix:
```
Step 1: bg-primary (biru) — Daftar
Step 2: bg-yellow-400 text-yellow-900 — Upload & Atur Harga
Step 3: bg-primary (biru) — Terima Uang
```

Alternating biru-kuning-biru untuk brand consistency.

---

## Task 4: Hapus AuthGuard dari Explore

**File:** `fe/app/explore/page.tsx`

Sekarang: `<AuthGuard>` membungkus seluruh halaman — user harus login untuk browse kreator.

Fix:
- Hapus `<AuthGuard>` wrapper
- Biarkan explore fully public
- Follow button: tampilkan tapi redirect ke `/login` kalau belum auth
- Ini critical untuk growth — orang harus bisa lihat kreator tanpa register

---

## Task 5: Mobile Touch Targets

Minimum 44x44px untuk semua interactive elements di mobile.

### 5.1 Explore — Category pills
**File:** `fe/app/explore/page.tsx`
- Sekarang: `px-3 py-1 text-xs` (~28px tinggi)
- Fix: `px-4 py-2 text-sm` (~40px tinggi)

### 5.2 Scroll hint untuk horizontal pills
Tambah fade gradient di kanan:
```tsx
<div className="relative">
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
    {/* pills */}
  </div>
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 pointer-events-none sm:hidden" />
</div>
```

### 5.3 Notification actions
- Mark read, delete buttons: pastikan min `h-10 w-10`

### 5.4 Footer links
- Sekarang: `text-sm` tanpa padding → sulit di-tap
- Fix: `py-2` pada setiap link

---

## Task 6: Pricing Card — Fix Mobile Scale

**File:** `fe/app/page.tsx` → `PricingCard`

Sekarang: `scale-105` pada Pro card — di mobile bikin card keluar grid.

Fix:
```tsx
className={`h-full ${popular ? "border-yellow-400 ring-2 ring-yellow-400/20 relative sm:scale-105" : ""}`}
```
- Scale hanya di `sm:` ke atas
- Border kuning (bukan biru) untuk "Paling Populer"

---

## Task 7: Wallet Saldo Card — Visual Hierarchy

**File:** `fe/app/wallet/page.tsx`

Sekarang: Card biasa, saldo `text-2xl sm:text-3xl text-primary`

Fix — gradient card:
```tsx
<Card className="bg-gradient-to-br from-primary to-blue-700 text-white">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-white/80 text-sm font-medium">Saldo Credit</CardTitle>
      <Link href="/wallet/topup">
        <Button size="sm" variant="secondary">Top-up</Button>
      </Link>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-4xl sm:text-5xl font-black">{totalCredits} <span className="text-lg font-normal text-white/70">Credit</span></p>
    <p className="text-sm text-white/60 mt-1">= {formatIDR(totalCredits * 1000)}</p>
  </CardContent>
</Card>
```

---

## Task 8: Dark Mode Consistency

Standardize semua card dan section backgrounds:

| Element | Light | Dark |
|---------|-------|------|
| Page background | `bg-white` | `dark:bg-gray-900` |
| Card | `bg-white` | `dark:bg-gray-800` |
| Section alt | `bg-gray-50` | `dark:bg-gray-800/50` |
| Input | `bg-white` | `dark:bg-gray-800` |
| Dropdown | `bg-white` | `dark:bg-gray-800` |

Scan semua files untuk `dark:bg-gray-800/50` pada cards dan ganti ke `dark:bg-gray-800` (solid).
Section backgrounds boleh tetap `dark:bg-gray-800/50`.

---

## Task 9: Empty States — Lebih Engaging

### 9.1 Wallet kosong
**File:** `fe/app/wallet/page.tsx`
```tsx
<div className="text-center py-12">
  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
    <WalletIcon className="h-8 w-8 text-primary" />
  </div>
  <h3 className="font-semibold text-lg">Wallet Masih Kosong</h3>
  <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">Top-up credit untuk mulai beli konten eksklusif dan dukung kreator favoritmu</p>
  <Link href="/wallet/topup"><Button className="mt-4">Top-up Sekarang</Button></Link>
</div>
```

### 9.2 Pattern untuk semua empty states
Buat reusable component `<EmptyState icon={} title="" description="" action={{ label, href }} />`

---

## Task 10: Footer Expand

**File:** `fe/app/page.tsx` → footer section

Sekarang: 1 baris, 4 link.

Fix — 3 kolom:
```tsx
<footer className="border-t dark:border-gray-800 py-12 px-4">
  <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-8">
    <div>
      <p className="text-lg font-bold text-primary mb-4">YourPage</p>
      <p className="text-sm text-gray-500">Platform monetisasi konten untuk kreator Indonesia.</p>
    </div>
    <div>
      <p className="text-sm font-semibold mb-3">Produk</p>
      <nav className="space-y-2 text-sm text-gray-500">
        <Link href="/pricing" className="block hover:text-primary">Harga</Link>
        <Link href="/cara-kerja" className="block hover:text-primary">Cara Kerja</Link>
        <Link href="/explore" className="block hover:text-primary">Explore Kreator</Link>
      </nav>
    </div>
    <div>
      <p className="text-sm font-semibold mb-3">Legal</p>
      <nav className="space-y-2 text-sm text-gray-500">
        <Link href="/terms" className="block hover:text-primary">Syarat & Ketentuan</Link>
        <Link href="/privacy" className="block hover:text-primary">Kebijakan Privasi</Link>
        <Link href="/contact" className="block hover:text-primary">Kontak</Link>
      </nav>
    </div>
    <div>
      <p className="text-sm font-semibold mb-3">Ikuti Kami</p>
      <nav className="space-y-2 text-sm text-gray-500">
        <a href="#" className="block hover:text-primary">Instagram</a>
        <a href="#" className="block hover:text-primary">Twitter/X</a>
        <a href="#" className="block hover:text-primary">TikTok</a>
      </nav>
    </div>
  </div>
  <div className="mx-auto max-w-4xl mt-8 pt-6 border-t dark:border-gray-800 text-center">
    <p className="text-xs text-gray-400">© 2026 YourPage. Semua hak dilindungi.</p>
  </div>
</footer>
```

---

## Task 11: Framer Motion — Respect Reduced Motion

**File:** `fe/lib/motion-variants.ts` atau buat `fe/lib/use-reduced-motion.ts`

```tsx
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
```

Di motion variants, kalau reduced motion: `duration: 0, delay: 0`.

---

## Task 12: Dashboard Breadcrumb

Buat `fe/components/breadcrumb.tsx`:
```tsx
interface BreadcrumbItem { label: string; href?: string }

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-gray-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-primary">{item.label}</Link>
          ) : (
            <span className="text-gray-900 dark:text-gray-100 font-medium">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
```

Tambahkan di semua dashboard sub-pages:
```tsx
<Breadcrumb items={[
  { label: "Dashboard", href: "/dashboard" },
  { label: "Products" }
]} />
```

---

## Execution Order

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 4 | Hapus AuthGuard Explore | 1 min | 🔴 Critical |
| 2 | Emoji → SVG icons | 30 min | 🟡 High |
| 3 | How it works colors | 10 min | 🟡 High |
| 1 | Kuning sebagai aksen | 1 hr | 🟡 High |
| 5 | Mobile touch targets | 1 hr | 🟡 High |
| 6 | Pricing card mobile fix | 5 min | 🟠 Medium |
| 7 | Wallet gradient card | 20 min | 🟠 Medium |
| 9 | Empty states component | 30 min | 🟠 Medium |
| 10 | Footer expand | 30 min | 🟠 Medium |
| 8 | Dark mode consistency | 1 hr | 🟠 Medium |
| 11 | Reduced motion | 20 min | 🔵 Low |
| 12 | Breadcrumb | 30 min | 🔵 Low |

**Total estimated: ~6 jam**

# Frontend UI & UX Engineering Review: YourPage

**Project:** YourPage (Frontend — Next.js 14 App Router + Tailwind CSS + TypeScript)  
**Date:** 2026-08-23  
**Reviewer:** Orang UI Web (Frontend UI Engineering Specialist)  
**Scope:** Architecture, Design System, Accessibility (WCAG 2.1 AA), Responsive Design, State/Data Fetching, and UX Polish  
**Status:** ⚠️ **Changes Recommended** (Quality & Accessibility Improvements)

---

## 1. Executive Summary

The frontend codebase for **YourPage** is modern, responsive, and well-typed. It leverages Next.js 14 App Router, TanStack Query v5, Zustand, Framer Motion, and Tailwind CSS. The app features 51+ pages, dark mode support, skeleton loaders, and interactive components.

However, several production-grade frontend engineering improvements are needed:
1. **Accessibility (WCAG 2.1 AA):** Form inputs lack `id`/`htmlFor` associations; the skip-to-main link lacks visible focus styling; non-interactive `<div>`s handle click events without keyboard handlers.
2. **Design System Consistency:** `DESIGN_SYSTEM.md` documents a blue palette (`#2563EB`), whereas `tailwind.config.ts` uses a vibrant pink/purple palette (`#EC4899`); border-radius classes are heavily skewed towards `rounded-2xl` everywhere.
3. **Component Architecture:** Key pages (`/c/[slug]`, `/chat`, `/dashboard/posts`) are monolithic (300–450+ lines) mixing data fetching, business logic, and UI rendering.
4. **Web Standards & Performance:** Memory leaks in Blob URL creation (`URL.createObjectURL`); native browser `alert()` calls bypassing the toast system; `window.location.href` triggering full document reloads instead of client-side navigation.
5. **OBS Stream Isolation:** Popups (cookie consent, install prompt) render globally in `RootLayout`, risking intrusion into OBS live stream overlays (`/overlay`).

---

## 2. Multi-Dimensional Evaluation

### 🏛️ 1. Component Architecture & Composition

#### Finding 1.1: Monolithic Page Components
* **Locations:**
  - [`fe/app/c/[slug]/page.tsx`](../fe/app/c/[slug]/page.tsx) (429 lines)
  - [`fe/app/chat/chat-content.tsx`](../fe/app/chat/chat-content.tsx) (284 lines)
  - [`fe/app/dashboard/posts/page.tsx`](../fe/app/dashboard/posts/page.tsx) (255 lines)
* **Problem:** Pages combine data orchestration, mutation handling, modal dialog states, form state, and layout rendering inside a single file.
* **Remedy:** Decompose into container/presentation pairs and colocated subcomponents:
  ```
  app/c/[slug]/
  ├── page.tsx                 # Container: data fetching & metadata
  ├── components/
  │   ├── creator-header.tsx   # Banner, avatar, bio, action buttons
  │   ├── donation-modal.tsx   # Donation form modal with preset chips
  │   ├── membership-tab.tsx   # Membership tier cards
  │   └── product-tab.tsx      # Digital product cards
  ```

#### Finding 1.2: Hard Navigations via `window.location.href`
* **Locations:**
  - [`fe/app/admin/users/page.tsx:67`](../fe/app/admin/users/page.tsx#L67)
  - [`fe/app/admin/promo/page.tsx:87`](../fe/app/admin/promo/page.tsx#L87)
  - [`fe/app/dashboard/posts/page.tsx:223`](../fe/app/dashboard/posts/page.tsx#L223)
  - [`fe/app/dashboard/products/page.tsx:171`](../fe/app/dashboard/products/page.tsx#L171)
* **Problem:** Using `<Card onClick={() => window.location.href = ...}>` instead of `<Link href="...">` prevents:
  - Middle-click / Cmd-click ("Open in new tab")
  - Next.js link prefetching and smooth SPA page transitions
  - Screen reader recognition of links
* **Remedy:** Wrap cards in `<Link href="...">` or use Next.js `useRouter().push(...)` for programmatic transitions.

---

### 🎨 2. Design System & Visual Quality

#### Finding 2.1: Palette & Token Inconsistency
* **Files:** [`fe/DESIGN_SYSTEM.md`](../fe/DESIGN_SYSTEM.md) vs [`fe/tailwind.config.ts`](../fe/tailwind.config.ts)
* **Problem:**
  - `DESIGN_SYSTEM.md` defines Primary as Blue `#2563EB`.
  - `tailwind.config.ts` defines Primary as Pink `#EC4899`, Secondary as Purple `#7C3AED`, and Accent as Orange `#F97316`.
  - Hardcoded color codes appear across components (e.g. `border: '3px solid #2563EB'` in `overlay/page.tsx`, `accentColor = '#2563EB'` in `c/[slug]/page.tsx`).
* **Remedy:** Synchronize `DESIGN_SYSTEM.md` with the active Tailwind theme tokens and eliminate hardcoded hex colors from JSX inline styles.

#### Finding 2.2: Corner Radius Scale Overuse (`rounded-2xl` everywhere)
* **Problem:** `rounded-2xl` (20px) is applied uniformly to small badges, pills, buttons, inputs, and outer cards.
* **Remedy:** Establish a hierarchical radius scale:
  - Outer Containers & Cards: `rounded-2xl` (16–20px)
  - Modals & Banners: `rounded-xl` (12–16px)
  - Inputs & Buttons: `rounded-lg` (8–10px)
  - Badges & Chips: `rounded-full` (pills) or `rounded-md` (4–6px)

---

### ♿ 3. Accessibility (WCAG 2.1 AA)

#### Finding 3.1: Form Labels Disconnected from Inputs
* **Locations:**
  - [`fe/app/login/page.tsx:75-80`](../fe/app/login/page.tsx#L75-L80)
  - [`fe/app/register/page.tsx:117-135`](../fe/app/register/page.tsx#L117-L135)
  - [`fe/app/forgot-password/page.tsx`](../fe/app/forgot-password/page.tsx)
* **Problem:** `<label>` elements lack `htmlFor` attributes, and `<Input>` elements lack corresponding `id`s. Clicking label text does not focus the input, and screen readers in form mode fail to announce input labels.
* **Remedy:** Connect inputs using explicit `id` and `htmlFor`, or use a reusable `<FormField>` wrapper:
  ```tsx
  <div>
    <label htmlFor="login-email" className="text-sm font-medium mb-1.5 block">Email</label>
    <Input id="login-email" type="email" placeholder="nama@email.com" ... />
  </div>
  ```

#### Finding 3.2: Inaccessible "Skip to Main Content" Link
* **File:** [`fe/app/layout.tsx:51`](../fe/app/layout.tsx#L51)
* **Problem:** `<a href="#main" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>` remains off-screen even when focused via keyboard Tab navigation.
* **Remedy:** Use Tailwind's accessible focus classes:
  ```tsx
  <a
    href="#main"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
  >
    Lewati ke konten utama
  </a>
  ```

#### Finding 3.3: Interactive Icon Buttons Missing `aria-label`
* **Locations:** Modal close buttons (`<X />`), share buttons, delete buttons across post/product lists.
* **Remedy:** Ensure every icon-only `<button>` has a localized, descriptive `aria-label` (e.g. `aria-label="Tutup dialog"`).

---

### 📱 4. Responsive Design & OBS View Isolation

#### Finding 4.1: Overlay Stream Contamination by Global Overlays
* **Files:** [`fe/components/cookie-consent.tsx`](../fe/components/cookie-consent.tsx), [`fe/components/install-prompt.tsx`](../fe/components/install-prompt.tsx)
* **Problem:** In `RootLayout`, `<CookieConsent />` and `<InstallPrompt />` are rendered globally. When a creator embeds `/overlay` into OBS Studio as a browser source, unconsented cookie banners or PWA install prompts render over the live stream output.
* **Remedy:** Suppress popups on `/overlay` routes:
  ```tsx
  const pathname = usePathname();
  if (pathname.startsWith("/overlay")) return null;
  ```

#### Finding 4.2: Mobile Keyboard Handling in Chat
* **File:** [`fe/app/chat/chat-content.tsx:93-97`](../fe/app/chat/chat-content.tsx#L93-L97)
* **Problem:** The message input is an uncontrolled `<div>` with `onKeyDown={e => e.key === "Enter"}`. Mobile virtual keyboards (iOS/Android) don't trigger the "Enter/Send" submit action reliably unless wrapped in a semantic `<form onSubmit="...">`.
* **Remedy:** Wrap chat inputs in `<form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>`.

---

### ⚡ 5. State Management & Performance Polish

#### Finding 5.1: Memory Leak via Unrevoked Blob URLs
* **Locations:**
  - [`fe/app/dashboard/analytics/page.tsx:51`](../fe/app/dashboard/analytics/page.tsx#L51) (Sales export CSV)
  - [`fe/app/admin/payments/page.tsx`](../fe/app/admin/payments/page.tsx) (Admin export CSV)
* **Problem:** `URL.createObjectURL(blob)` allocates browser memory that persists for the lifetime of the document unless revoked.
* **Remedy:** Revoke the object URL after triggering the download:
  ```tsx
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
  ```

#### Finding 5.2: Native `alert()` Calls Bypassing Toast Notification System
* **Locations:**
  - [`fe/app/wallet/topup/page.tsx:148`](../fe/app/wallet/topup/page.tsx#L148) (`alert("Maksimal 10MB")`)
  - [`fe/components/post-card.tsx:80`](../fe/components/post-card.tsx#L80) (`alert("Link disalin!")`)
* **Remedy:** Replace all instances of `alert(...)` with `toast.error(...)` or `toast.success(...)`.

---

## 3. Recommended Frontend Action Plan

| Priority | Task | Target Files |
|---|---|---|
| **P0** | Suppress Cookie & Install banners on `/overlay` | [`cookie-consent.tsx`](../fe/components/cookie-consent.tsx), [`install-prompt.tsx`](../fe/components/install-prompt.tsx) |
| **P0** | Fix accessible Skip to Main Content link | [`layout.tsx`](../fe/app/layout.tsx) |
| **P1** | Add `id` / `htmlFor` to form inputs | [`login/page.tsx`](../fe/app/login/page.tsx), [`register/page.tsx`](../fe/app/register/page.tsx) |
| **P1** | Replace `alert()` with `toast` | [`wallet/topup/page.tsx`](../fe/app/wallet/topup/page.tsx), [`post-card.tsx`](../fe/components/post-card.tsx) |
| **P1** | Replace `window.location.href` card clicks with `<Link>` | [`dashboard/posts/page.tsx`](../fe/app/dashboard/posts/page.tsx), [`admin/users/page.tsx`](../fe/app/admin/users/page.tsx) |
| **P2** | Wrap chat input in `<form>` | [`chat/chat-content.tsx`](../fe/app/chat/chat-content.tsx) |
| **P2** | Revoke Blob URLs on CSV export | [`dashboard/analytics/page.tsx`](../fe/app/dashboard/analytics/page.tsx) |
| **P2** | Synchronize `DESIGN_SYSTEM.md` with `tailwind.config.ts` | [`DESIGN_SYSTEM.md`](../fe/DESIGN_SYSTEM.md) |
| **P3** | Decompose oversized pages (`c/[slug]`, `dashboard/posts`) | [`app/c/[slug]/page.tsx`](../fe/app/c/[slug]/page.tsx) |

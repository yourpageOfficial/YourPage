# Batch 13 — Full QA Audit (FE)

**Tanggal:** 11 April 2026
**Fokus:** Full frontend audit — security, UX, accessibility, type safety, error handling

---

## 🔴 CRITICAL — Security

### FE-QA-1: JWT Token di localStorage — XSS Vulnerable

**File:** `fe/lib/api.ts`, `fe/lib/auth.ts`

Access token dan refresh token disimpan di `localStorage`. Jika ada XSS vulnerability (termasuk dari third-party script), attacker bisa baca token dan impersonate user.

```ts
localStorage.setItem("access_token", data.data.access_token);
localStorage.setItem("refresh_token", data.data.refresh_token);
```

**Impact:** Full account takeover jika XSS terjadi.

**Fix:** Pindahkan token ke httpOnly cookie (set dari BE). Atau minimal, simpan refresh token di httpOnly cookie dan access token di memory (Zustand state, bukan localStorage).

---

### FE-QA-2: Middleware Auth Hanya Cek Cookie `auth-role`

**File:** `fe/middleware.ts`

Route protection di server-side middleware hanya cek cookie `auth-role` yang di-set oleh client-side JavaScript:

```ts
document.cookie = `auth-role=${user.role}; path=/; SameSite=Lax`;
```

Cookie ini bisa di-forge oleh user via browser DevTools. User bisa set `auth-role=admin` dan akses `/admin` pages.

**Impact:** Unauthorized access ke admin UI (tapi BE tetap reject API calls tanpa valid token).

**Fix:** Set cookie dari BE saat login (httpOnly, signed). Atau validasi token di middleware via BE API call.

---

### FE-QA-3: `dangerouslySetInnerHTML` di Layout dan Overlay

**File:** `fe/app/layout.tsx:39`, `fe/app/overlay/page.tsx:82`

Layout menggunakan `dangerouslySetInnerHTML` untuk theme script. Overlay page juga. Meskipun content-nya hardcoded (bukan user input), ini membuka pattern yang bisa disalahgunakan.

```tsx
<script dangerouslySetInnerHTML={{ __html: `...` }} />
```

**Impact:** Low risk karena content hardcoded, tapi perlu dipastikan tidak ada user input yang masuk ke sini.

**Fix:** Pastikan tidak ada user-controlled data yang masuk ke `dangerouslySetInnerHTML`. Untuk theme, pertimbangkan pakai `next-themes` package.

---

## 🟠 HIGH — Type Safety / Data Integrity

### FE-QA-4: Excessive `as any` Type Assertions (20+ occurrences)

**Files:** Multiple — `chat-content.tsx`, `admin/profit/page.tsx`, `admin/users/[id]/page.tsx`, `admin/page.tsx`, `admin/promo/page.tsx`, `s/donations/page.tsx`, `s/transactions/`, `dashboard/posts/`

```ts
return data.data as any[];
return data.data as any;
(post as any).membership_tier_id
(product as any).delivery_type
```

**Impact:** Runtime errors tidak terdeteksi saat compile. Data shape mismatch bisa crash di production.

**Fix:** Buat proper TypeScript interfaces untuk setiap API response. Contoh: `AdminAnalytics`, `ChatConversation`, `ChatMessage`, `MembershipTier`, `PromoCreator`, dll.

---

### FE-QA-5: `types.ts` Tidak Lengkap

**File:** `fe/lib/types.ts`

Banyak entity yang belum ada type-nya:
- `ChatConversation`, `ChatMessage`
- `MembershipTier`, `Membership`
- `AdminAnalytics`, `AuditLog`
- `ContentReport`, `UserKYC`
- `OverlayTier`
- `ReferralCode`
- `CreatorProfile` (full, bukan hanya nested di User)

**Fix:** Tambahkan semua missing interfaces ke `types.ts`.

---

## 🟡 MEDIUM — Error Handling / UX

### FE-QA-6: Silent `catch {}` — 10 Occurrences

**Files:** `posts/[id]/page.tsx`, `products/[id]/page.tsx`, `layout.tsx`, `overlay/page.tsx`, `report-button.tsx`, `post-card.tsx`

```ts
} catch {}  // error silently swallowed
```

User tidak tahu kalau action gagal (like, comment, report, download).

**Fix:** Minimal tampilkan toast error: `catch (e) { toast.error("Gagal memuat data") }`.

---

### FE-QA-7: No Error Boundary

**File:** `fe/app/error.tsx` (exists tapi perlu dicek coverage)

Jika ada runtime error di child component, seluruh page crash tanpa recovery. Next.js `error.tsx` hanya catch di level route segment.

**Fix:** Tambahkan React Error Boundary wrapper di komponen kritis (dashboard, checkout, chat) untuk graceful degradation.

---

### FE-QA-8: No Loading State untuk Beberapa Actions

Beberapa form submit tidak disable button saat loading, memungkinkan double-submit:
- Membership subscribe
- Donation submit
- Withdrawal request
- Topup request

**Fix:** Tambahkan `isSubmitting` state dan disable button saat proses.

---

### FE-QA-9: Refresh Token Race — Edge Case

**File:** `fe/lib/api.ts`

Refresh token logic sudah ada mutex (`isRefreshing` + queue), tapi jika refresh endpoint juga return 401, infinite loop bisa terjadi karena `original._retry` hanya di-set sekali.

```ts
if (error.response?.status === 401 && !original._retry) {
```

**Fix:** Tambahkan check: jika URL adalah `/auth/refresh`, langsung reject tanpa retry.

---

## 🔵 LOW — Code Quality / Accessibility

### FE-QA-10: Accessibility — Missing Form Labels

Beberapa form input tidak punya `<label>` element, hanya pakai `placeholder`. Screen readers tidak bisa identify field purpose.

**Files:** `change-password.tsx`, `admin/users/page.tsx` (finance user form)

**Fix:** Tambahkan `<label htmlFor="...">` atau `aria-label` pada setiap input.

---

### FE-QA-11: No CSRF Protection

Login form tidak pakai CSRF token. Meskipun CORS sudah restricted, CSRF masih possible via form submission dari domain lain.

**Fix:** Implement CSRF token (generate dari BE, validate di setiap POST). Atau pastikan semua mutating requests pakai `Content-Type: application/json` (yang tidak bisa di-send via HTML form).

---

### FE-QA-12: `has_logged_in` Flag di localStorage

**File:** `fe/lib/auth.ts`

```ts
const isFirstLogin = !localStorage.getItem("has_logged_in");
```

Flag ini persist selamanya. Jika user clear cookies tapi tidak clear localStorage, mereka tidak akan lihat welcome page lagi. Juga, jika user login di device baru, flag tidak ada → selalu redirect ke welcome.

**Fix:** Simpan flag di user profile (BE) bukan localStorage. Atau terima behavior ini sebagai acceptable.

---

### FE-QA-13: No Test Files

Tidak ada satupun test file di FE (`*.test.tsx`, `*.spec.tsx`). Tidak ada unit test, integration test, atau E2E test.

**Fix:** Prioritas:
1. E2E test untuk critical flows (login, checkout, donation) — Playwright/Cypress
2. Component test untuk form validation — React Testing Library
3. Unit test untuk utility functions — Vitest

---

### FE-QA-14: Image Optimization — Raw `<img>` Tags

**Files:** `admin/topups/page.tsx`, `admin/settings/page.tsx`, `dashboard/posts/[id]/page.tsx`, `dashboard/kyc/page.tsx`, `dashboard/profile/page.tsx`, `dashboard/overlay/page.tsx`

Beberapa tempat pakai raw `<img>` tag instead of Next.js `<Image>` atau `<ImageFallback>` component. Kehilangan lazy loading, responsive sizing, dan format optimization.

**Fix:** Ganti `<img>` dengan `<ImageFallback>` atau `next/image` di semua tempat.

---

## 📊 Summary

| Severity | Count | Area |
|----------|-------|------|
| 🔴 Critical | 3 | Token storage, middleware auth bypass, dangerouslySetInnerHTML |
| 🟠 High | 2 | Type safety (as any), incomplete types |
| 🟡 Medium | 4 | Silent catch, no error boundary, double submit, refresh race |
| 🔵 Low | 5 | Accessibility, CSRF, localStorage flag, no tests, raw img |
| **Total** | **14** | |

## ✅ What's Already Good

- CORS restricted di BE
- `autoComplete` attributes pada login/register forms
- Semua `<img>` punya `alt` attribute
- Loading states (Skeleton) di 35+ files
- ARIA attributes di 54+ locations
- No `console.log` in production code
- No `eval()` or `innerHTML` (except 2 controlled cases)
- Proper image remote patterns restriction di `next.config.mjs`
- Refresh token rotation with mutex
- Route protection via middleware + auth guard component


---

# Batch 13 Addendum — Deep Security Audit & QA Process Review (FE)

**Tanggal:** 11 April 2026
**Fokus:** Second pass — auth flow, data exposure, input validation, network security

---

## 🔴 CRITICAL — Security (New Findings)

### FE-QA-15: Refresh Token Stored in localStorage — Full Token Theft

**File:** `fe/lib/auth.ts`, `fe/lib/api.ts`

Refresh token (7-day TTL) di localStorage. Ini lebih berbahaya dari access token karena:
- Access token expire 15 menit — window kecil
- Refresh token expire 7 hari — attacker punya 7 hari untuk generate unlimited access tokens

Jika ada XSS (bahkan dari third-party analytics script), attacker bisa:
1. Baca refresh token dari localStorage
2. Call `/auth/refresh` untuk generate access token baru
3. Impersonate user selama 7 hari

**Impact:** Persistent account takeover.

**Fix:** Refresh token HARUS di httpOnly cookie (set dari BE response header, bukan JS). Access token bisa tetap di memory (Zustand state).

---

## 🟠 HIGH (New Findings)

### FE-QA-16: No Input Sanitization di FE

**Files:** Semua form yang kirim data ke BE

FE tidak sanitize input sebelum kirim ke API. Meskipun BE punya `SanitizeString()`, defense-in-depth mengharuskan FE juga sanitize.

Contoh: Post content, comment, chat message, donation message — semua dikirim raw.

**Impact:** Jika BE sanitization miss satu endpoint, XSS bisa masuk.

**Fix:** Tambah utility `sanitize()` di FE yang strip HTML tags sebelum submit. Atau pakai library seperti `DOMPurify` untuk rich content.

---

### FE-QA-17: Bank Account Number Displayed in Full

**File:** FE withdrawal pages

BE return `account_number` in full (lihat BE QA-28). FE kemungkinan display full nomor rekening di withdrawal history. Ini PII yang seharusnya di-mask.

**Impact:** Jika ada screen sharing atau shoulder surfing, nomor rekening bocor.

**Fix:** Mask di FE: `****1234` (tampilkan 4 digit terakhir saja). Idealnya masking di BE.

---

## 🟡 MEDIUM (New Findings)

### FE-QA-18: No Logout on Token Theft Detection

**File:** `fe/lib/api.ts`

Saat refresh token gagal (401 dari `/auth/refresh`), FE hanya redirect ke `/login`:

```ts
localStorage.removeItem("access_token");
localStorage.removeItem("refresh_token");
window.location.href = "/login";
```

Tidak ada:
- Alert ke user bahwa session expired/stolen
- Clear semua sensitive data dari memory (Zustand state masih ada sampai page reload)
- Notification ke BE bahwa potential token theft terjadi

**Fix:** Clear Zustand state sebelum redirect. Tampilkan toast "Session expired, silakan login kembali".

---

### FE-QA-19: `window.location.href` untuk Navigation

**File:** `fe/lib/auth.ts`

```ts
window.location.href = "/welcome";
window.location.href = "/admin";
window.location.href = "/dashboard";
```

Full page reload setiap login/logout. Ini:
1. Slower than Next.js router navigation
2. Loses any in-memory state
3. Triggers full re-render

**Fix:** Gunakan `router.push()` dari `next/navigation` instead of `window.location.href`. Kecuali untuk logout (full reload acceptable untuk clear state).

---

### FE-QA-20: No CSP Nonce untuk Inline Scripts

**File:** `fe/app/layout.tsx`

```tsx
<script dangerouslySetInnerHTML={{ __html: `...theme script...` }} />
```

BE set CSP `script-src 'self' 'unsafe-inline'`. `unsafe-inline` diperlukan karena inline script ini. Tapi `unsafe-inline` melemahkan CSP secara signifikan.

**Fix:** Gunakan CSP nonce: generate random nonce per request di BE, pass ke FE via header, set `script-src 'nonce-xxx'` instead of `unsafe-inline`.

---

## 🔵 LOW (New Findings)

### FE-QA-21: No Retry Logic untuk Failed API Calls

Selain refresh token retry, tidak ada retry logic untuk network errors (timeout, 500, 503). User harus manual refresh page.

**Fix:** Tambah axios retry interceptor untuk 5xx errors (max 2 retries, exponential backoff). Atau gunakan React Query's built-in retry.

---

### FE-QA-22: Sensitive Data di Browser History

Login redirect pakai `window.location.href` yang masuk browser history. Jika user login di shared computer, next user bisa lihat `/dashboard` di history dan potentially access cached pages.

**Fix:** Gunakan `router.replace()` instead of `router.push()` untuk post-login redirect. Set `Cache-Control: no-store` di sensitive pages.

---

## 📊 Updated FE Summary (Combined)

| Severity | Original | New | Total |
|----------|----------|-----|-------|
| 🔴 Critical | 3 | 1 | **4** |
| 🟠 High | 2 | 2 | **4** |
| 🟡 Medium | 4 | 3 | **7** |
| 🔵 Low | 5 | 2 | **7** |
| **Total** | **14** | **8** | **22** |

## 🔒 FE Security Audit Checklist

| Area | Status | Notes |
|------|--------|-------|
| Token Storage | 🔴 Vulnerable | Both tokens in localStorage — XSS = full takeover |
| XSS Prevention | ⚠️ Partial | No `dangerouslySetInnerHTML` with user data, but no FE sanitization |
| CSRF | ⚠️ Partial | JSON Content-Type mitigates, no explicit token |
| Route Protection | ⚠️ Weak | Cookie-based middleware forgeable, client-side auth guard as backup |
| Input Validation | ⚠️ Partial | Some forms have min/max, but no HTML sanitization |
| PII Masking | 🔴 Missing | Bank account numbers displayed in full |
| Error Handling | ⚠️ Partial | 10 silent catch blocks, no error boundary on critical paths |
| Network Security | ✅ Good | HTTPS in production, CORS restricted |
| Content Security | ⚠️ Partial | CSP present but `unsafe-inline` + `unsafe-eval` |
| Accessibility | ✅ Decent | 54 ARIA attributes, all img have alt, but some missing labels |

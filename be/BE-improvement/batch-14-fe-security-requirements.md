# BE Batch 14 — Security Fixes Required by FE

**Tanggal:** 11 April 2026
**Prioritas:** CRITICAL — harus dikerjakan sebelum production

---

## 1. 🔴 HttpOnly Cookie untuk JWT Token

**Problem:** FE menyimpan access_token dan refresh_token di localStorage. Jika ada XSS, attacker bisa baca token dan full account takeover (refresh token valid 7 hari).

**Yang dibutuhkan dari BE:**

### Login endpoint (`POST /auth/login`)
Response tetap return JSON, tapi JUGA set cookies:
```
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=900
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth/refresh; Max-Age=604800
Set-Cookie: auth-role=<role>; SameSite=Lax; Path=/; Max-Age=604800
```

- `access_token`: HttpOnly, hanya accessible di `/api` path
- `refresh_token`: HttpOnly, hanya accessible di refresh endpoint
- `auth-role`: NOT HttpOnly (FE middleware perlu baca), tapi signed/HMAC-ed

### Refresh endpoint (`POST /auth/refresh`)
- Baca refresh_token dari cookie (bukan request body)
- Set new access_token cookie
- Rotate refresh_token cookie

### Logout endpoint (`POST /auth/logout`)
- Clear semua cookies:
```
Set-Cookie: access_token=; HttpOnly; Secure; Path=/api; Max-Age=0
Set-Cookie: refresh_token=; HttpOnly; Secure; Path=/api/v1/auth/refresh; Max-Age=0
Set-Cookie: auth-role=; Path=/; Max-Age=0
```

### Auth middleware
- Baca token dari cookie FIRST, fallback ke Authorization header (backward compat)
- `token := c.Cookie("access_token")` → if empty → `c.GetHeader("Authorization")`

### auth-role cookie signing
Untuk mencegah forgery, sign the cookie value:
```
auth-role=creator.HMAC_SHA256(creator, JWT_SECRET)
```
FE middleware bisa verify signature, atau BE bisa provide a `/auth/verify-role` endpoint.

---

## 2. 🔴 CSRF Protection

**Problem:** Tanpa CSRF token, form submission dari domain lain bisa trigger mutations.

**Yang dibutuhkan dari BE:**

### Option A: Double-submit cookie (simpler)
- Pada login, set cookie: `Set-Cookie: csrf_token=<random>; SameSite=Lax; Path=/`
- FE kirim value ini di header: `X-CSRF-Token: <value>`
- BE middleware: compare cookie value vs header value

### Option B: SameSite=Lax sudah cukup
- Jika semua mutating requests pakai `Content-Type: application/json` (bukan form-urlencoded)
- Dan CORS sudah restricted
- Maka CSRF via form submission tidak possible
- **Rekomendasi: Option B sudah cukup untuk sekarang**, tapi document decision

---

## 3. 🟡 Signed auth-role Cookie

**Problem:** FE middleware.ts cek `auth-role` cookie untuk route protection. Cookie ini di-set oleh client JS, bisa di-forge via DevTools.

**Impact:** User bisa akses admin UI pages (tapi BE tetap reject API calls). Masih information disclosure risk.

**Fix:** BE set `auth-role` cookie saat login dengan HMAC signature:
```go
value := fmt.Sprintf("%s.%s", role, hmacSHA256(role, jwtSecret))
c.SetCookie("auth-role", value, 604800, "/", domain, secure, false)
```

FE middleware verify:
```ts
const [role, sig] = cookie.split(".");
// Can't verify HMAC client-side, but at least it's not trivially forgeable
// OR: call /auth/verify endpoint
```

---

## Urutan Implementasi

1. **HttpOnly cookies** — paling critical, prevents XSS token theft
2. **auth-role signing** — prevents admin UI access
3. **CSRF** — evaluate if SameSite=Lax sufficient

## FE Changes After BE Implementation

Setelah BE implement httpOnly cookies:
1. Remove `localStorage.setItem("access_token", ...)` dari `auth.ts`
2. Remove `Authorization` header injection dari `api.ts` interceptor (cookie auto-sent)
3. Update refresh logic — no need to send refresh_token in body
4. Update logout — just call endpoint, cookies cleared by BE
5. Update middleware.ts — verify signed auth-role cookie

# Batch 15 — Localization (i18n)

## Overview

Implement multi-language support in the backend to enable localized error messages and user preferences.

## Motivation

- Backend sends hardcoded Indonesian error messages
- No support for users who prefer English
- Frontend i18n needs backend translation keys

## Implementation

### 1. Core i18n Package

**New file:** `be/internal/pkg/i18n/i18n.go`

- `Tr(c *gin.Context, key string, params ...string) string` — Translate key with locale detection
- `GetLocale(c *gin.Context) string` — Detect locale from: Accept-Language header → query param → user preference → default "id"
- `AcceptLanguageMiddleware()` — Middleware to set locale in request context

### 2. Locale Files (by Country/Language)

**Directory:** `be/internal/pkg/i18n/locale/`

Translation strings are split into separate files by category and language for maintainability:

| File | Language | Category |
|------|----------|----------|
| `auth_id.go` | Indonesian | Auth |
| `auth_en.go` | English | Auth |
| `common_id.go` | Indonesian | Common |
| `common_en.go` | English | Common |
| `validation_id.go` | Indonesian | Validation |
| `validation_en.go` | English | Validation |
| `errors_id.go` | Indonesian | Errors |
| `errors_en.go` | English | Errors |
| `posts_id.go` | Indonesian | Posts |
| `posts_en.go` | English | Posts |
| `products_id.go` | Indonesian | Products |
| `products_en.go` | English | Products |
| `donations_id.go` | Indonesian | Donations |
| `donations_en.go` | English | Donations |
| `wallet_id.go` | Indonesian | Wallet |
| `wallet_en.go` | English | Wallet |
| `follow_id.go` | Indonesian | Follow |
| `follow_en.go` | English | Follow |
| `chat_id.go` | Indonesian | Chat |
| `chat_en.go` | English | Chat |
| `membership_id.go` | Indonesian | Membership |
| `membership_en.go` | English | Membership |
| `overlay_id.go` | Indonesian | Overlay |
| `overlay_en.go` | English | Overlay |
| `referral_id.go` | Indonesian | Referral |
| `referral_en.go` | English | Referral |
| `broadcast_id.go` | Indonesian | Broadcast |
| `broadcast_en.go` | English | Broadcast |
| `kyc_id.go` | Indonesian | KYC |
| `kyc_en.go` | English | KYC |
| `admin_id.go` | Indonesian | Admin |
| `admin_en.go` | English | Admin |
| `notifications_id.go` | Indonesian | Notifications |
| `notifications_en.go` | English | Notifications |
| `time_id.go` | Indonesian | Time |
| `time_en.go` | English | Time |
| `currency_id.go` | Indonesian | Currency |
| `currency_en.go` | English | Currency |

Each file exports a map variable (e.g., `locale.IndonesianAuth`, `locale.EnglishAuth`) that is merged in `i18n.go`.

### 2. User Model

**Modified:** `be/internal/entity/user.go`

Added `Locale` field to store user preference.

### 3. JWT Claims

**Modified:** `be/internal/pkg/jwt/jwt.go`

Added `Locale` to JWT claims so locale is available in token without DB lookup on each request.

### 4. Response Package

**Modified:** `be/internal/pkg/response/response.go`

Added localized helper functions:
- `LocalizedBadRequest(c, key, params...)`
- `LocalizedUnauthorized(c, key, params...)`
- `LocalizedForbidden(c, key, params...)`
- `LocalizedNotFound(c, key, params...)`
- `LocalizedConflict(c, key, params...)`
- `LocalizedInternalError(c, key, params...)`

### 5. Database Migration

**New file:** `be/migrations/0048_locale.sql`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'id';
```

### 6. Auth Handler Updates

**Modified:** `be/internal/handler/auth.go`

- `UpdateMe` now accepts `locale` field in request body
- Users can set preferred language via `PUT /api/v1/auth/me`

### 7. Router Middleware

**Modified:** `be/internal/handler/router.go`

Added `i18n.AcceptLanguageMiddleware()` to detect and set locale early in request lifecycle.

### 8. Auth Middleware

**Modified:** `be/internal/handler/middleware/auth.go`

- Store user locale from JWT in context as `user_locale`
- OptionalAuth also stores locale for authenticated users

## Usage

### Language Detection Priority

1. `Accept-Language` header (e.g., `Accept-Language: en-US`)
2. Query parameter `?lang=en`
3. User preference from database (stored in JWT)
4. Default: `id` (Indonesian)

### Frontend Usage

When using localized responses, pass the translation key instead of hardcoded message:

```go
// Instead of:
response.BadRequest(c, "Email tidak valid")

// Use:
response.LocalizedBadRequest(c, "validation.email.invalid")
```

### Setting User Preference

```json
PUT /api/v1/auth/me
{
  "locale": "en"
}
```

## API Headers

- **Request:** `Accept-Language: en` or `Accept-Language: id`
- **Response:** `Content-Language: en` (set by middleware)

## Testing

Run existing tests to verify no breaking changes:

```bash
cd be && go test ./...
```

## Files Changed

| File | Change |
|------|--------|
| `internal/pkg/i18n/i18n.go` | New — core i18n package |
| `internal/pkg/i18n/locale/*.go` | New — 38 translation files (19 categories × 2 languages) |
| `migrations/0048_locale.sql` | New — database migration |
| `internal/entity/user.go` | Modified — added Locale field |
| `internal/pkg/jwt/jwt.go` | Modified — added Locale to claims |
| `internal/pkg/response/response.go` | Modified — added localized helpers |
| `internal/handler/middleware/auth.go` | Modified — store locale in context |
| `internal/handler/router.go` | Modified — added middleware |
| `internal/handler/auth.go` | Modified — locale in UpdateMe |
| `internal/service/auth.go` | Modified — handle locale in profile |
| `cmd/api/main.go` | Modified — init i18n on startup |
| `internal/testutil/auth.go` | Modified — test token generation |

## Notes

- Default language is Indonesian (`id`)
- Supported: `id`, `en`
- Locale stored in JWT for performance (no DB lookup on each request)
- Middleware sets `Content-Language` header in response

## API Examples

### 1. Set User Locale Preference

**Request:**
```bash
curl -X PUT http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"locale": "en"}'
```

**Response:**
```json
{
  "success": true,
  "message": "profile updated"
}
```

---

### 2. Get Profile (includes locale)

**Request:**
```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar_url": null,
    "bio": null,
    "locale": "en",
    "role": "creator",
    "email_verified": true,
    "creator_profile": {...}
  }
}
```

---

### 3. Request with Accept-Language Header

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Accept-Language: en" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Response (localized - English):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Response (localized - Indonesian):**
```json
{
  "success": false,
  "error": "Email atau password salah"
}
```

---

### 4. Using Localized Response Helpers

In handlers, use the localized helpers:

```go
// Instead of plain message:
response.BadRequest(c, "Email tidak valid")

// Use translation key:
response.LocalizedBadRequest(c, "validation.email.invalid")
```

With params for interpolation:
```go
response.LocalizedBadRequest(c, "validation.min_withdrawal", "100000")
// Output (id): "Minimal penarikan 100000 Credit"
// Output (en): "Minimum withdrawal is 100000 Credits"
```

---

### 5. Query Parameter Override

**Request:**
```bash
curl "http://localhost:8080/api/v1/creators/johndoe?lang=en" \
  -H "Accept-Language: id"
```

The query param `lang` overrides Accept-Language header.

---

### 6. Response Headers

All responses include `Content-Language` header:
```http
Content-Language: en
```

### Language Detection Priority

1. Query parameter `?lang=en`
2. `Accept-Language` header (e.g., `Accept-Language: en-US`)
3. User preference from database (stored in JWT)
4. Default: `id` (Indonesian)
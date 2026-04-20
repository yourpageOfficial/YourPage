# FE Localization (i18n) — Batch 15

**Tanggal:** 19 April 2026
**Status:** ✅ Completed

---

## Overview

Implement multi-language support in the frontend, syncing with backend i18n. Users can switch between Indonesian and English.

## Implementation

### 1. Locale Store

**File:** `fe/lib/use-locale.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Locale = "id" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "id",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "locale-storage" }
  )
);
```

### 2. Translation Files

**Directory:** `fe/messages/`

| File | Language |
|------|----------|
| `id.json` | Indonesian |
| `en.json` | English |

Each file contains nested translation keys organized by category:
- `common.*` — UI strings (save, cancel, loading, etc.)
- `auth.*` — authentication
- `validation.*` — validation messages
- `errors.*` — error messages
- `posts.*` — posts
- `products.*` — products
- `wallet.*` — wallet
- `follow.*` — follow
- `chat.*` — chat
- `membership.*` — membership
- `admin.*` — admin
- `notifications.*` — notifications
- `password_strength.*` — password strength
- `change_password.*` — change password form
- `report.*` — report reasons/buttons
- `bottom_nav.*` — bottom navigation
- `language.*` — language switcher
- `home.*` — home page (hero, features, pricing, footer)
- `not_found.*` — 404 page
- `error.*` — error boundary
- `cara_kerja.*` — how it works page

### 3. Translation Hook

**File:** `fe/lib/use-translation.ts`

```typescript
import { useLocale, type Locale } from "./use-locale";
import idMessages from "../messages/id.json";
import enMessages from "../messages/en.json";

type Messages = typeof idMessages;

const messages: Record<Locale, Messages> = {
  id: idMessages,
  en: enMessages,
};

export function useTranslation() {
  const locale = useLocale((state) => state.locale);

  const t = (key: string, ...params: string[]): string => {
    const keys = key.split(".");
    let result: unknown = messages[locale];
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    if (typeof result !== "string") return key;

    // Interpolate {0}, {1}, etc.
    return params.length > 0
      ? params.reduce((acc, p, i) => acc.replace(new RegExp(`\\{${i}\\}`, "g"), p), result)
      : result;
  };

  return { t, locale };
}
```

### 4. API Client Updated

**Modified:** `fe/lib/api.ts`

Added request interceptor to send `Accept-Language` header:

```typescript
api.interceptors.request.use((config) => {
  const locale = useLocale.getState().locale;
  config.headers["Accept-Language"] = locale;
  return config;
});
```

### 5. User Type Updated

**Modified:** `fe/lib/types.ts`

Added `locale` field to User interface.

### 6. Auth Store Updated

**Modified:** `fe/lib/auth.ts`

Sync user locale from API response on fetchMe:

```typescript
if (user.locale) {
  useLocale.getState().setLocale(user.locale as "id" | "en");
}
```

### 7. Language Switcher Component

**File:** `fe/components/language-switcher.tsx`

```typescript
export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  const handleChange = async (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      await api.put("/auth/me", { locale: newLocale });
    } catch {
      // Silently fail - locale is already persisted locally
    }
  };

  return (
    <button
      onClick={() => handleChange(locale === "id" ? "en" : "id")}
      title={locale === "id" ? t("language.switch_to_english") : t("language.switch_to_indonesian")}
    >
      <Globe className="h-4 w-4" />
    </button>
  );
}
```

### 8. Navbar Updated

**Modified:** `fe/components/navbar.tsx`

Added LanguageSwitcher to both desktop and mobile navigation menus. All navigation labels now use translations.

---

## Components Updated for i18n

| Component | Changes |
|----------|---------|
| `theme-toggle.tsx` | title translated |
| `navbar.tsx` | all labels, aria-labels |
| `language-switcher.tsx` | title translated |
| `ui/password-strength.tsx` | all labels |
| `ui/file-upload.tsx` | upload text |
| `ui/pagination.tsx` | aria-labels |
| `ui/load-more.tsx` | button text |
| `ui/scroll-to-top.tsx` | aria-label |
| `toast-container.tsx` | close button |
| `change-password.tsx` | all form labels, messages |
| `bottom-nav.tsx` | nav labels |
| `post-card.tsx` | creator, buy, comments |
| `report-button.tsx` | all labels, buttons |
| `section-error-boundary.tsx` | error message |
| `admin-list.tsx` | search placeholder |

## Admin Pages Updated for i18n

| Page | Changes |
|------|--------|
| `admin/page.tsx` | dashboard title, all labels, toasts |
| `admin/users/page.tsx` | all labels, buttons, dialogs |
| `admin/products/page.tsx` | all labels, buttons, dialogs |
| `admin/settings/page.tsx` | platform settings, QRIS upload |
| `admin/posts/page.tsx` | all labels, buttons, dialogs |
| `admin/withdrawals/page.tsx` | all labels, bulk actions, dialogs |
| `admin/topups/page.tsx` | all labels, bulk actions, dialogs |
| `admin/reports/page.tsx` | all labels, actions, dialogs |
| `admin/kyc/page.tsx` | all labels, buttons, dialogs |
| `admin/donations/page.tsx` | all labels |
| `admin/payments/page.tsx` | all labels, actions |
| `admin/profile/page.tsx` | titles |
| `admin/profit/page.tsx` | profit withdraw, history |
| `admin/promo/page.tsx` | promo & tier labels |

---

## Usage

```tsx
import { useTranslation } from "@/lib/use-translation";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <button>{t("auth.login")}</button>
  );
}
```

With parameters:

```tsx
// Translation: "Minimal {0}"
t("validation.min_amount", "100000")
// Output (id): "Minimal 100000"
// Output (en): "Minimum is 100000"
```

---

## Language Detection Priority

1. User's saved preference (from `useLocale` store)
2. If not set, uses default "id" (Indonesian)

Backend also sends `Accept-Language` header, so error messages from API are localized too.

---

## API Endpoints

### Set User Locale

```bash
PUT /api/v1/auth/me
{
  "locale": "en"
}
```

### Response Headers

All responses include `Content-Language` header.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/use-locale.ts` | New — locale store |
| `lib/use-translation.ts` | New — translation hook |
| `messages/id.json` | Modified — added home, not_found, error, cara_kerja translations |
| `messages/en.json` | Modified — added home, not_found, error, cara_kerja translations |
| `lib/types.ts` | Modified — added locale field |
| `lib/api.ts` | Modified — Accept-Language header |
| `lib/auth.ts` | Modified — sync locale |
| `components/language-switcher.tsx` | New — language toggle |
| `components/navbar.tsx` | Modified — added switcher |
| `components/theme-toggle.tsx` | Modified — i18n |
| `components/change-password.tsx` | Modified — i18n |
| `components/post-card.tsx` | Modified — i18n |
| `components/report-button.tsx` | Modified — i18n |
| `components/section-error-boundary.tsx` | Modified — i18n |
| `components/bottom-nav.tsx` | Modified — i18n |
| `components/toast-container.tsx` | Modified — i18n |
| `components/admin-list.tsx` | Modified — i18n |
| `components/ui/password-strength.tsx` | Modified — i18n |
| `components/ui/file-upload.tsx` | Modified — i18n |
| `components/ui/pagination.tsx` | Modified — i18n |
| `components/ui/load-more.tsx` | Modified — i18n |
| `components/ui/scroll-to-top.tsx` | Modified — i18n |
| `app/admin/page.tsx` | Modified — i18n |
| `app/admin/users/page.tsx` | Modified — i18n |
| `app/admin/products/page.tsx` | Modified — i18n |
| `app/admin/settings/page.tsx` | Modified — i18n |
| `app/admin/posts/page.tsx` | Modified — i18n |
| `app/admin/withdrawals/page.tsx` | Modified — i18n |
| `app/admin/topups/page.tsx` | Modified — i18n |
| `app/admin/reports/page.tsx` | Modified — i18n |
| `app/admin/kyc/page.tsx` | Modified — i18n |
| `app/admin/donations/page.tsx` | Modified — i18n |
| `app/admin/payments/page.tsx` | Modified — i18n |
| `app/admin/profile/page.tsx` | Modified — i18n |
| `app/admin/profit/page.tsx` | Modified — i18n |
| `app/admin/promo/page.tsx` | Modified — i18n |
| `app/admin/users/[id]/page.tsx` | Modified — i18n |
| `app/admin/layout.tsx` | Modified — i18n sidebar navigation |
| `app/c/[slug]/page.tsx` | Modified — i18n creator page |
| `app/page.tsx` | Modified — i18n (hero, features, pricing, footer) |
| `app/not-found.tsx` | Modified — i18n |
| `app/error.tsx` | Modified — i18n |
| `app/providers.tsx` | Modified — uses translated error message |
| `app/cara-kerja/page.tsx` | Modified — i18n |
| `app/layout.tsx` | Modified — dynamic lang, metadata from middleware |
| `components/skip-link.tsx` | New — i18n skip link |
| `middleware.ts` | Modified — sets x-locale header |

---

## Notes

- Default language is Indonesian (`id`)
- Supported: `id`, `en`
- Locale persisted to localStorage (survives refresh)
- Syncs to backend on language change and on fetchMe
- All string literals moved to translation files
- No hardcoded strings in components

---

## Testing

```bash
cd fe && npm run type-check
cd fe && npm run lint
```

---

## Next Steps

- Add more translation keys as needed
- Add language detection from browser preferences
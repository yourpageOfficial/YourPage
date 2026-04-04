# YourPage Design System v1.1

## 1. Colors (Semantic Tokens)
We define colors by their **function** to ensure consistency across all components and themes.

| Token | Light Mode | Dark Mode | Usage |
|:---|:---|:---|:---|
| **Primary** | `#2563EB` (Blue-600) | `#3B82F6` (Blue-500) | Main CTA, active links |
| **Primary Hover** | `#1D4ED8` (Blue-700) | `#2563EB` (Blue-600) | Hover state for primary buttons |
| **Secondary** | `#FACC15` (Yellow-400) | `#FDE047` (Yellow-300) | Highlights, badges |
| **Surface** | `gray-50` | `gray-800/50` | Background for cards/panels |
| **Destructive** | `#EF4444` (Red-500) | `#F87171` (Red-400) | Error text, delete buttons |
| **Destructive Surface**| `Red-50` | `Red-900/20` | Confirm dialog backgrounds |
| **Skeleton** | `gray-200` | `gray-700` | Shimmer/loading states |
| **Border** | `gray-300` | `gray-600` | Inputs, cards, dividers |

---

## 2. Typography Hierarchy (Mobile-First)
* **Page Title:** `text-xl sm:text-2xl font-bold tracking-tight`
* **Section Title:** `text-base sm:text-lg font-semibold`
* **Body:** `text-sm leading-relaxed (1.625)` — *Ensures readability for long bios/articles.*
* **Data/Numbers:** `font-variant-numeric: tabular-nums` — *Prevents "jumping" layout when balances or charts update.*
* **Caption/Helper:** `text-xs text-gray-500 dark:text-gray-400`

---

## 3. New Core Components

### `<EmptyState />`
Used in Sales/Donation menus when no data is available to prevent a "blank screen" experience.
* **Props:** `title`, `description`, `icon`, `action` (optional button).

### `<LoadingOverlay />`
Used for long-running mutations (e.g., uploading 500MB videos).
* **Standard:** Frosted glass background + Spinner + Progress percentage indicator.

### `<CopyButton />`
A standardized button for sharing profile links.
* **Behavior:** Replaces the icon with a "Check" mark for 2 seconds after a successful copy.

---

## 4. Form & Validation Standards

* **Helper Text:** Use `text-xs mt-1` below inputs for specific instructions (e.g., *"PNG/JPG max 2MB"*).
* **Dirty State Tracking:** Implement a "Unsaved Changes" warning modal if a user attempts to navigate away while a form is modified but not saved.
* **Button Loading State:** Save buttons **must** be `disabled` and show a `spinner` during `mutation.isPending`.

---

## 5. File Upload & Security

* **Pre-upload Validation:** Perform client-side checks for `fileSize` and `fileType` to save server bandwidth.
* **Aspect Ratio Previews:** * **Avatar:** `aspect-square` (1:1)
    * **Banner:** `aspect-[3/1]` (to match the final public view).

---

## 6. Feedback & Micro-interactions

* **Haptic Feedback:** Use `navigator.vibrate(10)` on donation buttons for a premium "tactile" feel on mobile/PWA.
* **Toasts:** ALWAYS use `toast.success()` or `toast.error()` for mutations. Never use inline error text for transient actions.
* **Tactile Buttons:** Apply `active:scale-[0.98]` to all buttons for instant physical feedback.

---

## 7. Mutation Pattern (Standardized)

```tsx
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const mutation = useMutation({
  mutationFn: (data) => api.post("/endpoint", data),
  onSuccess: () => {
    toast.success("Changes saved successfully!");
    queryClient.invalidateQueries({ queryKey: ["key"] });
  },
  onError: (err: any) => toast.error(err.response?.data?.error || "Failed to save"),
});

// UI Implementation
<Button 
  onClick={() => mutation.mutate(formData)} 
  disabled={mutation.isPending}
>
  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {mutation.isPending ? "Saving..." : "Save Changes"}
</Button>
```

## 8. Layout & Breakpoints

* **Mobile (< 640px):** Sidebar hidden, Bottom Navigation visible.
* **Tablet (640px - 1024px):** Mini/Collapsed Sidebar.
* **Desktop (> 1024px):** Fully expanded Sidebar (`w-56`).
* **Navbar:** Fixed height `h-14` (mobile) to `h-16` (desktop).

---

## 9. Dark Mode Strategy
* **Provider:** Use `next-themes` with `class` strategy.
* **Smooth Transition:** Apply `transition-colors duration-200` to the `body` element to avoid jarring theme switches.
* **Persistence:** Store preference in `localStorage` and auto-detect system preference on the first visit.

## 10. Frontend Implementation (Next.js 14+)

The goal is to use **Middleware-based routing** (e.g., `yourpage.com/en/...`) to handle static text translations.

### A. Core Configuration (`next-intl`)
Install `next-intl` to handle the App Router integration.

**Directory Structure:**
```text
fe/
├── messages/
│   ├── en.json       // English strings
│   └── id.json       // Indonesian strings
├── src/
│   ├── i18n.ts       // Request configuration
│   ├── middleware.ts // Routing logic
│   └── app/[locale]/ // Dynamic locale segment
```

**Example `en.json`:**
```json
{
  "Auth": {
    "login": "Sign In",
    "register": "Create Account"
  },
  "Profile": {
    "save_success": "Profile updated!",
    "unsaved_changes": "You have unsaved changes."
  }
}
```

### B. Usage in Components
Use the `useTranslations` hook for Client Components or `getTranslations` for Server Components.

```tsx
import { useTranslations } from 'next-intl';

export default function ProfileHeader() {
  const t = useTranslations('Profile');
  
  return (
    <h1 className="text-xl font-bold">
      {t('save_success')}
    </h1>
  );
}
```

---

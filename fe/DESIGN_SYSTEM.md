# YourPage Design System

## Colors
- Primary: `#2563EB` (Blue-600) — CTA, links, active states
- Secondary: `#FACC15` (Yellow-400) — highlights, badges
- Background: `white` / `dark:gray-900`
- Surface: `gray-50` / `dark:gray-800/50`
- Border: `gray-300` / `dark:gray-600`
- Text: `gray-900` / `dark:gray-100`
- Text muted: `gray-500` / `dark:gray-400`

## Typography
- Page title: `text-xl sm:text-2xl font-bold`
- Section title: `text-base sm:text-lg font-semibold`
- Body: `text-sm`
- Caption: `text-xs text-gray-500 dark:text-gray-400`
- Label: `text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300`

## Spacing
- Page padding: `px-3 sm:px-4 py-6 sm:py-8`
- Card padding: `p-4 sm:p-6`
- Section gap: `space-y-3 sm:space-y-4`
- Item list gap: `space-y-2 sm:space-y-3`

## Components

### Button
- Sizes: `sm` (h-8/h-9), `default` (h-10), `lg` (h-11/h-12), `icon` (h-9/h-10)
- Variants: `default`, `outline`, `ghost`, `destructive`, `secondary`
- All have `active:scale-[0.98]` for tactile feedback
- All have dark mode variants

### Input / Textarea / Select
- Height: `h-10`
- Border: `rounded-lg border-gray-300 dark:border-gray-600`
- Background: `bg-white dark:bg-gray-800`
- Focus: `ring-2 ring-primary`
- Use `<FormField label="...">` wrapper for labels

### Card
- Border: `rounded-lg border dark:border-gray-700`
- Background: `bg-white dark:bg-gray-800`
- Shadow: `shadow-sm`

### Badge
- Default: `bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300`
- Use `statusColors` from standards.tsx for status badges
- Use `roleColors` for role badges

### File Upload
- Use `<FileUpload>` component
- Single: dashed border drop zone with preview
- Multiple: button + file list with remove

### Status Colors (standard)
Import from `@/components/ui/standards`:
- pending: yellow
- paid/approved/processed/resolved/published: green
- failed/rejected: red
- expired/dismissed/draft: gray
- refunded: purple

## Layout
- Navbar: `h-14 sm:h-16`
- Bottom nav (mobile): `h-14`, hidden on `sm:`
- Sidebar: `w-56`, hidden on mobile (MobileSidebar)
- Content padding: `p-4 md:p-6`
- Max width: pages use layout constraint, no individual `max-w-*`

## Dark Mode
- Toggle: `<ThemeToggle>` in navbar
- Strategy: `class` on `<html>`
- Persist: localStorage `theme`
- Auto-detect: system preference
- No flash: inline script in `<head>`

## Toast Notifications (Standard)
Import from `@/lib/toast`:
```tsx
import { toast } from "@/lib/toast";

// After success:
toast.success("Berhasil disimpan!");

// After error:
toast.error("Gagal menyimpan");

// Info:
toast.info("Sedang memproses...");
```

Rules:
- ALWAYS use toast for success/error feedback
- NEVER use inline `{error && <p>...}` for mutation results
- Toast auto-dismiss 4 seconds
- Colors: green (success), red (error), blue (info)
- Dark mode supported
- Position: top-right, below navbar

## Mutation Pattern (Standard)
```tsx
import { toast } from "@/lib/toast";

const mutation = useMutation({
  mutationFn: () => api.post("/endpoint", data),
  onSuccess: () => {
    toast.success("Berhasil!");
    qc.invalidateQueries({ queryKey: ["key"] });
  },
  onError: (err: any) => toast.error(err.response?.data?.error || "Gagal"),
});
```

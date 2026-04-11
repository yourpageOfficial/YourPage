# Batch 6: Frontend Testing
> Pastikan UI tidak break setiap kali ada perubahan

**Status**: ✅ Selesai (11 Apr 2026) — Infrastructure setup, skip E2E (phase 2)
**Priority**: HIGH
**Dependency**: FE Batch 1 (komponen harus selesai dulu baru di-test)
**Estimasi Files**: ~25 file test baru

---

## 6.1 Test Infrastructure Setup

### Install Dependencies
- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [ ] `npm install -D @vitejs/plugin-react jsdom`
- [ ] `npm install -D msw` (Mock Service Worker — API mocking)
- [ ] `npm install -D @playwright/test` (E2E tests — optional phase 2)

### Config Files
- [ ] Buat `/fe/vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      globals: true,
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') }
    }
  })
  ```

- [ ] Buat `/fe/tests/setup.ts`:
  ```ts
  import '@testing-library/jest-dom'
  ```

- [ ] Tambah scripts di `package.json`:
  ```json
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
  ```

### MSW (Mock API)
- [ ] Buat `/fe/tests/mocks/handlers.ts` — mock API responses
- [ ] Buat `/fe/tests/mocks/server.ts` — MSW server setup
- [ ] Mock endpoints: /auth/me, /feed, /creators, /posts, /wallet, etc.

---

## 6.2 Component Tests — UI Components (Batch 1 components)

### `/fe/tests/components/`

#### Core Components
- [ ] `button.test.tsx`:
  - Render semua variants (default, secondary, outline, ghost, destructive)
  - Loading state: spinner visible, button disabled
  - Icon left/right slots rendered
  - Click handler fired
  - Disabled state: click not fired

- [ ] `input.test.tsx`:
  - Default render
  - Error state: red ring, error message visible
  - Success state: green ring
  - Icon left/right rendered
  - Disabled state
  - Placeholder text

- [ ] `badge.test.tsx`:
  - All color variants (success, error, warning, info)
  - Dot indicator visible when prop set
  - Outline variant

- [ ] `card.test.tsx`:
  - Default render
  - Hover variant: has hover classes
  - Clickable variant: cursor-pointer, click handler

- [ ] `skeleton.test.tsx`:
  - TableSkeleton: correct number of rows
  - ProfileSkeleton: avatar + text lines
  - ChartSkeleton: renders placeholder

#### New Components (Batch 1)
- [ ] `avatar.test.tsx`:
  - Image loads: show image
  - Image fails: show initials fallback
  - Size variants: sm/md/lg/xl
  - Online indicator visible when set

- [ ] `tabs.test.tsx`:
  - Render all tabs
  - Click tab: content switches
  - Active tab: underline visible
  - Badge count displayed
  - Keyboard: arrow keys switch tabs

- [ ] `pagination.test.tsx`:
  - Render page numbers
  - Click page: callback fired
  - Prev/next buttons
  - Disabled on first/last page

- [ ] `tooltip.test.tsx`:
  - Hover trigger: tooltip visible
  - Unhover: tooltip hidden
  - Content rendered correctly

- [ ] `alert.test.tsx`:
  - All variants: info, success, warning, error
  - Dismissible: X button closes
  - Icon per variant

- [ ] `step-indicator.test.tsx`:
  - Render steps
  - Active step highlighted
  - Done step shows checkmark
  - Pending step muted

- [ ] `scroll-to-top.test.tsx`:
  - Hidden on initial render
  - Visible after scroll (mock scroll event)
  - Click: scroll to top called

- [ ] `password-strength.test.tsx`:
  - Weak password: red bar
  - Medium password: yellow bar
  - Strong password: green bar
  - Rules checklist updates

- [ ] `character-count.test.tsx`:
  - Shows count "0/500"
  - Warning color at 90%+
  - Error color at 100%

- [ ] `infinite-scroll.test.tsx`:
  - Calls onLoadMore when sentinel visible
  - Shows loading spinner
  - Shows end message when no more

- [ ] `confirm-dialog.test.tsx`:
  - Opens on trigger
  - Closes on cancel
  - Calls onConfirm on confirm
  - Loading state on confirm button

- [ ] `page-transition.test.tsx`:
  - Renders children
  - Has animation wrapper

---

## 6.3 Hook Tests

### `/fe/tests/hooks/`
- [ ] `use-action.test.ts`:
  - Calls API, returns data
  - Shows toast on success
  - Shows toast on error
  - Loading state during request

- [ ] `use-debounce.test.ts`:
  - Returns debounced value after delay
  - Cancels previous timeout on new value

- [ ] `use-bulk-select.test.ts`:
  - Select single item
  - Select all
  - Deselect
  - Get selected IDs

---

## 6.4 Page Tests — Critical Flows

### `/fe/tests/pages/`

- [ ] `login.test.tsx`:
  - Renders form
  - Submit with valid data: API called
  - Submit with empty: validation errors shown
  - Loading state on submit
  - Error from API: error message displayed

- [ ] `register.test.tsx`:
  - Renders form with role selector
  - Password strength indicator updates
  - Submit: API called with correct data
  - Validation errors inline

- [ ] `dashboard.test.tsx`:
  - Renders stats cards (mock data)
  - Renders chart
  - Empty state when no data

- [ ] `feed.test.tsx`:
  - Renders post cards (mock data)
  - Empty state when no posts
  - Infinite scroll triggers load more

- [ ] `creator-page.test.tsx`:
  - Renders creator profile
  - Tabs switch content
  - Follow button toggles

---

## 6.5 E2E Tests (Phase 2 — Playwright)

### Setup
- [ ] `npx playwright install`
- [ ] Buat `/fe/e2e/` directory
- [ ] `playwright.config.ts`

### Critical User Flows
- [ ] `auth.spec.ts`: Register → Verify → Login → Dashboard
- [ ] `purchase.spec.ts`: Browse → Buy Post → Check Library
- [ ] `donation.spec.ts`: Visit Creator → Donate → Check Wallet
- [ ] `creator.spec.ts`: Create Post → View → Edit → Delete
- [ ] `admin.spec.ts`: Login Admin → Approve Topup → Check User Wallet

### **Recommendation**: E2E adalah phase 2. Fokus component + hook tests dulu.

---

## Checklist Selesai
- [ ] Vitest configured and running
- [ ] MSW mock API setup
- [ ] Component tests: 15+ files, semua Batch 1 components covered
- [ ] Hook tests: 3 files
- [ ] Page tests: 5 critical pages
- [ ] `npm run test:run` ALL PASS
- [ ] Coverage: 60%+ components, 50%+ overall
- [ ] No flaky tests

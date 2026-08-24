# FE Testing Plan — Batch 14

**Tanggal:** 11 April 2026
**Status:** Plan only — belum diimplementasi

---

## Priority 1: E2E Tests (Playwright)

### Critical Flows
1. **Login** — email + password → redirect to dashboard
2. **Register** — form validation, role selection, redirect to welcome
3. **Checkout Post** — buy paid post → credit deducted → content unlocked
4. **Checkout Donation** — send donation → success state
5. **Top-up** — select amount → upload proof → pending state
6. **Withdrawal** — fill form → submit → pending card appears

### Setup
```bash
npm install -D @playwright/test
npx playwright install
```

### Example test structure
```
fe/tests/
  e2e/
    auth.spec.ts        # login, register, logout
    checkout.spec.ts    # post purchase, donation
    wallet.spec.ts      # topup, withdrawal
    dashboard.spec.ts   # navigation, data display
```

---

## Priority 2: Component Tests (Vitest + React Testing Library)

### Critical Components
1. `PostCard` — locked/unlocked state, buy button, like/comment
2. `Input` — error state, icon rendering
3. `Button` — loading state, disabled state
4. `SidebarNav` — active state, grouping
5. `Tabs` — compound API, switching

### Setup
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## Priority 3: Unit Tests (Vitest)

### Utility Functions
1. `formatCredit` — various amounts
2. `formatIDR` — formatting
3. `formatDate` — date formatting
4. `cn` — class merging

---

## Estimated Effort
- E2E setup + 6 tests: ~4 hours
- Component tests (5): ~2 hours
- Unit tests: ~1 hour
- **Total: ~7 hours**

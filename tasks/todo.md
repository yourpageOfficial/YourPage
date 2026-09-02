# Task List: YourPage Platform Implementation

**Plan Document:** [`tasks/plan.md`](./plan.md)  
**Status:** In Progress 🚀

---

## Phase 1: Security, Financial Integrity & Core Backend

### Task 1: Fix Members-Only Access Gating & Private Media Pre-signing
**Description:** Refactor `applyLockBatch` in `be/internal/service/post.go` so that members-only gating and `HasLiked` attribution are evaluated unconditionally even if `paidIDs` is empty. Ensure `signPaidMedia` and `product.go` download handlers canonicalize MinIO object paths without duplicate `/storage/` prefixes.

**Acceptance criteria:**
- [x] Non-members viewing posts with `visibility = "members"` have `post.IsLocked = true` and `post.Content` stripped.
- [x] Active members or the post creator receive full post content and valid 15-minute pre-signed URLs for private media.
- [x] Digital product download endpoint returns valid pre-signed URL resolving without 404/403 errors.
- [x] `HasLiked` batch attribution works accurately for all post visibility types.

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestPostService" ./internal/service/...`
- [x] Build succeeds: `cd be && go build ./cmd/api`
- [x] Manual check: Request members-only post with authenticated non-member token and verify `content: ""` and `is_locked: true`.

**Dependencies:** None  
**Files likely touched:**
- `be/internal/service/post.go`
- `be/internal/service/product.go`
- `be/internal/pkg/storage/minio.go`
- `be/internal/service/post_test.go`

**Estimated scope:** Medium (3-4 files)

---

### Task 2: Database Transaction Atomicity for Wallet & Checkout
**Description:** Wrap multi-step financial operations in `payWithCredits` (`be/internal/service/payment.go`) and paid DM message handling (`be/internal/service/chat.go`) within unified `db.Transaction` blocks to guarantee ACID atomicity across wallet deduction, payment record creation, purchase record creation, creator credit addition, and audit log generation.

**Acceptance criteria:**
- [x] Wallet debit, creator credit increment, and purchase records succeed or fail together as a single atomic unit.
- [x] Any failure rolls back all database mutations cleanly without orphaned payments or desynced balances.
- [x] Database constraint `CHECK (balance_credits >= 0)` is strictly honored under concurrent requests.

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestPaymentService" ./internal/service/...`
- [x] Build succeeds: `cd be && go build ./cmd/api`
- [x] Manual check: Attempt checkout with insufficient balance and confirm zero partial records are created.

**Dependencies:** Task 1  
**Files likely touched:**
- `be/internal/service/payment.go`
- `be/internal/service/chat.go`
- `be/internal/repository/postgres/wallet.go`
- `be/internal/service/payment_test.go`

**Estimated scope:** Medium (3-4 files)

---

### Task 3: KYC Document Privacy & Admin Presigned View Endpoints
**Description:** Isolate all uploaded KYC identity documents (KTP/ID cards) strictly into MinIO's `private-media` bucket. Implement authenticated admin handler endpoints to generate short-lived (5-minute) pre-signed URLs for KYC review, ensuring PII is never exposed over public storage endpoints.

**Acceptance criteria:**
- [x] KYC uploads are stored exclusively under `kyc/{user_id}/{filename}` in `private-media` bucket.
- [x] Direct unauthenticated HTTP access to KYC files returns 403 Forbidden.
- [x] Admin KYC listing and detail endpoints return time-limited pre-signed URLs for legitimate verification.

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestKYC" ./internal/handler/...`
- [x] Build succeeds: `cd be && go build ./cmd/api`
- [x] Manual check: Inspect KYC image URL returned to admin and confirm signature query parameters are present.

**Dependencies:** Task 1  
**Files likely touched:**
- `be/internal/handler/kyc.go`
- `be/internal/service/admin.go`
- `be/internal/handler/admin.go`
- `fe/app/dashboard/kyc/page.tsx`
- `fe/app/admin/kyc/page.tsx`

**Estimated scope:** Medium (4-5 files)

---

### Task 4: CreditTransaction Audit Ledger Completion for Chat & Referral Rewards
**Description:** Ensure every balance change in the system generates a corresponding `CreditTransaction` audit record with descriptive types (`spend`, `earning`, `referral_reward`), ensuring total auditability in `/wallet` and `/admin/profit`.

**Acceptance criteria:**
- [x] Paid DM chat deducts credits with a `spend` audit record and credits the recipient creator with an `earning` audit record.
- [x] Referral reward distributions insert `referral_reward` audit rows for both referrer and referee.
- [x] Transaction history API (`GET /api/v1/wallet/transactions`) displays exact matching ledger entries.

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestChat|TestAuth" ./internal/service/...`
- [x] Build succeeds: `cd be && go build ./cmd/api`
- [x] Manual check: Send a paid chat message and check `/wallet` transaction history for both sender and receiver.

**Dependencies:** Task 2  
**Files likely touched:**
- `be/internal/service/chat.go`
- `be/internal/service/auth.go`
- `be/internal/service/payment.go`
- `fe/app/wallet/page.tsx`

**Estimated scope:** Small (3-4 files)

---

### Task 5: Schema Hygiene & Missing Composite Indexes Migration
**Description:** Execute cleanup migration `0048_schema_cleanup.sql` to drop duplicate indexes (`idx_creator_profiles_slug`, `idx_follows_creator`, `idx_chat_messages_conv`), establish missing composite indexes (`idx_memberships_creator_status`, `idx_memberships_status_expires`), add FK index `idx_posts_membership_tier`, standardize timestamps to `TIMESTAMPTZ`, and verify full `-- +goose Down` rollback capability.

**Acceptance criteria:**
- [x] Duplicate indexes are dropped from Postgres catalog.
- [x] Composite indexes `idx_memberships_creator_status` and `idx_memberships_status_expires` exist.
- [x] All date/time columns across `users` and `product_downloads` use `TIMESTAMPTZ`.
- [x] `goose up` and `goose down` run cleanly without syntax errors.

**Verification:**
- [x] Migration succeeds: `cd be && go build ./cmd/migrate`
- [x] Manual check: Run `\d memberships` and `\d users` in PostgreSQL to inspect index and column definitions.

**Dependencies:** None  
**Files likely touched:**
- `be/migrations/0048_schema_cleanup.sql`
- `be/migrations/0045_performance_indexes.sql`
- `be/migrations/0046_account_management.sql`
- `be/migrations/0047_product_downloads.sql`

**Estimated scope:** Small (3-4 files)

---

### 🛑 Checkpoint 1: Core Integrity
- [x] All Go unit tests pass: `cd be && go test -count=1 ./...`
- [x] Backend builds without warnings: `cd be && go build ./cmd/api`
- [x] Zero database transaction anomalies or orphaned payment records during test scenarios.
- [x] KYC files are fully secured in private MinIO storage.

---

## Phase 2: Advanced Authentication, OAuth & Identity Security

### Task 6: OAuth2 Social Sign-In: Google & Facebook Login Integration
**Description:** Implement federated OAuth2 social authentication for Google and Facebook. Create migration `0063_oauth_accounts.sql` (`user_oauth_accounts` table), backend endpoints `GET /api/v1/auth/oauth/:provider/url` (with Redis-backed CSRF state nonce) and `POST /api/v1/auth/oauth/:provider/callback` (token exchange, account matching/linking by verified email, and JWT cookie issuance). Add "Masuk dengan Google" and "Masuk dengan Facebook" buttons on `/login` and `/register` with callback router `/auth/callback/[provider]`.

**Acceptance criteria:**
- [x] User can sign up and sign in using Google or Facebook with 1-click.
- [x] Existing users logging in via social account with matching verified email are automatically linked without creating duplicate accounts.
- [x] CSRF attack attempts with forged or expired state parameters are rejected with `400 Bad Request`.
- [x] Users can view and manage linked social accounts via `GET /api/v1/auth/oauth/accounts` and unlink via `DELETE /api/v1/auth/oauth/:provider`.

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestOAuth" ./internal/service/...`
- [x] Build succeeds: `cd be && go build ./cmd/api && cd ../fe && npm run build`
- [x] Manual check: Click Google Login on `/login`, authorize via test provider mock, and verify redirection to dashboard with valid cookies.

**Dependencies:** Checkpoint 1  
**Files likely touched:**
- `be/migrations/0063_oauth_accounts.sql`
- `be/internal/entity/user.go`
- `be/internal/service/auth.go`
- `be/internal/handler/auth.go`
- `fe/app/login/page.tsx`
- `fe/app/register/page.tsx`
- `fe/app/auth/callback/[provider]/page.tsx`
- `fe/components/social-auth-buttons.tsx`

**Estimated scope:** Large (6-8 files)

---

### Task 7: Password History & Security Policy Enforcement
**Description:** Implement password history retention to prevent credential reuse and enforce enterprise password security policies. Create migration `0050_password_histories.sql` (`password_histories` table). In `change-password` and `reset-password`, compare the new candidate password against the user's last 5 hashed passwords using `bcrypt.CompareHashAndPassword`. Reject if previously used, record the new hash in history, and auto-prune records beyond the 5 most recent. Add password strength meter UI.

**Acceptance criteria:**
- [x] Changing password to any of the previous 5 passwords returns `400 Bad Request: "Kata sandi telah digunakan sebelumnya"`.
- [x] Successfully changing password inserts a new `password_histories` entry and automatically removes records older than the 5th entry.
- [x] Password reset via email also enforces the 5-password history restriction.
- [x] Settings and reset pages feature an interactive password strength indicator (length, numbers, uppercase, symbols).

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestPasswordHistory" ./internal/service/...`
- [x] Build succeeds: `cd be && go build ./cmd/api`
- [x] Manual check: Change password twice with same password; verify second attempt is blocked.

**Dependencies:** Task 6  
**Files likely touched:**
- `be/migrations/0050_password_histories.sql`
- `be/internal/entity/user.go`
- `be/internal/service/auth.go`
- `be/internal/handler/auth.go`
- `fe/app/s/settings/page.tsx`
- `fe/app/reset-password/page.tsx`
- `fe/components/password-strength-meter.tsx`

**Estimated scope:** Medium (5 files)

---

### Task 8: Two-Factor Authentication (2FA / TOTP) with Emergency Backup Codes
**Description:** Implement RFC 6238 Time-based One-Time Password (TOTP) two-factor authentication. Create migration `0052_2fa.sql` (`two_fa_enabled` column). Add endpoints in service and handlers supporting 2FA challenge flow during login (`POST /api/v1/auth/login`).

**Acceptance criteria:**
- [x] 2FA status tracked in database (`two_fa_enabled` column via migration `0052_2fa.sql`).
- [x] When 2FA is active, `POST /auth/login` returns `requires_2fa: true` and a temporary challenge token.
- [x] Session cookies are only issued upon valid OTP verification via `LoginWithTwoFA`.
- [x] Frontend `LoginPage` dynamically handles 2FA challenge step and OTP entry.

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestChat|TestOAuth|TestPasswordHistory" ./internal/service/...`
- [x] Build succeeds: `cd be && go build ./cmd/api && cd ../fe && npm run build`
- [x] Manual check: Enable 2FA in settings, log out, log in with password + OTP code, and verify dashboard access.

**Dependencies:** Task 6, Task 7  
**Files likely touched:**
- `be/migrations/0052_2fa.sql`
- `be/internal/entity/user.go`
- `be/internal/service/auth.go`
- `be/internal/handler/auth.go`
- `fe/app/login/page.tsx`


**Estimated scope:** Large (6-7 files)

---

### Task 9: Active Device & Session Management with Remote Revocation
**Description:** Implement active session and device tracking with remote revocation. Create migration `0052_user_sessions.sql` (`user_sessions` table with user agent, device name, IP address, approximate location, last active timestamp, refresh token ID). Add endpoints `GET /api/v1/auth/sessions` (list active devices), `DELETE /api/v1/auth/sessions/:id` (revoke specific session), and `POST /api/v1/auth/sessions/revoke-others` (log out all other devices by blacklisting tokens in Redis).

**Acceptance criteria:**
- [ ] Login and token refresh operations record device metadata (browser, OS, IP, last active).
- [ ] User can view list of all currently logged-in devices with "Sesi Ini" badge.
- [ ] Revoking a session immediately invalidates that device's refresh token in Redis and removes the session record.
- [ ] Clicking "Keluar dari Semua Perangkat Lain" terminates all other sessions while keeping the current session active.

**Verification:**
- [ ] Tests pass: `cd be && go test -v -run "TestSessions" ./internal/service/...`
- [ ] Build succeeds: `cd be && go build ./cmd/api`
- [ ] Manual check: Log in on two browsers, revoke browser B from browser A, and verify browser B is logged out on next refresh.

**Dependencies:** Task 8  
**Files likely touched:**
- `be/migrations/0052_user_sessions.sql`
- `be/internal/entity/user.go`
- `be/internal/service/auth.go`
- `be/internal/handler/auth.go`
- `fe/app/s/settings/page.tsx`
- `fe/components/session-manager.tsx`

**Estimated scope:** Medium (5 files)

---

### Task 10: Magic Link Passwordless Sign-In & Suspicious Activity Alerts
**Description:** Implement passwordless login via email magic link and suspicious activity detection. Add endpoint `POST /api/v1/auth/magic-link` (generates 15-minute single-use signed token sent via email) and `GET /api/v1/auth/magic-link/verify` (authenticates and issues cookies). Implement new device/IP detection on login to trigger automated security alert emails ("Login dari Perangkat Baru Terdeteksi") with instant session kill links.

**Acceptance criteria:**
- [x] User can enter email on `/login` and receive a one-time magic sign-in link.
- [x] Clicking the magic link authenticates the user directly and redirects to dashboard.
- [x] Magic links expire after 15 minutes and cannot be reused.
- [x] Login from an unrecognized IP/device sends a security notification email with device details and "Amankan Akun" action.

**Verification:**
- [x] Tests pass: `cd be && go test -v -run "TestMagicLink|TestSecurityAlert" ./internal/service/...`
- [x] Build succeeds: `cd be && go build ./cmd/api && cd ../fe && npm run build`
- [x] Manual check: Request magic link, verify token creation in logs/test-inbox, and authenticate via callback.

**Dependencies:** Task 8, Task 9  
**Files likely touched:**
- `be/internal/service/auth.go`
- `be/internal/handler/auth.go`
- `be/internal/pkg/mailer/mailer.go`
- `fe/app/login/page.tsx`
- `fe/app/auth/magic-link/page.tsx`

**Estimated scope:** Medium (5 files)

---

### 🛑 Checkpoint 2: Advanced Auth & Identity Security
- [ ] All new auth migrations (`0049`, `0050`, `0051`, `0052`) run cleanly in PostgreSQL.
- [ ] Google & Facebook OAuth login flows work end-to-end with CSRF protection.
- [ ] Password history rejects previous 5 passwords on change and reset.
- [ ] TOTP 2FA setup, backup codes, and login challenge function flawlessly.
- [ ] Active device sessions and remote revocation verify in real-time.
- [ ] Backend test suite for auth passes 100%: `cd be && go test -v ./internal/service/...`

---

## Phase 3: Frontend UX, Accessibility & OBS Isolation

### Task 11: OBS Overlay Isolation & Global Popup Suppression
**Description:** Prevent cookie consent banners, PWA install prompts, and navigation chrome from rendering on `/overlay` routes so that OBS Studio browser sources stay completely transparent and uncontaminated during live broadcasts.

**Acceptance criteria:**
- [ ] Visiting `/overlay` never renders `<CookieConsent />` or `<InstallPrompt />`.
- [ ] OBS overlay background remains transparent (`rgba(0,0,0,0)`).
- [ ] Animation alerts (bounce, slide, fade, spin) and sound alerts play smoothly on incoming donations.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Open `http://localhost:3000/overlay?id=test` and confirm zero banners/prompts are visible in DOM.

**Dependencies:** Checkpoint 2  
**Files likely touched:**
- `fe/components/cookie-consent.tsx`
- `fe/components/install-prompt.tsx`
- `fe/app/overlay/page.tsx`
- `fe/app/layout.tsx`

**Estimated scope:** Small (3 files)

---

### Task 12: WCAG 2.1 AA Accessibility Overhaul: Form Labels, Skip Links & Focus Rings
**Description:** Connect all form `<label>` elements to their inputs with explicit `htmlFor` and `id` attributes across auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`). Refactor the skip-to-main-content link in `layout.tsx` to use Tailwind accessible focus styles (`sr-only focus:not-sr-only focus:fixed`). Add descriptive `aria-label`s to all icon-only buttons.

**Acceptance criteria:**
- [ ] Clicking any form input label focuses the corresponding input field.
- [ ] Screen readers announce form control labels accurately.
- [ ] Keyboard Tab navigation displays visible skip link at top-left of the viewport.
- [ ] Modal close buttons (`<X />`) and icon buttons possess localized `aria-label` attributes.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Lint succeeds: `cd fe && npm run lint`
- [ ] Manual check: Tab through `/login` using keyboard only; verify focus rings and label clicks.

**Dependencies:** None  
**Files likely touched:**
- `fe/app/layout.tsx`
- `fe/app/login/page.tsx`
- `fe/app/register/page.tsx`
- `fe/app/forgot-password/page.tsx`
- `fe/app/reset-password/page.tsx`
- `fe/components/post-card.tsx`

**Estimated scope:** Medium (5 files)

---

### Task 13: SPA Navigation Polish: Replace `window.location.href` with Next.js `<Link>`
**Description:** Replace imperative `window.location.href = ...` triggers inside card click handlers with semantic Next.js `<Link href="...">` wrappers or `router.push()` across admin and creator dashboard lists to enable smooth client-side routing, instant prefetching, and middle-click new tab support.

**Acceptance criteria:**
- [ ] Post cards, product cards, and user rows in admin/dashboard use Next.js `<Link>` or `useRouter()`.
- [ ] Middle-click and Cmd+click ("Open in new tab") work as expected on clickable cards.
- [ ] Page navigation occurs without full-page white flashes or document reloads.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Lint succeeds: `cd fe && npm run lint`
- [ ] Manual check: Navigate between `/dashboard/posts` and post edit screen; verify instant SPA transition.

**Dependencies:** None  
**Files likely touched:**
- `fe/app/dashboard/posts/page.tsx`
- `fe/app/dashboard/products/page.tsx`
- `fe/app/admin/users/page.tsx`
- `fe/app/admin/promo/page.tsx`
- `fe/lib/auth.ts`

**Estimated scope:** Medium (4-5 files)

---

### Task 14: Memory Leak & Notification Hygiene: Revoke Blob URLs & Replace `alert()`
**Description:** Ensure all CSV download handlers (`URL.createObjectURL`) explicitly revoke temporary Blob URLs via `URL.revokeObjectURL(url)`. Replace all legacy browser `alert()` popups with themed toast notifications (`toast.error()`, `toast.success()`). Format wallet transaction signs using absolute numbers with type-based indicators.

**Acceptance criteria:**
- [ ] CSV downloads on analytics and payments pages cleanly release browser memory.
- [ ] No native browser `alert()` modal dialogs exist in the frontend codebase.
- [ ] Transaction history displays correct sign notation (`+50 Credit` for topups/earnings, `-5 Credit` for purchases) without `--` double-minus bugs.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Lint succeeds: `cd fe && npm run lint`
- [ ] Manual check: Trigger CSV export and inspect browser console for unhandled errors.

**Dependencies:** None  
**Files likely touched:**
- `fe/app/dashboard/analytics/page.tsx`
- `fe/app/admin/payments/page.tsx`
- `fe/app/wallet/topup/page.tsx`
- `fe/components/post-card.tsx`
- `fe/app/wallet/page.tsx`

**Estimated scope:** Medium (4-5 files)

---

### Task 15: Resolve React 19 / Next.js ESLint Cascading Render Warnings
**Description:** Refactor component state initialization patterns in `register/page.tsx`, `verify-email/page.tsx`, `cookie-consent.tsx`, `navbar.tsx`, `offline-indicator.tsx`, `theme-toggle.tsx`, and `use-reduced-motion.ts` to eliminate synchronous `setState` calls inside `useEffect` bodies, preventing cascading re-renders and satisfying React 19 rules.

**Acceptance criteria:**
- [ ] `npm run lint` completes with **0 errors and 0 warnings**.
- [ ] Initial state values are computed directly during component render or lazy initializers `useState(() => ...)`.
- [ ] No regressions in dark mode toggle, offline banner, or cookie banner functionality.

**Verification:**
- [ ] Lint succeeds: `cd fe && npm run lint`
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Verify theme toggle works on both desktop and mobile views.

**Dependencies:** Task 11, Task 12  
**Files likely touched:**
- `fe/app/register/page.tsx`
- `fe/app/verify-email/page.tsx`
- `fe/components/cookie-consent.tsx`
- `fe/components/navbar.tsx`
- `fe/components/offline-indicator.tsx`
- `fe/components/theme-toggle.tsx`
- `fe/lib/use-reduced-motion.ts`

**Estimated scope:** Medium (5-7 files)

---

### 🛑 Checkpoint 3: Frontend Polish
- [ ] Frontend build succeeds with Turbopack: `cd fe && npm run build`
- [ ] ESLint passes with 0 warnings: `cd fe && npm run lint`
- [ ] `/overlay` runs cleanly without banners or popups.
- [ ] All forms, links, and buttons adhere to WCAG 2.1 AA accessibility guidelines.

---

## Phase 4: Automated Testing & CI/CD Pipeline

### Task 16: GitHub Actions CI/CD Automation
**Description:** Configure complete GitHub Actions automation workflows in `.github/workflows/`: `be-ci.yml` (Go lint, test with PostgreSQL 16/Redis 7 services, build), `fe-ci.yml` (TypeScript strict check, ESLint, Next.js production build), and `deploy.yml` (zero-downtime production deployment with automated migration runner and health check verification).

**Acceptance criteria:**
- [ ] `.github/workflows/be-ci.yml` triggers on backend PRs/pushes and runs `go test -race ./...`.
- [ ] `.github/workflows/fe-ci.yml` triggers on frontend PRs/pushes and runs `npm run lint` & `npm run build`.
- [ ] `.github/workflows/deploy.yml` orchestrates tag-based deployment with health check verification.

**Verification:**
- [ ] Manual check: Validate YAML syntax using `actionlint` or YAML schema validator.
- [ ] Verify workflow path triggers match `be/**` and `fe/**`.

**Dependencies:** Checkpoint 3  
**Files likely touched:**
- `.github/workflows/be-ci.yml`
- `.github/workflows/fe-ci.yml`
- `.github/workflows/deploy.yml`

**Estimated scope:** Small (3 files)

---

### Task 17: Backend Test Coverage Expansion: Auth, OAuth, 2FA, Admin & Webhooks
**Description:** Expand Go automated test suite to achieve $\ge 75\%$ coverage by implementing unit and integration tests for authentication lifecycle, OAuth2 callback simulation, 2FA TOTP verification, session revocation, admin moderation, and payment webhooks (Xendit token and PayPal signature validation with idempotency checks).

**Acceptance criteria:**
- [ ] Auth test validates password history blocking, OAuth token linking, TOTP 2FA challenge, and session revocation.
- [ ] Admin test verifies RBAC permissions, top-up approval, KYC approval, and payout processing.
- [ ] Webhook test verifies signature validation, duplicate event idempotency, and wallet crediting.
- [ ] Total backend test coverage reaches $\ge 75\%$.

**Verification:**
- [ ] Tests pass: `cd be && go test -v -race -coverprofile=coverage.out ./...`
- [ ] Coverage check: `cd be && go tool cover -func=coverage.out | grep total`

**Dependencies:** Task 6, Task 8, Task 9  
**Files likely touched:**
- `be/internal/handler/auth_test.go`
- `be/internal/handler/admin_test.go`
- `be/internal/handler/webhook_test.go`
- `be/internal/testutil/testutil.go`

**Estimated scope:** Medium (4-5 files)

---

### Task 18: Frontend E2E Testing Suite with Playwright
**Description:** Set up Playwright end-to-end testing suite in `fe/tests/e2e/` covering critical user journeys: authentication flow (password, OAuth mock, 2FA prompt), post checkout with credits, tip/donation submission, manual QRIS top-up with proof upload, and creator withdrawal request.

**Acceptance criteria:**
- [ ] Playwright is configured in `fe/playwright.config.ts`.
- [ ] E2E test `auth.spec.ts` covers login, register, 2FA prompt, session listing, and logout.
- [ ] E2E test `checkout.spec.ts` covers paywalled post unlock and instant content reveal.
- [ ] E2E test `wallet.spec.ts` covers top-up submission and withdrawal request creation.

**Verification:**
- [ ] Tests pass: `cd fe && npx playwright test`

**Dependencies:** Task 15  
**Files likely touched:**
- `fe/playwright.config.ts`
- `fe/package.json`
- `fe/tests/e2e/auth.spec.ts`
- `fe/tests/e2e/checkout.spec.ts`
- `fe/tests/e2e/wallet.spec.ts`

**Estimated scope:** Medium (5 files)

---

### Task 19: Automated Database Backup & Disaster Recovery Scripts
**Description:** Create automated database backup and restore scripts in `scripts/`: `backup-db.sh` (compressed `pg_dump` with automated 30-day retention and logging) and `restore-db.sh` (disaster recovery script with schema and table count integrity checks).

**Acceptance criteria:**
- [ ] `scripts/backup-db.sh` generates timestamped `yourpage_backup_YYYYMMDD_HHMMSS.sql.gz` and logs to stdout/file.
- [ ] Automated pruning removes backups older than 30 days.
- [ ] `scripts/restore-db.sh` restores dump into target database and validates table counts.
- [ ] Scripts are executable (`chmod +x`).

**Verification:**
- [ ] Manual check: Run `scripts/backup-db.sh --dry-run` or test against local PostgreSQL container.

**Dependencies:** None  
**Files likely touched:**
- `scripts/backup-db.sh`
- `scripts/restore-db.sh`
- `README.md`

**Estimated scope:** Small (2-3 files)

---

### 🛑 Checkpoint 4: Quality Gates
- [ ] Backend test suite with race detector passes: `cd be && go test -race ./...`
- [ ] Backend test coverage meets or exceeds 75%.
- [ ] Playwright E2E suite passes on all critical flows.
- [ ] CI/CD workflow definitions and backup scripts validated.

---

## Phase 5: Conversion Copywriting & Programmatic SEO

### Task 20: Homepage & Landing Benefit-Driven Copy Overhaul
**Description:** Implement conversion-optimized copywriting across homepage (`fe/app/page.tsx`), header navigation (`fe/components/navbar.tsx`), and footer (`fe/components/footer.tsx`). Shift narrative from technical feature descriptions to creator outcomes (all-in-one link replacing 3 tools, fee savings down to 5%, automated 24/7 digital product delivery). Update hero headline variants, social proof stats (`Rp 0`, `5%`, `2 Menit`, `1x24 Jam`), Bento Grid benefit copy, and action-oriented CTAs.

**Acceptance criteria:**
- [ ] Homepage hero features high-converting headline: *"Terima Donasi, Jual File Digital & Komunitas di Satu Halaman"*.
- [ ] Bento Grid copy converts technical features into creator benefits and passive revenue outcomes.
- [ ] 3-Step timeline emphasizes 2-minute setup, QRIS payment acceptance, and 1x24h bank withdrawals.
- [ ] Primary CTA updated to high-intent button: *"Klaim Link yourpage.id Kamu — Gratis →"*.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Verify homepage rendered text and CTA buttons on desktop and mobile.

**Dependencies:** Checkpoint 3  
**Files likely touched:**
- `fe/app/page.tsx`
- `fe/components/navbar.tsx`
- `fe/components/footer.tsx`

**Estimated scope:** Medium (3 files)

---

### Task 21: Pricing, How-It-Works & Objection-Handling Copy Overhaul
**Description:** Update pricing page (`fe/app/pricing/page.tsx`) and how-it-works page (`fe/app/cara-kerja/page.tsx`) with clear value framing for Free (*Mulai Tanpa Modal*), Pro (*Tumbuh Lebih Cepat & Hemat Fee*), and Business (*Maksimalkan Profit Studio*). Correct legacy domain references (`urpage.online` $\to$ `yourpage.id`), standardize 1x24h payout guarantees, and embed the 4 core objection-handling FAQ answers.

**Acceptance criteria:**
- [ ] `/pricing` displays creator-centric benefits for each plan with no-lock-in Credit reassurance microcopy.
- [ ] `/cara-kerja` removes all `urpage.online` typos and unifies payout timelines to 1x24 hours across all Indonesian banks/e-wallets.
- [ ] FAQ section includes comprehensive answers for zero monthly fees, local QRIS payments, payout schedules, and switching from competitors.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Inspect `/pricing` and `/cara-kerja` in browser.

**Dependencies:** Task 20  
**Files likely touched:**
- `fe/app/pricing/page.tsx`
- `fe/app/cara-kerja/page.tsx`

**Estimated scope:** Small (2 files)

---

### Task 22: Auth, Registration & Onboarding Conversion Polish
**Description:** Refine registration (`fe/app/register/page.tsx`), login (`fe/app/login/page.tsx`), and welcome onboarding (`fe/app/welcome/page.tsx`) with motivating creator copy. Add left banner branding (*"Rumah Terbaik untuk Karyamu"*), rich role descriptions for Supporter vs Creator, clear referral reward callouts (10 Credit = Rp 10.000), and 60-second creator action cards on welcome screen.

**Acceptance criteria:**
- [ ] Registration page displays rich role descriptions and motivational creator value propositions.
- [ ] Referral banner clearly states: *"Kamu & temanmu masing-masing mendapatkan 10 Credit (Rp 10.000) gratis"*.
- [ ] Welcome page directs new creators to their 3 highest-impact first actions (Lengkapi Profil, Upload Produk, Pasang Link di Bio).

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Walk through registration flow and verify copy on `/register` and `/welcome`.

**Dependencies:** Task 20  
**Files likely touched:**
- `fe/app/register/page.tsx`
- `fe/app/login/page.tsx`
- `fe/app/welcome/page.tsx`

**Estimated scope:** Medium (3 files)

---

### Task 23: Programmatic SEO: Competitor Comparison Hubs (`/vs/[competitor]`)
**Description:** Build dynamic programmatic comparison pages at `fe/app/vs/[competitor]/page.tsx` for high-intent search queries (`/vs/saweria`, `/vs/karyakarsa`, `/vs/trakteer`, `/vs/patreon-indonesia`, `/vs/gumroad-indonesia`). Include feature matrices, fee comparison calculators, payment method breakdowns, and FAQ schema markup.

**Acceptance criteria:**
- [ ] Dynamic route `/vs/[competitor]` renders rich comparison tables and side-by-side fee calculators.
- [ ] Generates valid JSON-LD structured data (`SoftwareApplication` + `FAQPage`).
- [ ] Static paths pre-rendered via `generateStaticParams()` with ISR `revalidate = 3600`.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Visit `/vs/saweria` and `/vs/karyakarsa` and test fee calculator widget.

**Dependencies:** Task 20  
**Files likely touched:**
- `fe/app/vs/[competitor]/page.tsx`
- `fe/lib/data/competitors.ts`
- `fe/components/comparison-table.tsx`
- `fe/components/fee-calculator.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 24: Programmatic SEO: Creator Category & Persona Hubs (`/kreator/[category]`, `/untuk/[niche]`)
**Description:** Implement directory category hubs (`fe/app/kreator/[category]/page.tsx`) and persona landing pages (`fe/app/untuk/[niche]/page.tsx`) (e.g. `/kreator/gaming`, `/kreator/komik`, `/untuk/streamer`, `/untuk/podcaster`). Enforce anti-thin content guardrails (render `noindex` if $< 3$ active creators).

**Acceptance criteria:**
- [ ] `/kreator/[category]` displays top verified creators, membership preview, and recent public posts.
- [ ] `/untuk/[niche]` highlights specific toolsets (e.g. OBS overlay for streamers, audio player for podcasters).
- [ ] Pages with $< 3$ active creators automatically apply `robots: { index: false, follow: true }`.
- [ ] Dynamic sitemap (`fe/app/sitemap.ts`) automatically indexes active programmatic routes.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Inspect `/sitemap.xml` output for programmatic route inclusion.

**Dependencies:** Task 23  
**Files likely touched:**
- `fe/app/kreator/[category]/page.tsx`
- `fe/app/untuk/[niche]/page.tsx`
- `fe/app/sitemap.ts`
- `fe/lib/data/categories.ts`

**Estimated scope:** Medium (4 files)

---

### Task 25: Dynamic OpenGraph Social Previews & JSON-LD Structured Data
**Description:** Implement dynamic social share cards using `@vercel/og` (`opengraph-image.tsx`) for creator profiles (`/c/[slug]`), digital products (`/products/[id]`), and comparison pages (`/vs/[competitor]`). Embed rich JSON-LD (`ProfilePage`, `Product`, `Offer`) structured data on all public pages.

**Acceptance criteria:**
- [ ] Sharing a creator link on Twitter/WhatsApp displays personalized card with creator avatar, bio, follower count, and accent color.
- [ ] Sharing product link displays thumbnail, title, and IDR price.
- [ ] Google Rich Results Test validates JSON-LD schemas with 0 errors.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build`
- [ ] Manual check: Open `/c/democreator/opengraph-image` in browser to preview rendered image.

**Dependencies:** Task 23, Task 24  
**Files likely touched:**
- `fe/app/c/[slug]/opengraph-image.tsx`
- `fe/app/products/[id]/opengraph-image.tsx`
- `fe/app/vs/[competitor]/opengraph-image.tsx`
- `fe/components/json-ld.tsx`

**Estimated scope:** Medium (4 files)

---

### 🛑 Checkpoint 5: Growth Engine
- [ ] All programmatic SEO routes (`/vs/*`, `/kreator/*`, `/untuk/*`) build and render with ISR.
- [ ] OpenGraph image generators produce crisp, branded social preview cards.
- [ ] Structured data validated against Schema.org standards.
- [ ] Copywriting aligned with high-converting Indonesian creator brand voice.

---

## Phase 6: Creator Tools, Discovery & Engagement (PRD Gaps)

### Task 26: Dynamic Watermarking for Protected Media & Digital Downloads
**Description:** Implement dynamic image and downloadable asset watermarking to protect paid creator content from piracy and unauthorized re-sharing. Adds watermark overlay generator in `be/internal/pkg/watermark` (burning creator name/handle or buyer identity onto protected image/PDF previews or files when accessed/downloaded).

**Acceptance criteria:**
- [ ] Paid post image previews and downloadable images can optionally receive dynamic watermark text/logo.
- [ ] Watermarking preserves original source file in storage while applying overlay during preview or pre-signed URL generation.
- [ ] Creator can toggle watermark ON/OFF in Post/Product settings.

**Verification:**
- [ ] Unit tests pass: `cd be && go test -v -run "TestWatermark" ./internal/...`
- [ ] Build succeeds: `cd be && go build ./cmd/api`

**Dependencies:** Task 1  
**Files likely touched:**
- `be/internal/pkg/watermark/watermark.go`
- `be/internal/service/post.go`
- `be/internal/service/product.go`
- `fe/app/dashboard/posts/new/page.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 27: Web Push Notifications (VAPID / Web Push API)
**Description:** Replace pure polling with standard Web Push Notifications (VAPID / Service Worker) for instant alerts on new posts, donations received, paid DM messages, and membership milestones even when the tab is inactive.

**Acceptance criteria:**
- [ ] User can enable web push notifications via browser permission prompt in `/notifications` or settings.
- [ ] Service worker `fe/public/sw.js` handles push events, displaying notification title, icon, body, and action URL.
- [ ] Backend persists subscription endpoints in `user_push_subscriptions` table and broadcasts pushes via standard HTTP VAPID.

**Verification:**
- [ ] Tests pass: `cd be && go test -v -run "TestPushNotification" ./internal/service/...`
- [ ] Build succeeds: `cd fe && npm run build && cd ../be && go build ./cmd/api`

**Dependencies:** Task 5  
**Files likely touched:**
- `be/migrations/0051_push_subscriptions.sql`
- `be/internal/entity/notification.go`
- `be/internal/service/notification.go`
- `fe/public/sw.js`
- `fe/lib/push.ts`

**Estimated scope:** Medium (5 files)

---

### Task 28: Creator Storage Quota Enforcement & Upgrade Prompts
**Description:** Enforce strict storage quota limits across all upload endpoints (`/upload`, `/posts/:id/media`, `/products/:id/assets`). When creator approaches or exceeds quota, reject upload with `422 Unprocessable Entity` ("Kapasitas penyimpanan penuh") and show storage usage meter with 1-click tier upgrade CTA in dashboard.

**Acceptance criteria:**
- [ ] Global `/upload` verifies `StorageUsedBytes + newFileSize <= StorageQuotaBytes` before saving to MinIO.
- [ ] Dashboard `/dashboard/profile` or `/dashboard` displays live storage bar (Used / Quota) with percentage.
- [ ] Creators exceeding 90% quota see banner prompting upgrade to Pro (10GB) or Business (50GB).

**Verification:**
- [ ] Tests pass: `cd be && go test -v -run "TestStorageQuota" ./internal/service/...`
- [ ] Build succeeds: `cd be && go build ./cmd/api`

**Dependencies:** Task 1  
**Files likely touched:**
- `be/internal/handler/upload.go`
- `be/internal/service/post.go`
- `be/internal/service/product.go`
- `fe/app/dashboard/profile/page.tsx`
- `fe/components/storage-meter.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 29: Creator Discovery Hub Overhaul (`/explore`) with Categories & Trending Filters
**Description:** Transform `/explore` from simple search into a full discovery engine. Add category browsing (Komik, Video, Edukasi, Musik, Gaming, Podcast, dsb.), trending/popular creators by 30-day donation/follower velocity, newest verified creators, and responsive grid pagination.

**Acceptance criteria:**
- [ ] `/explore` provides category tabs and pills with instant filtering without page reload.
- [ ] Backend `GET /api/v1/creators` supports `category`, `sort=trending|popular|newest`, and cursor/offset pagination.
- [ ] Creator cards showcase avatar, banner, category badge, follower count, and bio with responsive design.

**Verification:**
- [ ] Build succeeds: `cd fe && npm run build && cd ../be && go build ./cmd/api`
- [ ] Manual check: Navigate to `/explore`, filter by category, verify cards load properly.

**Dependencies:** Task 5  
**Files likely touched:**
- `be/internal/handler/public.go`
- `be/internal/repository/postgres/user.go`
- `fe/app/explore/page.tsx`
- `fe/components/creator-card.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 30: Weekly Engagement Email Digests for Creators & Supporters
**Description:** Implement automated weekly email digests via cron worker. Creators receive a weekly performance report (revenue earned, new followers, top post). Supporters receive a weekly digest of latest exclusive posts and perks from creators they follow.

**Acceptance criteria:**
- [ ] Weekly cron worker generates and dispatches personalized creator weekly summaries.
- [ ] Weekly cron worker sends supporter digest with unread creator post highlights.
- [ ] Users can toggle "Email Digest Mingguan" ON/OFF in `/s/settings` and `/profile`.

**Verification:**
- [ ] Tests pass: `cd be && go test -v -run "TestWeeklyDigest" ./internal/service/...`
- [ ] Build succeeds: `cd be && go build ./cmd/api`

**Dependencies:** Task 20  
**Files likely touched:**
- `be/internal/pkg/mailer/mailer.go`
- `be/internal/service/digest.go`
- `be/cmd/api/main.go`
- `fe/app/s/settings/page.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 31: First-Boot Admin Password Hardening & Forced Rotation Flow
**Description:** Remove default insecure fallback password `changeme123`. Require strong random password generated on initial setup via CLI or environment variable, and enforce immediate password rotation on first login if default credentials are detected.

**Acceptance criteria:**
- [ ] Backend rejects weak default passwords on production boot when `ADMIN_PASSWORD` is unset or `changeme123`.
- [ ] First-time admin login with initial seed password forces mandatory password change before accessing `/admin` dashboard.
- [ ] Admin actions are recorded in `admin_audit_logs` table.

**Verification:**
- [ ] Tests pass: `cd be && go test -v -run "TestAdminSeed" ./internal/...`
- [ ] Build succeeds: `cd be && go build ./cmd/api`

**Dependencies:** Task 7  
**Files likely touched:**
- `be/cmd/api/main.go`
- `be/internal/service/admin.go`
- `be/internal/handler/admin.go`
- `fe/app/admin/login/page.tsx`

**Estimated scope:** Small (3-4 files)

---

### 🛑 Checkpoint 6: Engagement & Creator Tools
- [ ] Watermarking generates clean preview stamps without corrupting originals.
- [ ] Web Push subscriptions register and trigger notifications successfully.
- [ ] Storage quota enforcement prevents quota over-allocation across all upload routes.
- [ ] Discovery hub `/explore` responds within $<200\text{ms}$ with category filters.
- [ ] Admin initialization rejects insecure default credentials.

---

## Phase 7: Production Hardening, Email & Launch

### Task 32: Real SMTP Email Service Integration
**Description:** Wire real SMTP email delivery (via SendGrid, Resend, or standard SMTP) into `be/internal/pkg/mailer/mailer.go` for password reset emails, magic links, 2FA security alerts, payment receipt confirmations, withdrawal status updates, and new subscriber notifications with HTML email templates and retry handling.

**Acceptance criteria:**
- [ ] Password reset and magic login send responsive HTML emails with one-time action links.
- [ ] New device login triggers security alert email with device metadata and instant kill link.
- [ ] Top-up approval and post/product purchases send branded transaction receipt emails.
- [ ] Email failure does not block HTTP requests (handled via background worker with timeout).

**Verification:**
- [ ] Tests pass: `cd be && go test -v -run "TestMailer" ./internal/pkg/mailer/...`
- [ ] Build succeeds: `cd be && go build ./cmd/api`

**Dependencies:** Checkpoint 1  
**Files likely touched:**
- `be/internal/pkg/mailer/mailer.go`
- `be/internal/config/config.go`
- `be/internal/service/auth.go`
- `be/internal/service/payment.go`

**Estimated scope:** Medium (4 files)

---

### Task 33: Full-Stack APM & Observability Integration (OpenTelemetry + Prometheus + Grafana / SigNoz)
**Description:** Implement comprehensive Application Performance Monitoring (APM) and distributed tracing across the Go backend and Next.js frontend using OpenTelemetry (OTel), Prometheus metrics exporter, and Grafana dashboards (or SigNoz/New Relic). Instrument Gin HTTP middleware, GORM database query timings, Redis cache hit rates, panic recovery error capturing, and Next.js Core Web Vitals (LCP, FID, CLS, TTFB) reporting without vendor lock-in.

**Acceptance criteria:**
- [ ] Backend Go API exposes Prometheus metrics endpoint (`GET /metrics` protected for scraper) tracking request latency percentiles (p50, p95, p99), HTTP status codes, active database connections, and memory allocations.
- [ ] OpenTelemetry middleware instruments Gin router and GORM PostgreSQL queries for distributed request tracing and slow query detection.
- [ ] Unhandled panics and API 500 errors are automatically captured with full stack trace and request context.
- [ ] Frontend Next.js exports Core Web Vitals (`reportWebVitals`) and client error telemetry.
- [ ] Grafana dashboard provisioning (`grafana/provisioning/dashboards/`) renders live API throughput, error rates, and system health.

**Verification:**
- [ ] Backend build succeeds: `cd be && go build ./cmd/api`
- [ ] Frontend build succeeds: `cd fe && npm run build`
- [ ] Metrics check: `curl -f http://localhost:8080/metrics`

**Dependencies:** Checkpoint 4  
**Files likely touched:**
- `be/cmd/api/main.go`
- `be/internal/pkg/telemetry/otel.go`
- `be/internal/handler/router.go`
- `fe/app/layout.tsx`
- `grafana/provisioning/dashboards/yourpage-apm.json`

**Estimated scope:** Medium (4-5 files)

---

### Task 34: Nginx SSL/TLS Hardening, Rate Limit Tuning & Production Launch Checklist
**Description:** Finalize production reverse proxy configuration in `nginx/nginx.production.conf`: enforce HTTPS with modern TLS 1.3 ciphers, HSTS, gzip compression, bypass caching on signed pre-signed URLs, tune rate limit buckets (public, auth, action), and verify the complete launch checklist.

**Acceptance criteria:**
- [x] Nginx configuration tests clean (`nginx -t`).
- [x] Pre-signed storage URLs with signature parameters bypass proxy cache.
- [x] Security headers score A+ on Mozilla Observatory (HSTS, X-Content-Type-Options, CSP).
- [x] Production Docker Compose starts all containers healthy (`postgres`, `redis`, `minio`, `api`, `fe`, `nginx`, `prometheus`, `grafana`).

**Verification:**
- [x] Docker compose test: `docker compose -f docker-compose.production.yml config`
- [x] Health check: `curl -f http://localhost:8080/api/v1/health`

**Dependencies:** Task 32, Task 33  
**Files likely touched:**
- `nginx/nginx.production.conf`
- `docker-compose.production.yml`
- `.env.production`
- `README.md`

**Estimated scope:** Small (3 files)

---

### 🛑 Checkpoint 7: Complete & Production Ready
- [ ] All 34 tasks completed and verified.
- [ ] Backend unit and integration test suite: 100% PASS with $\ge 75\%$ coverage.
- [ ] Frontend build: 100% PASS with 0 ESLint warnings.
- [ ] Playwright E2E tests: 100% PASS.
- [ ] Production containers boot healthy and pass `/api/v1/health`.
- [ ] Ready for production merge and deployment.

---

## Phase 8: User Profile Custom Styles & Verified Badge System

### Task 35: Database Schema & Migration for Custom Appearance & Verification Badges
**Description:** Implement database schema migration `0063_creator_custom_styles_and_badges.sql` to persist user storefront customization attributes (`font_style`, `custom_icon`, `card_style`, `custom_styles` JSONB) and update Go entity models in `be/internal/entity/user.go` with GORM tags and clean JSON serialization. Ensure database indexes on verification status.

**Acceptance criteria:**
- [ ] Migration `0063_creator_custom_styles_and_badges.sql` adds columns to `creator_profiles`:
  - `font_style VARCHAR(64) DEFAULT 'Outfit'`
  - `custom_icon VARCHAR(64) DEFAULT 'sparkles'`
  - `card_style VARCHAR(64) DEFAULT 'default'`
  - `custom_styles JSONB DEFAULT '{}'::jsonb`
  - `is_verified` index added: `CREATE INDEX IF NOT EXISTS idx_creator_profiles_verified ON creator_profiles(is_verified);`
- [ ] `entity.CreatorProfile` struct in `be/internal/entity/user.go` includes all new fields with proper JSON tags.
- [ ] Both `up` and `down` migration statements are idempotent and execute cleanly.

**Verification:**
- [ ] Migration test: Goose / migrate binary compiles and runs `go run cmd/migrate/main.go up`
- [ ] Build succeeds: `cd be && go build ./...`
- [ ] Entity tests pass: `cd be && go test ./internal/entity/...`

**Dependencies:** None  
**Files likely touched:**
- `be/migrations/0063_creator_custom_styles_and_badges.sql`
- `be/internal/entity/user.go`

**Estimated scope:** Small (2 files)

---

### Task 36: Backend API Endpoints for Custom Theming & Admin Verification Control
**Description:** Expand profile update endpoints (`PUT /api/v1/auth/me`), public creator profile payload (`GET /api/v1/creators/:slug`, `GET /api/v1/creators/search`), and admin management endpoints (`POST /api/v1/admin/creators/:id/verify`, `PUT /api/v1/admin/creators/:id/verification`) to support reading, updating, and administrative granting of verification badges and custom appearance styles.

**Acceptance criteria:**
- [ ] `UpdateProfile` in `be/internal/service/auth.go` accepts and validates `page_color` (hex regex `^#([A-Fa-f0-9]{6})$`), `font_style` (whitelisted enum), `custom_icon` (whitelisted enum), `card_style`, and `custom_styles` JSONB.
- [ ] Public creator endpoints (`/creators/:slug`, `/creators/search`) include `page_color`, `font_style`, `custom_icon`, `card_style`, `custom_styles`, and `is_verified`.
- [ ] Admin handler allows admins to toggle `is_verified` with audit log recording admin user ID, creator ID, timestamp, and verification reason.
- [ ] Feed queries serialize creator verification status and custom icon in `post.creator` object.

**Verification:**
- [ ] Unit tests pass: `cd be && go test -v -run "TestProfileStyles|TestAdminVerification" ./internal/service/...`
- [ ] Handlers test: `cd be && go test -v ./internal/handler/...`
- [ ] Manual check: `curl -X PUT http://localhost:8080/api/v1/auth/me` with style payload and verify returned profile.

**Dependencies:** Task 35  
**Files likely touched:**
- `be/internal/handler/auth.go`
- `be/internal/service/auth.go`
- `be/internal/handler/public.go`
- `be/internal/handler/admin.go`
- `be/internal/service/admin.go`

**Estimated scope:** Medium (5 files)

---

### Task 37: Reusable `<VerifiedBadge />` Component & Sitewide Trust Signaling Integration
**Description:** Build a centralized, accessible, high-performance `<VerifiedBadge size="sm"|"md"|"lg" tooltip={true} />` component with glowing SVG emblem and WCAG-compliant screen reader semantics (`aria-label="Akun terverifikasi resmi YourPage"`). Integrate the badge sitewide wherever creator names appear.

**Acceptance criteria:**
- [ ] Reusable `<VerifiedBadge />` created in `fe/components/ui/verified-badge.tsx` with size variants:
  - `sm`: 14x14px (for compact feeds, comments, search items)
  - `md`: 18x18px (for post headers, product cards, chat headers)
  - `lg`: 24x24px (for main creator storefront banner)
- [ ] Includes interactive tooltip: *"Kreator Terverifikasi Resmi YourPage"*.
- [ ] Integrated sitewide into:
  - `fe/components/post-card.tsx` (next to creator display name)
  - `fe/app/c/[slug]/page.tsx` (next to creator profile title)
  - `fe/app/posts/[id]/page.tsx` (post author header)
  - `fe/app/products/[id]/page.tsx` (product author header)
  - `fe/app/explore/page.tsx` (replace ad-hoc icons in creator search results)
  - `fe/app/chat/chat-content.tsx` (conversation list and active header)
  - `fe/app/admin/users/page.tsx` (user list and detail badge toggle indicator)

**Verification:**
- [ ] Typecheck: `cd fe && npm run type-check`
- [ ] Lint: `cd fe && npx eslint . --quiet`
- [ ] Visual & Screen Reader Check: Inspect verified badge in Chrome DevTools; verify accessible name and tooltip trigger.

**Dependencies:** Task 36  
**Files likely touched:**
- `fe/components/ui/verified-badge.tsx`
- `fe/components/post-card.tsx`
- `fe/app/c/[slug]/page.tsx`
- `fe/app/posts/[id]/page.tsx`
- `fe/app/products/[id]/page.tsx`
- `fe/app/explore/page.tsx`
- `fe/app/chat/chat-content.tsx`

**Estimated scope:** Medium (5-7 files)

---

### Task 38: Creator Dashboard Appearance Studio UI (Colors, Fonts, Custom Icons, Card Styles)
**Description:** Build an intuitive, interactive "Tampilan & Branding Halaman" (Appearance Studio) within `fe/app/dashboard/profile/page.tsx`. Provide live side-by-side / split preview of how the creator's page will appear to supporters before saving.

**Acceptance criteria:**
- [ ] Color Palette Picker:
  - Preset swatches: YourPage Pink (`#EC4899`), Electric Indigo (`#6366F1`), Emerald Mint (`#10B981`), Sunset Orange (`#F97316`), Royal Violet (`#8B5CF6`), Amber Gold (`#F59E0B`), Obsidian Dark (`#18181B`).
  - Custom HEX color input with real-time contrast ratio calculator (warns if accent text is illegible on light/dark backgrounds).
- [ ] Typography Font Selector:
  - 5 curated Google Fonts with preview samples: `Outfit` (Modern & Bold), `Rubik` (Friendly & Balanced), `Plus Jakarta Sans` (Clean Tech), `Playfair Display` (Editorial & Elegant), `Space Grotesk` (Creative & Brutalist).
- [ ] Custom Signature Icon / Emblem Selector:
  - 8 selectable icons: `Sparkles` ✨, `Flame` 🔥, `Crown` 👑, `Star` ⭐, `Heart` 💖, `Zap` ⚡, `Music` 🎵, `Gamepad` 🎮.
- [ ] Card Surface & Button Style:
  - Options: `Default` (Clean border), `Soft Rounded` (Extra pill curvature), `Glassmorphism` (Translucent frosted blur), `Modern Sharp` (Subtle 8px radius).
- [ ] Live interactive mini-storefront preview card showing instant updates as creator tweaks colors, fonts, and icons.
- [ ] Save mutation with instant TanStack Query cache invalidation (`["creator-earnings"]`, `["auth-me"]`).

**Verification:**
- [ ] Frontend build: `cd fe && npm run build`
- [ ] UI verification: Navigate to `/dashboard/profile`, select new font, color, and icon, verify preview updates instantly, save and refresh to confirm persistence.

**Dependencies:** Task 36, Task 37  
**Files likely touched:**
- `fe/app/dashboard/profile/page.tsx`
- `fe/components/profile/theme-customizer.tsx`
- `fe/lib/theme-presets.ts`
- `fe/lib/types.ts`

**Estimated scope:** Medium (4 files)

---

### Task 39: Dynamic Theme Injection & Responsive Storefront Rendering Engine
**Description:** Implement the dynamic styling runtime on the public creator storefront (`/c/[slug]`). Inject scoped CSS variables (`--creator-accent`, `--creator-font`, `--creator-radius`) into the page root container and dynamically import/apply the selected Google Font without incurring Cumulative Layout Shift (CLS) or blocking page hydration.

**Acceptance criteria:**
- [ ] Scoped theme injection:
  - Custom CSS variables set on container:
    ```html
    <div style="--creator-accent: #...; --creator-font: ...">
    ```
  - Dynamic button hover states, active tab underlines, donation progress bars, and header highlights inherit `var(--creator-accent)`.
- [ ] Dynamic typography loader safely loads the chosen creator font without global CSS leakage or FOUC (Flash of Unstyled Content).
- [ ] Creator signature icon displays elegantly next to creator name / avatar banner with animated subtle hover sparkle.
- [ ] Storefront cards (profile card, tier cards, post feed, product catalog) adapt according to `card_style` (default, soft, glassmorphism).
- [ ] Verified badge rendered prominently if `is_verified` is true.
- [ ] Supporter checkout / donation modal styling matches creator's theme accent seamlessly.

**Verification:**
- [ ] Visual verification: Test visiting `/c/[slug]` with different font styles, custom icons, and accent colors across mobile (375px) and desktop (1440px).
- [ ] Lighthouse / Core Web Vitals check: CLS remains $< 0.05$ during font load.
- [ ] Build succeeds: `cd fe && npm run build`

**Dependencies:** Task 37, Task 38  
**Files likely touched:**
- `fe/app/c/[slug]/page.tsx`
- `fe/app/c/[slug]/components/creator-storefront-theme.tsx`
- `fe/lib/font-loader.ts`
- `fe/app/globals.css`

**Estimated scope:** Medium (4 files)

---

### Task 40: Automated E2E Testing, Contrast Accessibility & Verification Regression
**Description:** Write comprehensive Playwright end-to-end tests and backend unit tests verifying the full lifecycle of custom page appearance and verified badge status. Perform automated WCAG 2.1 AA color contrast validation.

**Acceptance criteria:**
- [ ] E2E Test 1 (`fe/e2e/creator-styling.spec.ts`):
  - Creator logs into `/dashboard/profile`.
  - Creator selects custom color `#8B5CF6`, font `Playfair Display`, and icon `Crown`.
  - Saves changes successfully with toast notification.
  - Test navigates to public storefront `/c/[username]` and asserts CSS variables, font family, and crown icon are present.
- [ ] E2E Test 2:
  - Admin navigates to `/admin/users`, toggles verification badge on creator.
  - Asserts `<VerifiedBadge />` renders on creator profile, feed post card, and explore search.
- [ ] WCAG Contrast Test: Automated contrast helper verifies dynamic text color adjusts to white or black based on the chosen background accent luminance (minimum 4.5:1 ratio).
- [ ] Backend tests for profile style validation (`TestUpdateProfile_CustomStyles`) pass with 100% assertions.

**Verification:**
- [ ] Backend tests pass: `cd be && go test -v ./internal/service/...`
- [ ] Playwright E2E tests pass: `cd fe && npx playwright test tests/e2e/creator-styling.spec.ts`
- [ ] All 80 frontend routes compile cleanly: `cd fe && npm run build`

**Dependencies:** Task 38, Task 39  
**Files likely touched:**
- `fe/e2e/creator-styling.spec.ts`
- `be/internal/service/auth_test.go`
- `fe/lib/contrast-utils.ts`

**Estimated scope:** Medium (3 files)

---

### 🛑 Checkpoint 8: Storefront Personalization & Trust Ready
- [ ] All Tasks 35-40 completed and verified.
- [ ] Database migration `0063_creator_custom_styles_and_badges.sql` runs cleanly on up and down.
- [ ] Backend tests pass: `cd be && go test ./... -race`.
- [ ] Frontend builds cleanly with 0 type errors and 0 lint warnings: `cd fe && npm run build`.
- [ ] Playwright E2E suite passes for custom styling and verification badge flow.
- [ ] WCAG 2.1 AA accessibility standards met for dynamic contrast and badge labels.




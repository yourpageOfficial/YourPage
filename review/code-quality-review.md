# YourPage — Multi-Axis Code Review

**Tanggal:** 26 Agustus 2026  
**Reviewer:** Tukang Review (automated)  
**Scope:** Full codebase — Backend (Go/Gin/GORM) + Frontend (Next.js 16/React 19/TypeScript)

---

## Verdict

**Approve with required changes.** Codebase is well-structured with solid fundamentals. Three critical security issues and one financial correctness issue must be fixed before any production traffic. Everything else is incremental.

---

## 1. Correctness

### Critical

**Wallet balance race condition in `payWithCredits`**  
`be/internal/service/payment.go:280-295`

Two separate DB calls — read balance then deduct — with no transaction wrapping. Concurrent requests for the same buyer can both pass the balance check and both deduct. The `WHERE balance >= ?` guard on `DeductCredits` is the actual safety net, but the preceding `GetBalance` read is misleading and the gap between read and write is a real race window.

**Fix:** Wrap the read + deduct in a single transaction with `SELECT ... FOR UPDATE` on the wallet row, or remove the pre-read entirely and rely solely on `DeductCredits` returning an insufficient-funds error.

**Membership renewal lacks row-level locking**  
`be/cmd/api/main.go:332-356`

The query that finds expired memberships runs outside the transaction. Two goroutine ticks can overlap and process the same membership twice. The `expires_at` update inside the transaction prevents re-processing on success, but the window before commit is real.

**Fix:** Move the expired-membership SELECT inside the transaction with `FOR UPDATE SKIP LOCKED`.

### High

**`LikePost` duplicate like race**  
`be/internal/repository/postgres/post.go:172-178`

`Create` then `Increment` without a unique composite index on `(post_id, user_id)`. Concurrent like requests can create duplicate entries and double-increment the counter.

**Fix:** Add unique constraint on `post_likes(post_id, user_id)` and use `ON CONFLICT DO NOTHING` before the increment.

**Admin dashboard type mismatches**  
`fe/app/admin/page.tsx:30,34`

Three queries cast to `UserKYC[]` — two of them return `Withdrawal[]` and `CreditTopup[]`. Copy-paste error that suppresses type checking on all downstream `.map()` calls.

**Fix:** Correct the type annotations. One-line fix, zero risk.

---

## 2. Readability & Simplicity

### Required

**`UpdateProfile` takes 17 positional parameters**  
`be/internal/service/auth.go:464`

```go
func (s *authService) UpdateProfile(ctx, userID, displayName, bio, avatarURL, 
    pageColor, headerImage, chatPrice, chatAllowFrom, autoReply, socialLinks, 
    goalTitle, goalAmount, welcomeMsg, overlayStyle, overlayText, category)
```

Error-prone and unreadable. Every new field means touching every caller.

**Fix:** Create an `UpdateProfileRequest` struct. This is the third time a positional-param problem appears in Go codebases — the pattern is always the same fix.

**`PostCard` manages 9 local state variables**  
`fe/components/post-card.tsx:18-27`

Buy flow, like flow, and comment flow are three independent concerns packed into one component. Comments bypass TanStack Query (manual `setComments`/`setCommentCount`) while the rest of the codebase uses it consistently.

**Fix:** Extract `CommentSection`, `LikeButton`, and `BuyButton` into sub-components. Each gets its own TanStack Query usage.

**`CreatorPageView` is 429 lines with 7 queries**  
`fe/app/c/[slug]/page.tsx`

The largest single component. Fetches creator, posts, top supporters, membership tiers, my memberships, products, and follow status — all in one component with donate panel state, subscribe state, and full page rendering.

**Fix:** Split into `CreatorHeader`, `CreatorSidebar`, `DonatePanel`, `CreatorContent`.

### Consider

**`handleServiceError` uses `"⚠ "` prefix hack for user-facing errors**  
`be/internal/handler/auth.go:364-372`

The `default` case returns 500 for unknown errors. Service-layer errors get a generic message. The `"⚠ "` prefix convention for user-facing errors is fragile — relies on convention, not type safety.

**Nit: Duplicate `EmptyState` component**  
`fe/components/ui/standards.tsx:88-96` vs `fe/components/ui/page-layout.tsx:32-44`

Two implementations with nearly identical code. `standards.tsx` has dark mode support; `page-layout.tsx` does not.

**Nit: `useActionMutation` hook exists but admin dashboard defines 6 inline mutations**  
`fe/lib/use-action.ts` exists and is clean, but `fe/app/admin/page.tsx:37-42` duplicates `onSuccess` boilerplate instead of using it.

---

## 3. Architecture

### Good Patterns (Don't Break These)

- **Clean three-layer architecture** — handler → service → repository with narrow interfaces at each boundary. This is the backbone of the codebase and it works.
- **Cursor-based pagination everywhere** — `parsePagination` helper caps at 100. No OFFSET anti-pattern.
- **Error sentinel pattern** — all domain errors in `entity/errors.go`, clean `errors.Is` matching in handlers.
- **Batch operations** — `applyLockBatch` in `service/post.go:538` avoids N+1 for purchase status and likes.
- **Refund-on-failure** — payment flows refund credits if fulfillment fails after deduction.
- **Password history** — last 5 passwords checked on change and reset.

### Required

**`main.go` is overloaded**  
`be/cmd/api/main.go`

Background goroutines with raw `db.Exec`, admin/finance seeding, cron scheduling, membership renewal — all in the entrypoint. This should be extracted into dedicated `scheduler`, `seeder`, or `worker` packages.

**Rate limiter is in-memory only**  
`be/internal/handler/middleware/ratelimit.go:17-19`

`sync.Mutex` + in-memory `map`. Multi-instance deployment means independent rate limits per instance. The effective rate is N times the configured rate.

**Fix:** Move to Redis-based rate limiting (Redis is already in the stack).

### Consider

**`ListByReferenceCreator` runs 4 separate queries then combines in Go**  
`be/internal/repository/postgres/payment.go:81-89`

Could be a single `UNION` query. Minor for now, but grows with data.

**No `Suspense` boundaries in frontend**  
Every page shows a full skeleton until all queries complete. `c/[slug]` fires 7 queries and blocks until all resolve. React 19 streaming with `<Suspense>` would let sidebar and content load independently.

---

## 4. Security

### Critical

**PayPal webhook has no signature verification**  
`be/internal/handler/webhook.go:105-108`

Anyone can POST to this endpoint and trigger payment state changes. The Xendit webhook is properly verified via token, but PayPal is not. The code has a `TODO` comment acknowledging this.

**Fix:** Implement PayPal webhook signature verification using the PayPal SDK or manual HMAC check. This is a hard blocker for production.

**Client-set `auth-role` cookie used by middleware for role gating**  
`fe/lib/auth.ts:30` + `fe/middleware.ts:8-18`

The `auth-role` cookie is written by client-side JS. The middleware reads it for role-based route protection. A user can trivially set `document.cookie = "auth-role=admin"` to bypass the middleware guard for `/admin` routes. The real protection is on the BE API, but the middleware should not pretend to guard anything.

**Fix:** Either remove the role check from middleware (rely solely on BE AuthGuard) or have the BE set the cookie and don't overwrite it client-side.

**Default admin/finance passwords are `changeme123`**  
`be/cmd/api/main.go:95,116`

If `ADMIN_PASSWORD` is not set, accounts get `changeme123`. In production, someone could log in with default credentials if the env var is misconfigured.

**Fix:** Fail startup if admin password is not set in production. No default fallback.

### High

**CSP allows `unsafe-eval` in production**  
`fe/next.config.mjs:53`

`script-src 'self' 'unsafe-inline' 'unsafe-eval'` widens the XSS surface. If only needed for Next.js dev mode, split across environments.

### Medium

**Metrics endpoint checks `X-Internal` header (trivially forgeable)**  
`be/router.go:62`

The metrics endpoint relies on a custom header for access control. Any client can send this header.

**Fix:** Restrict to localhost/IP range at the network level, or use a shared secret.

**Xendit token comparison uses `==` (not constant-time)**  
`be/pkg/payment/xendit/xendit.go:17`

Minor timing leak. Not exploitable in practice (network latency dominates), but `subtle.ConstantTimeCompare` is the correct pattern.

**`auth-role` cookie is not HttpOnly**  
`be/handler/auth.go:40`

Readable by JavaScript. Intentional for the frontend middleware pattern, but means any XSS can read the role.

### Security Done Well

- JWT tokens use HMAC-SHA256 with proper signing method validation
- Password hashing uses bcrypt with cost 12
- Access tokens blacklisted on logout
- Refresh token rotation with per-user tracking for bulk invalidation
- Rate limiting on auth endpoints (5 req/s vs 10 for public)
- Security headers: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS
- Input sanitization strips HTML tags and script patterns
- Admin audit logging on all mutating admin actions
- Login lockout after 5 failed attempts
- File upload MIME type detection from content, not headers
- Soft-delete with PII anonymization
- Paid content in private bucket with presigned URLs
- `dangerouslySetInnerHTML` restricted to hardcoded strings — no user input flows into innerHTML
- No `eval()` or `new Function()` calls in frontend

---

## 5. Performance

### Medium

**Unbounded CSV exports can OOM**  
`be/internal/handler/payment.go:91` + `be/internal/handler/admin.go:427`

`ExportCreatorSales` fetches up to 10,000 records into a string builder. With large payment data, this can consume significant memory.

**Fix:** Stream rows with `csv.Writer` to an `io.Pipe` or chunk the export.

**`applyLockBatch` has N+1 on members-only posts**  
`be/internal/service/post.go:604-608`

Calls `CheckMembership`/`CheckMembershipTier` in a per-post loop for members-only posts.

**Fix:** Batch membership checks like the purchase-status check already does.

**No code splitting for heavy frontend pages**  
`fe/app/c/[slug]/page.tsx` — 429 lines, 7 queries, Framer Motion, Tabs all loaded eagerly.

**Fix:** Dynamic import for heavy components (`DonatePanel`, `MembershipTiers`).

**`force-dynamic` on all pages**  
`fe/layout.tsx:12` — disables all SSR caching. Intentional for SPA pattern but means every navigation is a full client render.

### Low

- `GetAnalyticsCounts` runs 14 sequential COUNT/SUM queries — admin-only, acceptable
- `InvalidateCache` uses SCAN iteration (O(N)) — only called on mutations, acceptable
- Framer Motion imported in 8+ pages (~40KB gzipped) — consider CSS animations for simple transitions

---

## Summary Scorecard

| Axis | Score | Notes |
|------|-------|-------|
| **Correctness** | 7/10 | Wallet race condition is the biggest gap. Cursor pagination and batch queries are excellent. |
| **Readability** | 7/10 | Clean architecture, but `UpdateProfile` 17-params and `PostCard` 9-states need cleanup. |
| **Architecture** | 8/10 | Three-layer separation is solid. `main.go` overload and in-memory rate limiter are the gaps. |
| **Security** | 6/10 | PayPal webhook verification missing is critical. Auth-role cookie bypass is a real concern. Otherwise strong. |
| **Performance** | 7/10 | Cursor pagination everywhere. CSV export and N+1 membership checks need attention. |

**Overall: 7/10 — Ship it after fixing the 3 critical security issues and the wallet race condition.**

---

## Priority Fix Order

1. **PayPal webhook verification** — security, hard blocker
2. **Wallet `payWithCredits` race condition** — financial correctness
3. **Admin default passwords** — security, fail startup if unset
4. **Auth-role cookie bypass** — security, middleware is security theater
5. **LikePost unique constraint** — correctness
6. **Membership renewal locking** — correctness
7. **Admin dashboard type annotations** — correctness, one-line fix
8. **CSV export streaming** — performance, OOM risk at scale
9. **CSP `unsafe-eval`** — security, split dev/prod
10. **`UpdateProfile` struct** — readability

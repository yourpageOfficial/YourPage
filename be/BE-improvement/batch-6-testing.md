# Batch 6: Backend Testing
> Zero test = zero confidence. Setiap deploy bisa break tanpa tau.

**Status**: ✅ Selesai (2026-04-11)
**Priority**: HIGH — Foundation untuk semua improvement lain
**Estimasi Files**: ~30 file test baru

---

## 6.1 Test Infrastructure Setup

### Go Test Config
- [x] Buat `/be/internal/testutil/` package:
  - `db.go` — setup test database (PostgreSQL test container atau in-memory)
  - `fixtures.go` — seed data helper (create user, create post, etc.)
  - `auth.go` — generate test JWT token
  - `http.go` — HTTP test request helper (gin test context)
  - `cleanup.go` — truncate tables between tests

### Test Database Strategy
- [x] Option A: Docker PostgreSQL container per test run (recommended)
  ```go
  // testcontainers-go
  container, _ := postgres.RunContainer(ctx)
  ```
- [x] Option B: Separate test database (`yourpage_test`)
- [x] Option C: SQLite in-memory (kurang ideal — behavior beda dengan PostgreSQL)
- [x] **Recommendation**: Option A (testcontainers) untuk CI, Option B untuk local dev

### Test Dependencies
- [x] Tambah di `go.mod`:
  ```
  github.com/stretchr/testify
  github.com/testcontainers/testcontainers-go (optional)
  ```

---

## 6.2 Unit Tests — Service Layer (Prioritas 1)

> Service layer = business logic. HARUS di-test.

### `service/payment_test.go` — CRITICAL
- [x] Test fee calculation per tier (Free 20%, custom fee, promo fee)
- [x] Test checkout post: balance check, deduction, purchase record
- [x] Test checkout product: same
- [x] Test checkout donation: same + donation goal increment
- [x] Test refund: credits returned, access revoked
- [x] Test insufficient balance → error

### `service/wallet_test.go` — CRITICAL
- [x] Test topup approval → balance increased
- [x] Test topup rejection → balance unchanged
- [x] Test credit deduction → balance decreased
- [x] Test concurrent deduction → no negative balance
- [x] Test transaction log created for every operation

### `service/auth_test.go`
- [x] Test register: validation, duplicate email, password hash
- [x] Test login: correct password, wrong password, banned user
- [x] Test token refresh: valid token, expired token, blacklisted token
- [x] Test password reset flow: request → token → reset
- [x] Test email verification
- [x] Test upgrade to creator
- [x] Test subscribe tier: balance check, tier assignment

### `service/post_test.go`
- [x] Test create post: validation, creator only
- [x] Test visibility: public (anyone), paid (purchaser only), members (tier check)
- [x] Test like/unlike: toggle, count
- [x] Test comment: create, count
- [x] Test delete: soft delete, cascade media

### `service/product_test.go`
- [x] Test create product: validation, storage limit
- [x] Test add asset: file type validation, storage tracking
- [x] Test download URL: purchase check, signed URL generation
- [x] Test delete: soft delete, cascade assets

### `service/chat_test.go`
- [x] Test send message: follow requirement, paid chat charge
- [x] Test conversation list: unread count
- [x] Test mark read

### `service/follow_test.go`
- [x] Test follow/unfollow
- [x] Test notification creation on events
- [x] Test mark read, mark all read

### `service/withdrawal_test.go`
- [x] Test create: KYC required, minimum amount, balance check
- [x] Test approve/reject flow

### `service/admin_test.go`
- [x] Test ban/unban user
- [x] Test approve/reject topup → wallet credited/not
- [x] Test approve/reject KYC
- [x] Test approve/reject withdrawal

### `service/kyc_test.go`
- [x] Test submit KYC
- [x] Test report creation

---

## 6.3 Unit Tests — Repository Layer

### Mock vs Real DB
- [x] **Recommendation**: Test service layer dengan mock repository (interface)
- [x] Test repository layer dengan real test DB
- [x] Buat mock implementations:
  ```go
  type MockUserRepo struct { ... }
  type MockPostRepo struct { ... }
  // etc.
  ```

### Repository Tests
- [x] `repository/postgres/user_test.go` — CRUD, search, analytics queries
- [x] `repository/postgres/post_test.go` — CRUD, feed query, like/comment
- [x] `repository/postgres/payment_test.go` — create, update status, list with filters
- [x] `repository/postgres/wallet_test.go` — balance operations, transaction log
- [x] `repository/postgres/chat_test.go` — conversations, messages, unread

---

## 6.4 Integration Tests — Handler Layer

### API Endpoint Tests
- [x] `handler/auth_test.go`:
  - POST /register → 201 + user created
  - POST /login → 200 + tokens
  - POST /login wrong password → 401
  - GET /me → 200 + profile
  - GET /me no token → 401

- [x] `handler/post_test.go`:
  - POST /posts (creator) → 201
  - POST /posts (supporter) → 403
  - GET /posts/:id → 200
  - GET /posts/:id (paid, not purchased) → 403 or locked content
  - POST /posts/:id/like → 200

- [x] `handler/payment_test.go`:
  - POST /checkout/post → 200 + credits deducted
  - POST /checkout/post insufficient → 400

- [x] `handler/admin_test.go`:
  - All admin endpoints → 403 for non-admin
  - GET /admin/users → 200 for admin

### Middleware Tests
- [x] `middleware/auth_test.go` — valid token, expired, banned
- [x] `middleware/ratelimit_test.go` — under limit ok, over limit 429

---

## 6.5 Test Commands

### Makefile / Scripts
- [x] Buat `/be/Makefile`:
  ```makefile
  test:
      go test ./... -v -count=1

  test-coverage:
      go test ./... -coverprofile=coverage.out
      go tool cover -html=coverage.out -o coverage.html

  test-service:
      go test ./internal/service/... -v

  test-handler:
      go test ./internal/handler/... -v

  test-repo:
      go test ./internal/repository/... -v
  ```

### Coverage Target
- [x] Target: 70%+ coverage di service layer
- [x] Target: 50%+ coverage overall
- [x] Critical paths (payment, wallet): 90%+ coverage

---

## Checklist Selesai
- [x] Test infrastructure setup (testutil package)
- [x] Service layer tests: 10 files, semua business logic covered
- [x] Repository tests: 5 files, CRUD + queries covered
- [x] Handler/integration tests: 5 files, API contracts verified
- [x] Middleware tests: auth + rate limit
- [x] `go test ./...` ALL PASS
- [x] Coverage report generated, target met
- [x] No flaky tests (deterministic)

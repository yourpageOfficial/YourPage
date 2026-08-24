# Code Review: YourPage Platform

**Project:** YourPage (Creator Monetization Platform)  
**Date:** 2026-08-23  
**Reviewer:** Tukang Review (Multi-Axis Code Review)  
**Status:** ⚠️ **Request Changes** (Critical & Required issues identified)

---

## 1. Executive Summary

YourPage is a well-structured and feature-rich full-stack application (Go backend with Gin/GORM + Next.js 14 frontend + PostgreSQL/Redis/MinIO). The codebase exhibits clean module boundaries, solid TypeScript typing, passing unit tests, and thorough documentation.

However, a deep multi-axis review identified **3 Critical** bugs (content locking bypass, broken private media presigning, and KYC PII public exposure), **4 Required** structural fixes (transaction atomicity, missing audit ledger entries, goroutine context leaks, and UI sign formatting), and several **Performance & Hardening** recommendations.

---

## 2. Findings by Severity

### 🔴 Critical (Blocks Merge / Production)

#### 1. Members-Only Content Access Gate Bypass
* **File:** [`be/internal/service/post.go:554-563`](../be/internal/service/post.go#L554-L563)
* **Axis:** Correctness & Security
* **Problem:** In `applyLockBatch`, the function checks if there are paid posts with `if len(paidIDs) == 0 { return nil }`. When a feed/list contains only free posts or members-only posts (where `AccessType` is not `paid`), the function returns immediately. This skips:
  1. The `posts[i].Visibility == "members"` evaluation (lines 610–625), allowing non-members to view full members-only text and media.
  2. The `HasLiked` attribution (lines 580–584).
* **Remedy:** Do not return early when `paidIDs` is empty. Separate the query batching for paid posts, likes, and membership checks into independent stages.

```go
// Proposed Restructuring in be/internal/service/post.go
func (s *postService) applyLockBatch(ctx context.Context, posts []entity.Post, viewerID *uuid.UUID) error {
	if len(posts) == 0 {
		return nil
	}

	var paidIDs []uuid.UUID
	allIDs := make([]uuid.UUID, len(posts))
	for i := range posts {
		allIDs[i] = posts[i].ID
		if posts[i].AccessType == entity.PostAccessPaid {
			paidIDs = append(paidIDs, posts[i].ID)
		}
	}

	var purchasedIDs map[uuid.UUID]bool
	var likedIDs map[uuid.UUID]bool
	if viewerID != nil {
		if len(paidIDs) > 0 {
			var err error
			purchasedIDs, err = s.postRepo.FindPurchasedPostIDs(ctx, *viewerID, paidIDs)
			if err != nil {
				return err
			}
		}
		likedIDs, _ = s.postRepo.HasLikedBatch(ctx, *viewerID, allIDs)
	}

	// Apply likes, paid locks, and membership checks unconditionally
	for i := range posts {
		if viewerID != nil && likedIDs[posts[i].ID] {
			posts[i].HasLiked = true
		}
		// ... apply paid locks ...
		// ... apply members locks ...
	}
	return nil
}
```

---

#### 2. Broken Pre-Signed URLs for Paid Media & Product Downloads
* **Files:** 
  - [`be/internal/service/post.go:630-641`](../be/internal/service/post.go#L630-L641)
  - [`be/internal/service/post.go:220-230`](../be/internal/service/post.go#L220-L230)
  - [`be/internal/service/product.go:379-391`](../be/internal/service/product.go#L379-L391)
  - [`be/internal/pkg/storage/minio.go:40-66`](../be/internal/pkg/storage/minio.go#L40-L66)
* **Axis:** Correctness & Architecture
* **Problem:**
  1. `UploadFile` returns a formatted path: `/storage/private-media/posts/...` or `/storage/private-media/products/...`.
  2. In `post.go`, `signPaidMedia` and `GetByID` check `if !strings.HasPrefix(url, "/storage/")`. Because `url` starts with `/storage/`, this condition evaluates to `false` and pre-signing is **never executed**. Private bucket files return 403 Forbidden to authorized purchasers.
  3. In `product.go:380`, `asset.FileURL` (`/storage/private-media/products/...`) is passed as `objectName` to `GetPresignedURL`. MinIO tries to sign the literal key `/storage/private-media/...` within bucket `private-media`, causing **404 NoSuchKey** errors when downloaded.
* **Remedy:** Store raw object keys (e.g. `posts/{id}/media/{file}`) or canonical relative storage paths consistently. In `GetPresignedURL`, strip `/storage/{bucket}/` prefix before passing to MinIO client.

---

#### 3. Sensitive KYC Identity Documents (KTP) Stored in Public Bucket
* **File:** [`be/internal/handler/kyc.go:92`](../be/internal/handler/kyc.go#L92)
* **Axis:** Security & Compliance
* **Problem:** `UploadFile` in `KYCHandler` stores uploaded KTP/ID card files into `h.cfg.MinIO.PublicBucket` (`public-media`). Indonesian Citizen IDs (KTP) containing National Identification Numbers (NIK), full names, and addresses become publicly accessible over the internet.
* **Remedy:** Store KYC files in `h.cfg.MinIO.PrivateBucket`. Provide admin endpoints that generate short-lived pre-signed URLs for KYC review.

---

### 🟡 Required Changes (Must address before release)

#### 4. Missing Database Transaction Atomicity on Financial Operations
* **Files:** 
  - [`be/internal/service/payment.go:261-366`](../be/internal/service/payment.go#L261-L366)
  - [`be/internal/service/chat.go:112-140`](../be/internal/service/chat.go#L112-L140)
* **Axis:** Architecture & Correctness
* **Problem:** `payWithCredits` and `chat.SendMessage` perform multiple mutating operations (buyer wallet debit, payment creation, purchase creation, creator credit addition, profile earnings increment) sequentially with individual database calls rather than wrapping them in a unified database transaction (`db.Transaction`). Errors during creator crediting are silenced with `_ =`.
* **Remedy:** Introduce a transactional execution boundary in the repository/service layer:
```go
err := s.db.Transaction(func(tx *gorm.DB) error {
    // 1. Deduct buyer credits (atomic condition)
    // 2. Insert Payment record
    // 3. Insert Purchase / Chat message record
    // 4. Add creator credits
    // 5. Insert CreditTransaction audit records (Buyer Spend + Creator Earning)
    return nil
})
```

---

#### 5. Missing `CreditTransaction` Audit Ledger Entries
* **Files:**
  - [`be/internal/service/chat.go:112-140`](../be/internal/service/chat.go#L112-L140) (Paid Chat)
  - [`be/internal/service/auth.go:190-201`](../be/internal/service/auth.go#L190-L201) (Referral Rewards)
* **Axis:** Correctness & Auditability
* **Problem:** When credits are transferred for paid chat messages or referral signups, wallet balances are modified via `AddCredits`/`DeductCredits`, but no `CreditTransaction` rows are inserted. Consequently, the transaction history page (`/wallet`) does not account for these balance changes.
* **Remedy:** Create `CreditTransaction` records with types `CreditTransactionSpend`, `CreditTransactionEarning`, and `CreditTransactionReferralReward` whenever wallet balances change.

---

#### 6. Detached Goroutine Using Request Context
* **File:** [`be/internal/service/payment.go:360-365`](../be/internal/service/payment.go#L360-L365)
* **Axis:** Correctness & Reliability
* **Problem:** `go s.mailer.SendDonationReceived(ctx, ...)` passes the incoming HTTP request `ctx` to a background goroutine. When the HTTP handler finishes, the context is cancelled, causing asynchronous mail delivery to abort.
* **Remedy:** Use `context.Background()` or `context.WithoutCancel(ctx)` (Go 1.21+) for background tasks.

---

#### 7. Inconsistent Transaction Sign Display in Frontend
* **Files:**
  - [`be/internal/service/payment.go:322`](../be/internal/service/payment.go#L322)
  - [`be/internal/service/admin.go:286`](../be/internal/service/admin.go#L286)
  - [`fe/app/wallet/page.tsx:70`](../fe/app/wallet/page.tsx#L70)
* **Axis:** Readability & UI Correctness
* **Problem:** In `payment.go`, `Credits` is stored as `-creditsNeeded` (e.g. `-5`). In `admin.go`, `Credits` is stored as `creditsToDeduct` (e.g. `50`). In `wallet/page.tsx`, the template evaluates:
  `{["topup", "refund", "earning"].includes(tx.type) ? "+" : "-"}{tx.credits} Credit`
  For spend transactions, this results in `--5 Credit`.
* **Remedy:** Always store `Credits` as absolute positive numbers in the database, and let the frontend format the sign based on transaction type, OR format using `Math.abs(tx.credits)`.

---

#### 8. Supporter Dashboard Prefix Matcher in Frontend Middleware
* **File:** [`fe/middleware.ts:4`](../fe/middleware.ts#L4)
* **Axis:** Security & Routing
* **Problem:** `authProtectedPrefixes` defines `"/s/"`. When navigating to the root supporter dashboard `/s`, `pathname.startsWith("/s/")` evaluates to `false`, allowing unauthenticated requests to bypass the middleware redirection check.
* **Remedy:** Update prefix to `"/s"` or check both `pathname === "/s"` and `pathname.startsWith("/s/")`.

---

### 🔵 Consider / Optional (Suggestions & Improvements)

#### 9. N+1 Queries on Feed Membership Checks
* **File:** [`be/internal/service/post.go:616-620`](../be/internal/service/post.go#L616-L620)
* **Axis:** Performance
* **Problem:** In `applyLockBatch`, the code loops over posts and queries `CheckMembership` or `CheckMembershipTier` individually for each post.
* **Remedy:** Batch query active memberships for the viewer against all distinct `creator_id`s present in the post batch: `FindMembershipsByCreators(ctx, viewerID, creatorIDs)`.

#### 10. Struct Field Name vs JSON Key in Validator
* **File:** [`be/internal/pkg/validator/validator.go:42`](../be/internal/pkg/validator/validator.go#L42)
* **Axis:** Readability & Client API Consistency
* **Problem:** `fe.Field()` outputs struct field names (e.g. `PageSlug`) rather than JSON tags (`page_slug`).
* **Remedy:** Register a tag name resolver with `validator.New()`:
```go
v := validator.New()
v.RegisterTagNameFunc(func(fld reflect.StructField) string {
    name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
    if name == "-" { return "" }
    return name
})
```

#### 11. Nginx Cache for Pre-signed URLs
* **File:** [`nginx/nginx.production.conf:97-105`](../nginx/nginx.production.conf#L97-L105)
* **Axis:** Performance & Security
* **Problem:** Nginx caches `location /storage/` for 1 hour with `proxy_cache_valid 200 1h`. If pre-signed URLs from the private bucket are cached, unauthorized users or expired link holders might access cached content.
* **Remedy:** Configure `proxy_cache_bypass $http_authorization` or bypass caching when URL contains signature parameters (`$arg_X_Amz_Signature`).

---

### ⚪ Nits (Minor Cleanups)
* **Unused Folder:** [`Apps/`](../Apps) is empty in the root directory.
* **Image Accessibility:** Add missing `alt` attributes in [`fe/app/dashboard/posts/page.tsx:130,236`](../fe/app/dashboard/posts/page.tsx#L130).
* **Next.js Custom Font:** Move font stylesheet links from [`fe/app/layout.tsx:44`](../fe/app/layout.tsx#L44) to `next/font/google` in accordance with Next.js 14 recommendations.
* **React Hooks Dependency:** Add `debouncedSearch` to dependencies in [`fe/lib/use-admin-list.ts:53`](../fe/lib/use-admin-list.ts#L53).

---

## 3. Review Checklist & Verdict

| Dimension | Assessment | Details |
|---|---|---|
| **Correctness** | ⚠️ Issues Found | Members-only gating bypass, private presigning bugs, transaction sign formatting |
| **Readability** | ✅ Good | Consistent naming, clear packages, typed DTOs |
| **Architecture** | ⚠️ Minor Debt | Compensatory rollbacks instead of DB transactions; audit gaps |
| **Security** | ⚠️ Issues Found | KYC PII stored in public bucket; unauthenticated route bypass on `/s` |
| **Performance** | ✅ Good | Gzip enabled, Redis caching, pagination in place; batch membership check recommended |

### Final Verdict: ⚠️ **REQUEST CHANGES**
Addressing the 3 Critical issues and 4 Required structural fixes will bring the codebase to production-grade reliability and security.

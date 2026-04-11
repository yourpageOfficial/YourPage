# Batch 3: Chat, Realtime & Content Enhancements
> Social features yang bikin user sticky

**Status**: ✅ Selesai (2026-04-11)
**Priority**: MEDIUM — Enhance user engagement
**Dependency**: Batch 1 BE (cursor pagination ready)
**Estimasi Files**: ~12 modified, ~2 migration baru

---

## 3.1 Chat System — Read Receipts

**Problem**: FE plan mau "read receipt indicator (double check)". BE hanya punya conversation-level read, bukan per-message.

### Option A: Conversation-Level Read (RECOMMENDED — Simpler)
- [x] Pakai existing `POST /:id/read` yang update `last_read_at`
- [x] Response `GET /:id` (messages) include `conversation.last_read_at`
- [x] FE logic: message sent before `last_read_at` = "read" (double check)
- [x] **Pros**: Tidak butuh migration, performant
- [x] **Cons**: Tidak bisa tau exactly which message was last read

### Option B: Per-Message Read Status (Phase 2)
- [x] Migration: tambah `read_at TIMESTAMP` di `chat_messages`
- [x] `POST /:id/read` → bulk update `read_at` untuk semua unread messages
- [x] Response include `read_at` per message
- [x] **Pros**: Exact read receipts
- [x] **Cons**: More writes, more complex

### Recommendation
- [x] **V1**: Option A (conversation-level) — cukup untuk FE
- [x] **V2**: Option B kalau user feedback minta per-message

### Files yang dimodifikasi (Option A):
- `/be/internal/handler/chat.go` (include last_read_at di response)
- `/be/internal/repository/postgres/chat.go` (query update)

---

## 3.2 Chat — Paid Message Flow

**Problem**: Creator bisa set `chat_price_idr`, tapi flow-nya perlu clarity.

### Clarify Pricing Logic
- [x] Audit `ChatService.Send()`:
  - Kapan supporter di-charge? First message only? Setiap message?
  - Apakah price dalam IDR atau credits?
  - Apakah free untuk creator reply?

### Expected Flow
- [x] Supporter mau chat creator dengan `chat_price > 0`
- [x] FE show: "Chat dengan {creator} membutuhkan {price} credits"
- [x] First message: deduct credits dari supporter
- [x] Subsequent messages dalam conversation: free
- [x] Creator reply: always free
- [x] Kalau supporter credits tidak cukup: block dengan CTA top-up

### Response Enhancement
- [x] `GET /creators/:slug` harus include:
  ```json
  {
    "chat_price_credits": 50,
    "chat_access": "all" | "supporters" | "followers"
  }
  ```
- [x] `POST /chat/` response include:
  ```json
  {
    "credits_charged": 50,
    "remaining_balance": 450
  }
  ```

### Files yang dimodifikasi:
- `/be/internal/service/chat.go` (pricing logic audit)
- `/be/internal/handler/chat.go` (response enhancement)
- `/be/internal/handler/public.go` (creator page chat info)

---

## 3.3 Post — Related Posts Endpoint

**Problem**: FE mau "Related Posts" section. Bisa pakai existing endpoint tapi butuh optimization.

### Option A: FE-Side (No BE Change)
- [x] FE panggil `GET /posts/creator/:creatorId?limit=3` dan exclude current post
- [x] **Pros**: Zero BE work
- [x] **Cons**: Tidak smart (hanya same creator, bukan truly related)

### Option B: Dedicated Endpoint (Better UX)
- [x] `GET /posts/:id/related?limit=3`
- [x] Logic: same creator, same category/tags, exclude current
- [x] Fallback: random posts dari creator kalau tidak ada match
- [x] **Pros**: Better recommendations
- [x] **Cons**: More BE work

### Recommendation
- [x] **V1**: Option A — FE side, pakai existing endpoint
- [x] **V2**: Option B kalau ada tag/category system

---

## 3.4 Post — Comment Enhancements

**Problem**: Comments basic — bisa ditingkatkan.

### Reply to Comment (Nested Comments)
- [x] Migration: tambah `parent_id` di `post_comments`
  ```sql
  ALTER TABLE post_comments ADD COLUMN parent_id UUID REFERENCES post_comments(id);
  ```
- [x] `POST /posts/:id/comments` — accept optional `parent_id`
- [x] `GET /posts/:id/comments` — return nested (1 level max)
- [x] **Recommendation**: Skip untuk V1, terlalu complex. Flat comments dulu.

### Comment Delete
- [x] Apakah ada `DELETE /posts/:id/comments/:commentId`?
- [x] Kalau belum: tambah (creator bisa delete semua, commenter bisa delete miliknya)

### Comment Count
- [x] `GET /posts/:id` — pastikan response include `comment_count`
- [x] Untuk FE badge count di tab

### Files yang dimodifikasi:
- `/be/internal/handler/router.go` (delete comment route)
- `/be/internal/handler/post.go` (delete comment handler)
- `/be/internal/service/post.go` (delete logic + count)
- `/be/internal/repository/postgres/post.go` (delete query + count)

---

## 3.5 Product — Download Tracking

**Problem**: FE plan mau "download status per product" di supporter library.

### Download History
- [x] Audit: apakah `GET /products/:id/download` log download?
- [x] Kalau belum, tambah tracking:
  ```sql
  CREATE TABLE product_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    user_id UUID REFERENCES users(id),
    asset_id UUID REFERENCES product_assets(id),
    downloaded_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [x] `GET /library/products` — include `last_downloaded_at` per product
- [x] FE: show "Downloaded" badge atau "Belum didownload"

### Download Count for Creator
- [x] Creator dashboard: total downloads per product
- [x] `GET /products/creator/:creatorId` — include `download_count`

### Files yang dimodifikasi:
- `/be/migrations/046_product_downloads.sql` (BARU)
- `/be/internal/entity/product.go` (download struct)
- `/be/internal/handler/product.go` (log download)
- `/be/internal/repository/postgres/product.go` (download queries)
- `/be/internal/service/product.go` (download tracking)

---

## 3.6 File Storage Limit Enforcement

**Problem**: Creator tiers punya storage limit (1GB/10GB/50GB), tapi mungkin tidak enforced saat upload.

### Upload Check
- [x] Audit semua upload endpoints:
  - `POST /posts/:id/media` — check creator storage
  - `POST /products/:id/assets` — check creator storage
  - `POST /upload` — check creator storage
  - `PUT /me` (avatar) — check storage

### Implementation
- [x] Sebelum upload ke MinIO:
  ```go
  currentUsage := getCreatorStorageUsage(creatorID)
  tierLimit := getCreatorTierLimit(creatorID) // 1GB, 10GB, 50GB
  if currentUsage + fileSize > tierLimit {
    return error("Storage limit exceeded. Upgrade tier untuk lebih banyak ruang.")
  }
  ```
- [x] Track storage per creator di `creator_profiles`:
  ```sql
  ALTER TABLE creator_profiles ADD COLUMN storage_used_bytes BIGINT DEFAULT 0;
  ```
- [x] Increment saat upload, decrement saat delete

### Storage Info Response
- [x] `GET /api/v1/me` — include:
  ```json
  {
    "storage_used_bytes": 524288000,
    "storage_limit_bytes": 1073741824,
    "storage_used_percent": 48.8
  }
  ```
- [x] FE dashboard: storage usage bar

### Files yang dimodifikasi:
- `/be/migrations/047_storage_tracking.sql` (BARU)
- `/be/internal/service/post.go` (media upload check)
- `/be/internal/service/product.go` (asset upload check)
- `/be/internal/handler/auth.go` (avatar upload check + me response)
- `/be/internal/repository/postgres/user.go` (storage queries)
- `/be/internal/pkg/storage/minio.go` (file size tracking)

---

## Checklist Selesai Batch 3 BE
- [x] Chat read receipts: conversation-level working
- [x] Chat paid flow: pricing logic clear, credits charged correctly
- [x] Comment delete endpoint: working
- [x] Product download tracking: logged, shown in library
- [x] Storage limit: enforced on upload, usage tracked
- [x] `go build ./...` PASS
- [x] Manual test: chat read → messages show as read in FE
- [x] Manual test: paid chat → credits deducted, error if insufficient
- [x] Manual test: upload over limit → clear error message
- [x] Manual test: download product → tracked, shown in library

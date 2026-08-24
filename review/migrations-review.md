# Database Migrations & Schema Architecture Review: YourPage

**Project:** YourPage (Backend PostgreSQL Schema)  
**Date:** 2026-08-23  
**Migration Tool:** Goose (`github.com/pressly/goose/v3`)  
**Directory:** `be/migrations/` (46 migration files, `0001` to `0047`)  
**Status:** ⚠️ **Operational with Optimization & Hygiene Findings**

---

## 1. Executive Summary

The database architecture for **YourPage** covers a rich feature set across user management, creator profiles, posts with tiered access, digital goods delivery, QRIS credit topups, payments, live chat, OBS stream overlays, fan memberships, and audit logging.

Overall, the schema is **well-structured with strong relational integrity** (UUID primary keys, foreign key constraints, check constraints against negative balances). However, the migration history has accumulated several **redundant indexes, naming collisions preventing composite index creation, empty rollback scripts, and slight timestamp inconsistencies**.

---

## 2. Key Findings & Analysis

### 🚨 1. Index Name Collisions & Silent Index Skips (High Priority)

In [`0045_performance_indexes.sql`](../be/migrations/0045_performance_indexes.sql), several `CREATE INDEX IF NOT EXISTS` statements reuse index names that already exist from earlier migrations with different column definitions. In PostgreSQL, `IF NOT EXISTS` checks the **index name**, not the table columns:

| Index Name | Existing in Migration | Attempted in `0045` | Result in Postgres |
|---|---|---|---|
| `idx_memberships_creator` | [`0042`](../be/migrations/0042_fan_membership.sql#L27): `ON memberships(creator_id)` | `ON memberships(creator_id, status)` | ❌ **Silently skipped** (Composite index not created) |
| `idx_memberships_expires` | [`0042`](../be/migrations/0042_fan_membership.sql#L28): `ON memberships(expires_at)` | `ON memberships(status, expires_at)` | ❌ **Silently skipped** (Composite index not created) |
| `idx_payments_status` | [`0019`](../be/migrations/0019_perf_indexes.sql#L3): `ON payments(status)` | `ON payments(status)` | ⚠️ **Duplicate execution** (No-op) |
| `idx_credit_transactions_user` | [`0019`](../be/migrations/0019_perf_indexes.sql#L10): `ON credit_transactions(user_id, created_at DESC)` | `ON credit_transactions(user_id, created_at DESC)` | ⚠️ **Duplicate execution** (No-op) |

---

### ⚠️ 2. Duplicate Indexes (Wasting Storage & Write I/O)

Because different index names were used for the exact same columns, PostgreSQL creates and maintains multiple identical indexes on disk:

1. **`creator_profiles` (User ID & Slug):**
   - [`0003_creator_profiles.sql:17-18`](../be/migrations/0003_creator_profiles.sql#L17-L18): `idx_creator_profiles_user_id` & `idx_creator_profiles_page_slug` (UNIQUE)
   - [`0020_perf_indexes_v2.sql:4-5`](../be/migrations/0020_perf_indexes_v2.sql#L4-L5): `idx_creator_profiles_user_id` & `idx_creator_profiles_slug` (Non-unique duplicate)
2. **`follows` (Creator & Follower):**
   - [`0013_follows.sql:10-11`](../be/migrations/0013_follows.sql#L10-L11): `idx_follows_creator_id` & `idx_follows_follower_id`
   - [`0045_performance_indexes.sql:8-9`](../be/migrations/0045_performance_indexes.sql#L8-L9): `idx_follows_creator` & `idx_follows_follower`
3. **`chat_messages` (Conversation message timeline):**
   - [`0029_chat.sql:25`](../be/migrations/0029_chat.sql#L25): `idx_chat_msg_conv ON chat_messages(conversation_id, created_at DESC)`
   - [`0045_performance_indexes.sql:11`](../be/migrations/0045_performance_indexes.sql#L11): `idx_chat_messages_conv ON chat_messages(conversation_id, created_at DESC)`

---

### 🛡️ 3. Data Types & Integrity

#### A. `TIMESTAMP` vs `TIMESTAMPTZ` Consistency
* Migrations `0001` through `0045` consistently use `TIMESTAMPTZ` (UTC timestamps with timezone).
* [`0046_account_management.sql`](../be/migrations/0046_account_management.sql#L3-L5) and [`0047_product_downloads.sql`](../be/migrations/0047_product_downloads.sql#L7) introduced bare `TIMESTAMP` columns (`deletion_scheduled_at`, `ban_expires_at`, `downloaded_at`).
* **Impact:** Can cause timezone offset bugs when comparing dates across Go servers running in UTC vs local database time.

#### B. Wallet Positive Balance Guardrail
* [`0044_wallet_constraint.sql`](../be/migrations/0044_wallet_constraint.sql#L5) added `CHECK (balance_credits >= 0)`. This provides strong database-level defense against race conditions causing negative wallet balances.

---

### 🔄 4. Migration Tooling & Rollback Safety

1. **Missing Down Migrations in Recent Batches:**
   - [`0045_performance_indexes.sql:17`](../be/migrations/0045_performance_indexes.sql#L17) has empty `-- +goose Down`.
   - [`0046_account_management.sql:7`](../be/migrations/0046_account_management.sql#L7) has empty `-- +goose Down`.
   - [`0047_product_downloads.sql:12`](../be/migrations/0047_product_downloads.sql#L12) has empty `-- +goose Down`.
   - Running `goose down` on these will not roll back the tables/columns.
2. **Migration Sequence Numbering Gap:**
   - There is a jump from `0021_platform_withdrawals.sql` to `0023_referral.sql` (number `0022` was skipped). Goose handles alphabetical/numerical sorting, but sequential numbering avoids team confusion.

---

## 3. Schema Strength Summary

| Table / Feature | Schema Quality | Highlights & Safeguards |
|---|---|---|
| **Users & Auth** | 🟢 Excellent | UUID PKs, unique email/username, soft delete support (`deleted_at`), ban status, email verification. |
| **Wallets & Ledger** | 🟢 Solid | Check constraint `balance_credits >= 0`, `CreditTransaction` audit records with enum type constraints. |
| **Payments & Topup** | 🟢 Solid | External ID indexing, payment provider enum, net/fee split calculation columns. |
| **Posts & Media** | 🟢 Solid | Partial index for published posts, sort order on media, tier gating FK with `ON DELETE SET NULL`. |
| **Memberships & Chat** | 🟢 Solid | Unique `(supporter_id, creator_id)` per conversation and membership, auto-renew flag. |

---

## 4. Recommended Cleanup Migration

Create a cleanup migration (e.g. `0048_schema_cleanup.sql`) with the following optimizations:

```sql
-- +goose Up
-- 1. Drop duplicate indexes
DROP INDEX IF EXISTS idx_creator_profiles_slug;
DROP INDEX IF EXISTS idx_follows_creator;
DROP INDEX IF EXISTS idx_follows_follower;
DROP INDEX IF EXISTS idx_chat_messages_conv;

-- 2. Create the proper composite indexes that were skipped in 0045
CREATE INDEX IF NOT EXISTS idx_memberships_creator_status ON memberships(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_status_expires ON memberships(status, expires_at);

-- 3. Add missing FK index for post membership tier
CREATE INDEX IF NOT EXISTS idx_posts_membership_tier ON posts(membership_tier_id);

-- 4. Standardize timestamps to TIMESTAMPTZ
ALTER TABLE users ALTER COLUMN deletion_scheduled_at TYPE TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN ban_expires_at TYPE TIMESTAMPTZ;
ALTER TABLE product_downloads ALTER COLUMN downloaded_at TYPE TIMESTAMPTZ;

-- +goose Down
DROP INDEX IF EXISTS idx_posts_membership_tier;
DROP INDEX IF EXISTS idx_memberships_status_expires;
DROP INDEX IF EXISTS idx_memberships_creator_status;
```

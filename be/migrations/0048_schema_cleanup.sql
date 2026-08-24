-- +goose Up
-- 1. Drop redundant / duplicate indexes to reclaim storage and write I/O
DROP INDEX IF EXISTS idx_creator_profiles_slug;
DROP INDEX IF EXISTS idx_follows_creator;
DROP INDEX IF EXISTS idx_follows_follower;
DROP INDEX IF EXISTS idx_chat_messages_conv;

-- 2. Create the composite indexes that were skipped in 0045 due to name collisions
CREATE INDEX IF NOT EXISTS idx_memberships_creator_status ON memberships(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_status_expires ON memberships(status, expires_at);

-- 3. Add foreign key index for post membership tier gating
CREATE INDEX IF NOT EXISTS idx_posts_membership_tier ON posts(membership_tier_id);

-- 4. Standardize timestamps to TIMESTAMPTZ
ALTER TABLE users ALTER COLUMN deletion_scheduled_at TYPE TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN ban_expires_at TYPE TIMESTAMPTZ;
ALTER TABLE product_downloads ALTER COLUMN downloaded_at TYPE TIMESTAMPTZ;

-- +goose Down
DROP INDEX IF EXISTS idx_posts_membership_tier;
DROP INDEX IF EXISTS idx_memberships_status_expires;
DROP INDEX IF EXISTS idx_memberships_creator_status;
ALTER TABLE product_downloads ALTER COLUMN downloaded_at TYPE TIMESTAMP;
ALTER TABLE users ALTER COLUMN ban_expires_at TYPE TIMESTAMP;
ALTER TABLE users ALTER COLUMN deletion_scheduled_at TYPE TIMESTAMP;

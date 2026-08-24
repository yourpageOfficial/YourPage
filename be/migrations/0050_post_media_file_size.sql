-- +goose Up
-- Track media size so deleting media can release the creator's storage quota.
ALTER TABLE post_media ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT NOT NULL DEFAULT 0;

-- Storage usage must never go negative when historical rows report size 0.
UPDATE creator_profiles SET storage_used_bytes = 0 WHERE storage_used_bytes < 0;

-- +goose Down
ALTER TABLE post_media DROP COLUMN IF EXISTS file_size_bytes;

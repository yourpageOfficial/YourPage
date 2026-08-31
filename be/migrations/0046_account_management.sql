-- +goose Up
-- Batch 10: Account deletion + suspension enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS ban_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS ban_reason;
ALTER TABLE users DROP COLUMN IF EXISTS deletion_scheduled_at;

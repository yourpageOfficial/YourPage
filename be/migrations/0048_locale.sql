-- +goose Up
-- Batch 15: Add language preference to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'id';

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS locale;
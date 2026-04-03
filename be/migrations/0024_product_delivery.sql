-- +goose Up
ALTER TABLE products ADD COLUMN delivery_type VARCHAR(20) NOT NULL DEFAULT 'file';
ALTER TABLE products ADD COLUMN delivery_url TEXT;
ALTER TABLE products ADD COLUMN delivery_note TEXT;

-- +goose Down
ALTER TABLE products DROP COLUMN IF EXISTS delivery_note;
ALTER TABLE products DROP COLUMN IF EXISTS delivery_url;
ALTER TABLE products DROP COLUMN IF EXISTS delivery_type;

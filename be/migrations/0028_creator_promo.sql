-- +goose Up
ALTER TABLE creator_profiles ADD COLUMN promo_fee_percent INT;
ALTER TABLE creator_profiles ADD COLUMN promo_fee_expires_at TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE creator_profiles ADD COLUMN featured_order INT NOT NULL DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN admin_note TEXT;

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS admin_note;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS featured_order;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS is_featured;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS promo_fee_expires_at;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS promo_fee_percent;

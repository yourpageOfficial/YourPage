-- +goose Up
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS last_broadcast_at TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE creator_tiers ADD COLUMN IF NOT EXISTS max_overlay_tiers INT NOT NULL DEFAULT 3;
UPDATE creator_tiers SET max_overlay_tiers = 3 WHERE name = 'Free';
UPDATE creator_tiers SET max_overlay_tiers = 10 WHERE name = 'Pro';
UPDATE creator_tiers SET max_overlay_tiers = -1 WHERE name = 'Business';

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS last_broadcast_at;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS category;
ALTER TABLE creator_tiers DROP COLUMN IF EXISTS max_overlay_tiers;

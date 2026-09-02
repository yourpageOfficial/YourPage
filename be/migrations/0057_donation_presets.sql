-- +goose Up
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS donation_preset_amounts JSONB NOT NULL DEFAULT '[5000,10000,25000,50000,100000]';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS donation_min_amount INT NOT NULL DEFAULT 1000;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS donation_enabled BOOLEAN NOT NULL DEFAULT true;

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS donation_preset_amounts;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS donation_min_amount;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS donation_enabled;

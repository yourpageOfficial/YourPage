-- +goose Up
ALTER TABLE posts ADD COLUMN IF NOT EXISTS membership_tier_id UUID REFERENCES membership_tiers(id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE posts DROP COLUMN IF EXISTS membership_tier_id;

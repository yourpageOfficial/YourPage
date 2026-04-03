-- +goose Up
ALTER TABLE creator_tiers ADD COLUMN storage_bytes BIGINT NOT NULL DEFAULT 1073741824;

UPDATE creator_tiers SET storage_bytes = 1073741824 WHERE name = 'Free';
UPDATE creator_tiers SET storage_bytes = 10737418240 WHERE name = 'Pro';
UPDATE creator_tiers SET storage_bytes = 53687091200 WHERE name = 'Business';

-- Update existing creator storage quotas based on tier
UPDATE creator_profiles SET storage_quota_bytes = 1073741824 WHERE tier_id = (SELECT id FROM creator_tiers WHERE name = 'Free');
UPDATE creator_profiles SET storage_quota_bytes = 10737418240 WHERE tier_id = (SELECT id FROM creator_tiers WHERE name = 'Pro');
UPDATE creator_profiles SET storage_quota_bytes = 53687091200 WHERE tier_id = (SELECT id FROM creator_tiers WHERE name = 'Business');

-- +goose Down
ALTER TABLE creator_tiers DROP COLUMN IF EXISTS storage_bytes;

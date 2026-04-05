ALTER TABLE posts ADD COLUMN IF NOT EXISTS membership_tier_id UUID REFERENCES membership_tiers(id) ON DELETE SET NULL;

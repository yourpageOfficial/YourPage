-- +goose Up
CREATE TABLE membership_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    price_credits INT NOT NULL,
    description TEXT,
    perks TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_membership_tiers_creator ON membership_tiers(creator_id, sort_order);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supporter_id UUID NOT NULL REFERENCES users(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    tier_id UUID NOT NULL REFERENCES membership_tiers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(supporter_id, creator_id)
);
CREATE INDEX idx_memberships_supporter ON memberships(supporter_id);
CREATE INDEX idx_memberships_creator ON memberships(creator_id);
CREATE INDEX idx_memberships_expires ON memberships(expires_at);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public';

-- +goose Down
ALTER TABLE posts DROP COLUMN IF EXISTS visibility;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS membership_tiers;

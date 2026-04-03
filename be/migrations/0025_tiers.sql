-- +goose Up
CREATE TABLE creator_tiers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,
    price_idr       BIGINT NOT NULL DEFAULT 0,
    max_products    INT NOT NULL DEFAULT 3,
    fee_percent     INT NOT NULL DEFAULT 15,
    badge           VARCHAR(50) NOT NULL DEFAULT '',
    features        JSONB NOT NULL DEFAULT '[]',
    sort_order      INT NOT NULL DEFAULT 0
);

INSERT INTO creator_tiers (name, price_idr, max_products, fee_percent, badge, features, sort_order) VALUES
('Free', 0, 3, 15, '', '["Post berbayar","Produk digital (max 3)","Analytics basic"]', 0),
('Pro', 99000, -1, 10, 'Pro', '["Semua fitur Free","Produk unlimited","Analytics advanced","Custom page","Scheduled posts","Pro badge"]', 1),
('Business', 249000, -1, 7, 'Business', '["Semua fitur Pro","Fee 7%","Export analytics","Priority support","Email blast","Business badge"]', 2);

ALTER TABLE creator_profiles ADD COLUMN tier_id UUID REFERENCES creator_tiers(id);
ALTER TABLE creator_profiles ADD COLUMN tier_expires_at TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN custom_fee_percent INT;

UPDATE creator_profiles SET tier_id = (SELECT id FROM creator_tiers WHERE name = 'Free');

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS custom_fee_percent;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS tier_expires_at;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS tier_id;
DROP TABLE IF EXISTS creator_tiers;

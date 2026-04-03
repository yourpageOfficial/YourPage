-- +goose Up
CREATE TABLE overlay_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    min_credits INT NOT NULL DEFAULT 1,
    image_url TEXT NOT NULL,
    sound_url TEXT,
    label VARCHAR(100),
    sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_overlay_tiers_creator ON overlay_tiers(creator_id, sort_order);

ALTER TABLE creator_profiles ADD COLUMN overlay_text_template TEXT NOT NULL DEFAULT '{donor} donated {amount} Credit!';

ALTER TABLE donations ADD COLUMN media_url TEXT;

-- +goose Down
ALTER TABLE donations DROP COLUMN IF EXISTS media_url;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_text_template;
DROP TABLE IF EXISTS overlay_tiers;

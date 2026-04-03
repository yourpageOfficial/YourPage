-- +goose Up
ALTER TABLE posts ADD COLUMN scheduled_at TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN page_color VARCHAR(20);

-- +goose Down
ALTER TABLE posts DROP COLUMN IF EXISTS scheduled_at;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS page_color;

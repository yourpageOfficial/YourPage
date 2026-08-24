-- +goose Up
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm ON users USING gin(display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin(username gin_trgm_ops);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_creator_profiles_tags ON creator_profiles USING gin(tags);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS tags;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS category;
DROP INDEX IF EXISTS idx_users_display_name_trgm;
DROP INDEX IF EXISTS idx_users_username_trgm;
DROP INDEX IF EXISTS idx_creator_profiles_tags;

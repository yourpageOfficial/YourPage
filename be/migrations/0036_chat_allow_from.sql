-- +goose Up
ALTER TABLE creator_profiles
    ADD COLUMN chat_allow_from VARCHAR(20) NOT NULL DEFAULT 'all'
    CHECK (chat_allow_from IN ('all', 'supporter_only', 'creator_only', 'none'));

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS chat_allow_from;

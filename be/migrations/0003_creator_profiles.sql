-- +goose Up
CREATE TABLE creator_profiles (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_slug        VARCHAR(100) NOT NULL,
    header_image_url TEXT,
    social_links     JSONB NOT NULL DEFAULT '{}',
    is_monetized     BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    total_earnings   BIGINT NOT NULL DEFAULT 0,
    balance_idr      BIGINT NOT NULL DEFAULT 0,
    follower_count   BIGINT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_creator_profiles_user_id   ON creator_profiles(user_id);
CREATE UNIQUE INDEX idx_creator_profiles_page_slug ON creator_profiles(page_slug);

-- +goose Down
DROP TABLE IF EXISTS creator_profiles;

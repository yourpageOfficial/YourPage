-- +goose Up
CREATE TABLE posts (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    content      TEXT NOT NULL DEFAULT '',
    excerpt      TEXT,
    access_type  VARCHAR(10) NOT NULL DEFAULT 'free'
                 CHECK (access_type IN ('free', 'paid')),
    price        BIGINT,
    status       VARCHAR(20) NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'published')),
    view_count   BIGINT NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_posts_creator_id   ON posts(creator_id);
CREATE INDEX idx_posts_status       ON posts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published_at ON posts(published_at DESC NULLS LAST) WHERE status = 'published' AND deleted_at IS NULL;

-- +goose Down
DROP TABLE IF EXISTS posts;

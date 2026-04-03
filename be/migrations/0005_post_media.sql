-- +goose Up
CREATE TABLE post_media (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    thumb_url  TEXT,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image'
               CHECK (media_type IN ('image', 'video', 'audio', 'document')),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);

-- +goose Down
DROP TABLE IF EXISTS post_media;

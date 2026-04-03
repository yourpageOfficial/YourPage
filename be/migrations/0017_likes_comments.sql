-- +goose Up
CREATE TABLE post_likes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_post_likes_unique ON post_likes(post_id, user_id);

ALTER TABLE posts ADD COLUMN like_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN comment_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE post_comments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

-- +goose Down
DROP TABLE IF EXISTS post_comments;
ALTER TABLE posts DROP COLUMN IF EXISTS comment_count;
ALTER TABLE posts DROP COLUMN IF EXISTS like_count;
DROP TABLE IF EXISTS post_likes;

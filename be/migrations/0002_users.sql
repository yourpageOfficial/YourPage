-- +goose Up
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL,
    username      VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  VARCHAR(255) NOT NULL DEFAULT '',
    avatar_url    TEXT,
    bio           TEXT,
    role          VARCHAR(20) NOT NULL DEFAULT 'supporter'
                  CHECK (role IN ('admin', 'creator', 'supporter')),
    is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email    ON users(email)    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX        idx_users_role     ON users(role);

-- +goose Down
DROP TABLE IF EXISTS users;

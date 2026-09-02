-- +goose Up
CREATE TABLE IF NOT EXISTS password_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_histories_user ON password_histories(user_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS password_histories;

-- +goose Up
CREATE TABLE IF NOT EXISTS leaderboard_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    period VARCHAR(20) NOT NULL DEFAULT 'all_time',
    max_entries INT NOT NULL DEFAULT 10,
    show_amount BOOLEAN NOT NULL DEFAULT true,
    title VARCHAR(100) NOT NULL DEFAULT 'Top Supporters',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS leaderboard_settings;

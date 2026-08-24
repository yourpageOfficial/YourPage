-- +goose Up
CREATE TABLE IF NOT EXISTS media_share_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    price_credits INT NOT NULL DEFAULT 5,
    allowed_types VARCHAR(50) NOT NULL DEFAULT 'image,gif',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    sender_id UUID REFERENCES users(id),
    sender_name VARCHAR(100) NOT NULL DEFAULT 'Anonim',
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_id UUID REFERENCES payments(id),
    played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_media_shares_creator ON media_shares(creator_id, status, created_at);

-- +goose Down
DROP TABLE IF EXISTS media_shares;
DROP TABLE IF EXISTS media_share_settings;

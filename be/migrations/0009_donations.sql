-- +goose Up
CREATE TABLE donations (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id     UUID NOT NULL REFERENCES users(id),
    supporter_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_id     UUID NOT NULL REFERENCES payments(id),
    amount_idr     BIGINT NOT NULL,
    net_amount_idr BIGINT NOT NULL DEFAULT 0,
    message        TEXT,
    donor_name     VARCHAR(255) NOT NULL DEFAULT 'Anonim',
    donor_email    VARCHAR(255) NOT NULL DEFAULT '',
    is_anonymous   BOOLEAN NOT NULL DEFAULT FALSE,
    status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_creator_id   ON donations(creator_id);
CREATE INDEX idx_donations_supporter_id ON donations(supporter_id);
CREATE INDEX idx_donations_status       ON donations(status);

-- +goose Down
DROP TABLE IF EXISTS donations;

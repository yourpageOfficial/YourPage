-- +goose Up
CREATE TABLE user_wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance_credits BIGINT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_wallets_user_id ON user_wallets(user_id);

CREATE TABLE credit_transactions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id),
    type         VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'spend', 'refund')),
    credits      BIGINT NOT NULL,
    idr_amount   BIGINT NOT NULL DEFAULT 0,
    payment_id   UUID REFERENCES payments(id) ON DELETE SET NULL,
    reference_id UUID,
    description  TEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);

CREATE TABLE credit_topup_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    amount_idr      BIGINT NOT NULL,
    credits         BIGINT NOT NULL,
    donor_name      VARCHAR(255) NOT NULL DEFAULT '',
    proof_image_url TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'failed')),
    admin_note      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_topup_requests_user_id ON credit_topup_requests(user_id);
CREATE INDEX idx_credit_topup_requests_status  ON credit_topup_requests(status);

-- +goose Down
DROP TABLE IF EXISTS credit_topup_requests;
DROP TABLE IF EXISTS credit_transactions;
DROP TABLE IF EXISTS user_wallets;

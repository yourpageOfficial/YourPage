-- +goose Up
CREATE TABLE withdrawals (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id     UUID NOT NULL REFERENCES users(id),
    amount_idr     BIGINT NOT NULL,
    bank_name      VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_name   VARCHAR(255) NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    admin_note     TEXT,
    processed_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_creator_id ON withdrawals(creator_id);
CREATE INDEX idx_withdrawals_status     ON withdrawals(status);

-- +goose Down
DROP TABLE IF EXISTS withdrawals;

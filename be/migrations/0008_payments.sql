-- +goose Up
CREATE TABLE payments (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id        VARCHAR(500) NOT NULL,
    provider           VARCHAR(20) NOT NULL
                       CHECK (provider IN ('xendit', 'paypal', 'qris_manual', 'credits')),
    usecase            VARCHAR(30) NOT NULL
                       CHECK (usecase IN ('post_purchase', 'product_purchase', 'donation', 'credit_topup')),
    reference_id       UUID NOT NULL,
    payer_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    amount_idr         BIGINT NOT NULL,
    fee_idr            BIGINT NOT NULL DEFAULT 0,
    net_amount_idr     BIGINT NOT NULL DEFAULT 0,
    status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
    qris_string        TEXT,
    qris_image_url     TEXT,
    paypal_order_id    VARCHAR(200),
    paypal_approve_url TEXT,
    expires_at         TIMESTAMPTZ,
    paid_at            TIMESTAMPTZ,
    webhook_payload    JSONB,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_payments_external_id ON payments(external_id);
CREATE INDEX        idx_payments_payer_id    ON payments(payer_id);
CREATE INDEX        idx_payments_status      ON payments(status);
CREATE INDEX        idx_payments_usecase     ON payments(usecase, reference_id);

-- +goose Down
DROP TABLE IF EXISTS payments;

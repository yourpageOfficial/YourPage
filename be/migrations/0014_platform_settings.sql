-- +goose Up
CREATE TABLE platform_settings (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_percent        INT NOT NULL DEFAULT 10,
    min_withdrawal_idr BIGINT NOT NULL DEFAULT 100000,
    credit_rate_idr    BIGINT NOT NULL DEFAULT 1000,
    platform_qris_url  TEXT,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO platform_settings (fee_percent, min_withdrawal_idr, credit_rate_idr)
VALUES (10, 100000, 1000);

-- +goose Down
DROP TABLE IF EXISTS platform_settings;

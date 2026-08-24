-- +goose Up
-- Immutable audit trail for every money/credit movement (topup, purchase, refund, withdrawal)
CREATE TABLE payment_audit_logs (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id       UUID,
    actor_role     TEXT NOT NULL DEFAULT 'system', -- user | admin | finance | system
    event          TEXT NOT NULL,                  -- topup.created, topup.paid, ...
    reference_type TEXT NOT NULL,                  -- topup | payment | withdrawal
    reference_id   UUID,
    amount_idr     BIGINT NOT NULL DEFAULT 0,
    credits        BIGINT NOT NULL DEFAULT 0,
    method         TEXT NOT NULL DEFAULT '',       -- qris | stripe | credits | bank
    detail         JSONB,
    ip_address     TEXT NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_audit_reference ON payment_audit_logs (reference_id);
CREATE INDEX idx_payment_audit_actor ON payment_audit_logs (actor_id);
CREATE INDEX idx_payment_audit_event ON payment_audit_logs (event);
CREATE INDEX idx_payment_audit_created ON payment_audit_logs (created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS payment_audit_logs;

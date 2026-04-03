-- +goose Up
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_logs(action, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS admin_audit_logs;

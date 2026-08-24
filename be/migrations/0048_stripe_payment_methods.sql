-- +goose Up
-- Payment methods manageable from admin dashboard: QRIS manual + Stripe
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS qris_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT NOT NULL DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT NOT NULL DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT NOT NULL DEFAULT '';

ALTER TABLE credit_topup_requests ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'qris';
ALTER TABLE credit_topup_requests ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_topup_stripe_session
    ON credit_topup_requests (stripe_session_id)
    WHERE stripe_session_id IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_topup_stripe_session;
ALTER TABLE credit_topup_requests DROP COLUMN IF EXISTS stripe_session_id;
ALTER TABLE credit_topup_requests DROP COLUMN IF EXISTS method;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS stripe_webhook_secret;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS stripe_secret_key;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS stripe_publishable_key;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS stripe_enabled;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS qris_enabled;

-- +goose Up
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    code VARCHAR(20) NOT NULL UNIQUE,
    reward_credits INT NOT NULL DEFAULT 10,
    used_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_referral_code ON referral_codes(code);

ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS referred_by;
DROP TABLE IF EXISTS referral_codes;

-- +goose Up
CREATE TABLE IF NOT EXISTS referral_uses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
    referred_user_id UUID NOT NULL REFERENCES users(id),
    reward_credits INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(referred_user_id)
);
CREATE INDEX idx_referral_uses_code ON referral_uses(referral_code_id);

-- +goose Down
DROP TABLE IF EXISTS referral_uses;

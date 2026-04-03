-- +goose Up
-- Merge creator earnings into wallet
-- Move balance_idr into user_wallets.balance_credits
UPDATE user_wallets w SET balance_credits = w.balance_credits + cp.balance_idr
FROM creator_profiles cp WHERE cp.user_id = w.user_id AND cp.balance_idr > 0;

-- Create wallets for creators who don't have one yet
INSERT INTO user_wallets (user_id, balance_credits)
SELECT cp.user_id, cp.balance_idr FROM creator_profiles cp
WHERE cp.user_id NOT IN (SELECT user_id FROM user_wallets) AND cp.balance_idr > 0;

-- Zero out balance_idr (keep column for now as backup)
UPDATE creator_profiles SET balance_idr = 0;

-- +goose Down
-- Cannot reliably reverse this migration

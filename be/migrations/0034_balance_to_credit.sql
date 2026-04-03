-- +goose Up
-- Convert balance_credits from IDR to Credit (divide by 1000)
UPDATE user_wallets SET balance_credits = balance_credits / 1000;

-- +goose Down
UPDATE user_wallets SET balance_credits = balance_credits * 1000;

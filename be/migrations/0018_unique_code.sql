-- +goose Up
ALTER TABLE payments ADD COLUMN unique_code INT NOT NULL DEFAULT 0;
ALTER TABLE credit_topup_requests ADD COLUMN unique_code INT NOT NULL DEFAULT 0;

-- +goose Down
ALTER TABLE payments DROP COLUMN IF EXISTS unique_code;
ALTER TABLE credit_topup_requests DROP COLUMN IF EXISTS unique_code;

-- +goose Up
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_usecase_check;
ALTER TABLE payments ADD CONSTRAINT payments_usecase_check CHECK (usecase IN ('post_purchase','product_purchase','donation','credit_topup','chat'));

-- +goose Down
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_usecase_check;
ALTER TABLE payments ADD CONSTRAINT payments_usecase_check CHECK (usecase IN ('post_purchase','product_purchase','donation','credit_topup'));

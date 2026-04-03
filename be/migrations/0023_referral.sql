-- +goose Up
ALTER TABLE follows ADD COLUMN referrer VARCHAR(100);
ALTER TABLE post_purchases ADD COLUMN referrer VARCHAR(100);
ALTER TABLE product_purchases ADD COLUMN referrer VARCHAR(100);

-- +goose Down
ALTER TABLE follows DROP COLUMN IF EXISTS referrer;
ALTER TABLE post_purchases DROP COLUMN IF EXISTS referrer;
ALTER TABLE product_purchases DROP COLUMN IF EXISTS referrer;

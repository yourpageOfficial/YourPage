-- +goose Up
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
-- Existing users are considered verified
UPDATE users SET email_verified = true;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

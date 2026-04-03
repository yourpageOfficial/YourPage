-- +goose Up
-- Admin user is created at runtime via ADMIN_EMAIL + ADMIN_PASSWORD env vars (see main.go).
-- This migration is intentionally a no-op to preserve migration history.
-- DO NOT add hardcoded credentials here.

-- +goose Down
-- No-op.

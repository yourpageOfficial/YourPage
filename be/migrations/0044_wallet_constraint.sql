-- +goose Up
-- +goose StatementBegin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_balance') THEN
    ALTER TABLE user_wallets ADD CONSTRAINT positive_balance CHECK (balance_credits >= 0);
  END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
ALTER TABLE user_wallets DROP CONSTRAINT IF EXISTS positive_balance;

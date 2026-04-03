-- +goose Up
ALTER TABLE creator_profiles ADD COLUMN donation_goal_amount BIGINT NOT NULL DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN donation_goal_title TEXT;
ALTER TABLE creator_profiles ADD COLUMN donation_goal_current BIGINT NOT NULL DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN welcome_message TEXT;

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS welcome_message;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS donation_goal_current;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS donation_goal_title;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS donation_goal_amount;

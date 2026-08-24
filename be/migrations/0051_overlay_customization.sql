-- +goose Up
-- Overlay customization so creators can style alerts without code,
-- matching what streamers expect from an alert box.
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_accent_color TEXT NOT NULL DEFAULT '#EC4899';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_text_color TEXT NOT NULL DEFAULT '#0F0D1A';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_font TEXT NOT NULL DEFAULT 'Outfit';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_duration_ms INT NOT NULL DEFAULT 8000;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_position TEXT NOT NULL DEFAULT 'center';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_sound_volume INT NOT NULL DEFAULT 80;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_tts_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS overlay_tts_min_credits INT NOT NULL DEFAULT 1;

-- Sanity bounds: a 0ms alert is invisible and an hour-long one blocks the queue.
ALTER TABLE creator_profiles ADD CONSTRAINT chk_overlay_duration
    CHECK (overlay_duration_ms BETWEEN 2000 AND 30000);
ALTER TABLE creator_profiles ADD CONSTRAINT chk_overlay_volume
    CHECK (overlay_sound_volume BETWEEN 0 AND 100);

-- +goose Down
ALTER TABLE creator_profiles DROP CONSTRAINT IF EXISTS chk_overlay_volume;
ALTER TABLE creator_profiles DROP CONSTRAINT IF EXISTS chk_overlay_duration;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_tts_min_credits;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_tts_enabled;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_sound_volume;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_position;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_duration_ms;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_font;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_text_color;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS overlay_accent_color;

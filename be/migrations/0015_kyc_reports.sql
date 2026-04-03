-- +goose Up

-- KYC untuk kreator sebelum withdrawal pertama
CREATE TABLE user_kyc (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ktp_image_url    TEXT NOT NULL,
    full_name        TEXT NOT NULL,
    id_number        VARCHAR(20) NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note       TEXT,
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_kyc_user_id ON user_kyc(user_id);
CREATE INDEX        idx_user_kyc_status  ON user_kyc(status);

-- Content reports (post / kreator)
CREATE TABLE content_reports (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    target_type  VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'product', 'user')),
    target_id    UUID NOT NULL,
    reason       VARCHAR(50) NOT NULL
                 CHECK (reason IN ('nsfw', 'plagiarism', 'scam', 'spam', 'other')),
    description  TEXT,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'resolved', 'dismissed')),
    admin_note   TEXT,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_reports_target   ON content_reports(target_type, target_id);
CREATE INDEX idx_content_reports_status   ON content_reports(status);
CREATE INDEX idx_content_reports_reporter ON content_reports(reporter_id);

-- Storage quota tracking per creator
ALTER TABLE creator_profiles ADD COLUMN storage_used_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN storage_quota_bytes BIGINT NOT NULL DEFAULT 5368709120; -- 5GB

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS storage_quota_bytes;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS storage_used_bytes;
DROP TABLE IF EXISTS content_reports;
DROP TABLE IF EXISTS user_kyc;

-- +goose Up
-- Batch 5.6: Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_creator_created ON posts(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_created ON payments(payer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_donations_creator ON donations(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_creator ON follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(supporter_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_creator ON memberships(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_expires ON memberships(status, expires_at);

-- +goose Down

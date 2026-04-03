-- +goose Up
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    supporter_id UUID NOT NULL REFERENCES users(id),
    last_message_at TIMESTAMPTZ,
    creator_unread INT NOT NULL DEFAULT 0,
    supporter_unread INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(creator_id, supporter_id)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    amount_idr BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_conv_creator ON chat_conversations(creator_id);
CREATE INDEX idx_chat_conv_supporter ON chat_conversations(supporter_id);
CREATE INDEX idx_chat_msg_conv ON chat_messages(conversation_id, created_at DESC);

-- Creator chat settings
ALTER TABLE creator_profiles ADD COLUMN chat_price_idr BIGINT NOT NULL DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN auto_reply TEXT;

-- +goose Down
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS auto_reply;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS chat_price_idr;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_conversations;

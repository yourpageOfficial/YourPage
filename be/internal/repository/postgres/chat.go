package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"gorm.io/gorm"
)

type ChatRepo struct{ db *gorm.DB }

func NewChatRepo(db *gorm.DB) *ChatRepo { return &ChatRepo{db: db} }

func (r *ChatRepo) FindOrCreateConversation(ctx context.Context, creatorID, supporterID uuid.UUID) (*entity.ChatConversation, error) {
	var conv entity.ChatConversation
	err := r.db.WithContext(ctx).Where("creator_id = ? AND supporter_id = ?", creatorID, supporterID).First(&conv).Error
	if err == gorm.ErrRecordNotFound {
		conv = entity.ChatConversation{ID: uuid.New(), CreatorID: creatorID, SupporterID: supporterID}
		err = r.db.WithContext(ctx).Create(&conv).Error
	}
	return &conv, err
}

func (r *ChatRepo) FindConversation(ctx context.Context, id uuid.UUID) (*entity.ChatConversation, error) {
	var conv entity.ChatConversation
	err := r.db.WithContext(ctx).Preload("Creator").Preload("Supporter").Where("id = ?", id).First(&conv).Error
	if err == gorm.ErrRecordNotFound { return nil, entity.ErrNotFound }
	return &conv, err
}

func (r *ChatRepo) ListConversations(ctx context.Context, userID uuid.UUID) ([]entity.ChatConversation, error) {
	var convs []entity.ChatConversation
	err := r.db.WithContext(ctx).Preload("Creator").Preload("Supporter").
		Where("creator_id = ? OR supporter_id = ?", userID, userID).
		Order("last_message_at DESC NULLS LAST").Find(&convs).Error
	return convs, err
}

func (r *ChatRepo) CreateMessage(ctx context.Context, msg *entity.ChatMessage) error {
	if err := r.db.WithContext(ctx).Create(msg).Error; err != nil { return err }
	now := time.Now()
	return r.db.WithContext(ctx).Model(&entity.ChatConversation{}).Where("id = ?", msg.ConversationID).
		Updates(map[string]interface{}{"last_message_at": now}).Error
}

func (r *ChatRepo) ListMessages(ctx context.Context, convID uuid.UUID, limit int) ([]entity.ChatMessage, error) {
	var msgs []entity.ChatMessage
	err := r.db.WithContext(ctx).Preload("Sender").Where("conversation_id = ?", convID).
		Order("created_at DESC").Limit(limit).Find(&msgs).Error
	return msgs, err
}

func (r *ChatRepo) IncrementUnread(ctx context.Context, convID uuid.UUID, forCreator bool) error {
	col := "supporter_unread"
	if forCreator { col = "creator_unread" }
	return r.db.WithContext(ctx).Model(&entity.ChatConversation{}).Where("id = ?", convID).
		Update(col, gorm.Expr(col+" + 1")).Error
}

func (r *ChatRepo) ResetUnread(ctx context.Context, convID uuid.UUID, forCreator bool) error {
	col := "supporter_unread"
	if forCreator { col = "creator_unread" }
	return r.db.WithContext(ctx).Model(&entity.ChatConversation{}).Where("id = ?", convID).
		Update(col, 0).Error
}

func (r *ChatRepo) CountTodayMessages(ctx context.Context, senderID uuid.UUID) (int64, error) {
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	err := r.db.WithContext(ctx).Model(&entity.ChatMessage{}).
		Where("sender_id = ? AND created_at >= ?", senderID, today).Count(&count).Error
	return count, err
}

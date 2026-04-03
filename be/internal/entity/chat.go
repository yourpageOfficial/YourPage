package entity

import (
	"time"

	"github.com/google/uuid"
)

type ChatConversation struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	CreatorID       uuid.UUID `json:"creator_id" gorm:"type:uuid"`
	SupporterID     uuid.UUID `json:"supporter_id" gorm:"type:uuid"`
	LastMessageAt   *time.Time `json:"last_message_at"`
	CreatorUnread   int       `json:"creator_unread" gorm:"default:0"`
	SupporterUnread int       `json:"supporter_unread" gorm:"default:0"`
	Creator         *User     `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	Supporter       *User     `json:"supporter,omitempty" gorm:"foreignKey:SupporterID"`
	CreatedAt       time.Time `json:"created_at"`
}

type ChatMessage struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ConversationID uuid.UUID `json:"conversation_id" gorm:"type:uuid"`
	SenderID       uuid.UUID `json:"sender_id" gorm:"type:uuid"`
	Content        string    `json:"content"`
	IsPaid         bool      `json:"is_paid" gorm:"default:false"`
	AmountIDR      int64     `json:"amount_idr" gorm:"column:amount_idr;default:0"`
	Sender         *User     `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	CreatedAt      time.Time `json:"created_at"`
}

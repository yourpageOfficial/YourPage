package entity

import (
	"github.com/google/uuid"
	"time"
)

type OverlayTier struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	CreatorID uuid.UUID `json:"creator_id" gorm:"type:uuid"`
	MinCredits int      `json:"min_credits"`
	ImageURL  string    `json:"image_url"`
	SoundURL  *string   `json:"sound_url,omitempty"`
	Label     *string   `json:"label,omitempty"`
	SortOrder int       `json:"sort_order"`
}

// MediaShareSettings controls the media share queue feature for a creator.
type MediaShareSettings struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatorID    uuid.UUID `json:"creator_id" gorm:"type:uuid;uniqueIndex"`
	IsEnabled    bool      `json:"is_enabled" gorm:"default:false"`
	PriceCredits int       `json:"price_credits" gorm:"default:5"`
	AllowedTypes string    `json:"allowed_types" gorm:"default:'image,gif'"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// MediaShare is a single item in the creator's media share queue.
type MediaShare struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatorID  uuid.UUID  `json:"creator_id" gorm:"type:uuid;index"`
	SenderID   *uuid.UUID `json:"sender_id,omitempty" gorm:"type:uuid"`
	SenderName string     `json:"sender_name" gorm:"default:'Anonim'"`
	MediaURL   string     `json:"media_url"`
	MediaType  string     `json:"media_type" gorm:"default:'image'"`
	Message    *string    `json:"message,omitempty"`
	Status     string     `json:"status" gorm:"default:'pending'"` // pending, playing, played, skipped
	PaymentID  *uuid.UUID `json:"payment_id,omitempty" gorm:"type:uuid"`
	PlayedAt   *time.Time `json:"played_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

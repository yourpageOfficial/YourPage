package entity

import (
	"github.com/google/uuid"
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

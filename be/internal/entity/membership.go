package entity

import (
	"time"
	"github.com/google/uuid"
)

type MembershipTier struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	CreatorID    uuid.UUID `json:"creator_id" gorm:"type:uuid"`
	Name         string    `json:"name"`
	PriceCredits int       `json:"price_credits"`
	Description  *string   `json:"description,omitempty"`
	Perks        *string   `json:"perks,omitempty"`
	SortOrder    int       `json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
}

type Membership struct {
	ID          uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey"`
	SupporterID uuid.UUID      `json:"supporter_id" gorm:"type:uuid"`
	CreatorID   uuid.UUID       `json:"creator_id" gorm:"type:uuid"`
	TierID      uuid.UUID       `json:"tier_id" gorm:"type:uuid"`
	Tier        *MembershipTier `json:"tier,omitempty" gorm:"foreignKey:TierID"`
	Status      string          `json:"status" gorm:"default:'active'"`
	StartedAt   time.Time       `json:"started_at"`
	ExpiresAt   time.Time       `json:"expires_at"`
	AutoRenew   bool            `json:"auto_renew" gorm:"default:true"`
	CreatedAt   time.Time       `json:"created_at"`
}

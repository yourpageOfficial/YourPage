package entity

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleFinance   UserRole = "finance"
	RoleCreator   UserRole = "creator"
	RoleSupporter UserRole = "supporter"
)

type User struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	Email        string     `json:"-" gorm:"uniqueIndex;not null"`
	Username     string     `json:"username" gorm:"uniqueIndex;not null"`
	PasswordHash string     `json:"-" gorm:"not null"`
	DisplayName  string     `json:"display_name"`
	AvatarURL    *string    `json:"avatar_url"`
	Bio          *string    `json:"bio"`
	Role          UserRole   `json:"role" gorm:"default:'supporter'"`
	EmailVerified bool       `json:"email_verified" gorm:"default:false"`
	ReferredBy    *uuid.UUID `json:"referred_by,omitempty" gorm:"type:uuid"`
	IsBanned     bool       `json:"is_banned" gorm:"default:false"`
	BanReason    *string    `json:"ban_reason,omitempty"`
	BanExpiresAt *time.Time `json:"ban_expires_at,omitempty"`
	DeletionScheduledAt *time.Time `json:"deletion_scheduled_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"-" gorm:"index"`
}

type CreatorProfile struct {
	ID                 uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID             uuid.UUID  `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"`
	User               User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	PageSlug           string     `json:"page_slug" gorm:"uniqueIndex;not null"`
	HeaderImageURL     *string    `json:"header_image_url"`
	SocialLinks        JSONMap    `json:"social_links" gorm:"type:jsonb;default:'{}'"`
	IsMonetized        bool       `json:"is_monetized" gorm:"default:false"`
	IsVerified         bool       `json:"is_verified" gorm:"default:false"`
	TotalEarnings      int64      `json:"total_earnings" gorm:"column:total_earnings;default:0"`
	BalanceIDR         int64      `json:"balance_idr" gorm:"column:balance_idr;default:0"`
	FollowerCount      int64      `json:"follower_count" gorm:"default:0"`
	StorageUsedBytes   int64      `json:"storage_used_bytes" gorm:"default:0"`
	StorageQuotaBytes  int64      `json:"storage_quota_bytes" gorm:"default:5368709120"`
	TierID             *uuid.UUID `json:"tier_id,omitempty" gorm:"type:uuid"`
	Tier               *CreatorTier `json:"tier,omitempty" gorm:"foreignKey:TierID"`
	TierExpiresAt      *time.Time `json:"tier_expires_at,omitempty"`
	CustomFeePercent   *int       `json:"custom_fee_percent,omitempty"`
	PageColor          *string    `json:"page_color,omitempty"`
	PromoFeePercent    *int       `json:"promo_fee_percent,omitempty"`
	PromoFeeExpiresAt  *time.Time `json:"promo_fee_expires_at,omitempty"`
	IsFeatured         bool       `json:"is_featured" gorm:"default:false"`
	FeaturedOrder      int        `json:"featured_order" gorm:"default:0"`
	AdminNote          *string    `json:"admin_note,omitempty"`
	ChatPriceIDR       int64      `json:"chat_price_idr" gorm:"column:chat_price_idr;default:0"`
	ChatAllowFrom      string     `json:"chat_allow_from" gorm:"column:chat_allow_from;default:'all'"`
	AutoReply          *string    `json:"auto_reply,omitempty"`
	DonationGoalAmount int64      `json:"donation_goal_amount" gorm:"default:0"`
	DonationGoalTitle  *string    `json:"donation_goal_title,omitempty"`
	DonationGoalCurrent int64     `json:"donation_goal_current" gorm:"default:0"`
	WelcomeMessage     *string    `json:"welcome_message,omitempty"`
	OverlayStyle       string     `json:"overlay_style" gorm:"default:'bounce'"`
	OverlayTextTemplate string    `json:"overlay_text_template" gorm:"default:'{donor} donated {amount} Credit!'"`
	LastBroadcastAt    *time.Time `json:"last_broadcast_at,omitempty"`
	Category           *string    `json:"category,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type CreatorTier struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string    `json:"name"`
	PriceIDR    int64     `json:"price_idr" gorm:"column:price_idr"`
	MaxProducts int       `json:"max_products"`
	FeePercent  int       `json:"fee_percent"`
	Badge       string    `json:"badge"`
	Features     string `json:"features" gorm:"type:jsonb;default:'[]'"`
	StorageBytes    int64  `json:"storage_bytes" gorm:"default:1073741824"`
	MaxOverlayTiers int    `json:"max_overlay_tiers" gorm:"default:3"`
	SortOrder       int    `json:"sort_order"`
}

// JSONMap is a helper type for PostgreSQL jsonb columns
type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = JSONMap{}
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("JSONMap: expected []byte, got %T", value)
	}
	return json.Unmarshal(b, j)
}

type ReferralCode struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID        uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Code          string    `json:"code" gorm:"uniqueIndex"`
	RewardCredits int       `json:"reward_credits" gorm:"default:10"`
	UsedCount     int       `json:"used_count" gorm:"default:0"`
	CreatedAt     time.Time `json:"created_at"`
}

package entity

import (
	"time"

	"github.com/google/uuid"
)

type Donation struct {
	ID           uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatorID    uuid.UUID     `json:"creator_id" gorm:"type:uuid;index;not null"`
	Creator      *User         `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	SupporterID  *uuid.UUID    `json:"supporter_id,omitempty" gorm:"type:uuid;index"`
	Supporter    *User         `json:"supporter,omitempty" gorm:"foreignKey:SupporterID"`
	PaymentID    uuid.UUID     `json:"payment_id" gorm:"type:uuid;not null"`
	AmountIDR   int64      `json:"amount_idr" gorm:"column:amount_idr"`
	NetAmountIDR int64     `json:"net_amount_idr" gorm:"column:net_amount_idr"`
	Message     *string    `json:"message"`
	DonorName   string     `json:"donor_name"`
	DonorEmail  string     `json:"-"`
	IsAnonymous bool       `json:"is_anonymous" gorm:"default:false"`
	MediaURL    *string    `json:"media_url,omitempty"`
	Status      PaymentStatus `json:"status" gorm:"default:'pending'"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type TopSupporter struct {
	DonorName     string `json:"donor_name"`
	TotalIDR      int64  `json:"total_idr"`
	DonationCount int    `json:"donation_count"`
}

// LeaderboardEntry is a ranked entry for the public leaderboard widget.
type LeaderboardEntry struct {
	Rank      int    `json:"rank"`
	DonorName string `json:"donor_name"`
	TotalIDR  int64  `json:"total_idr"`
	Count     int    `json:"count"`
}

// LeaderboardSettings controls how the OBS leaderboard overlay is displayed.
type LeaderboardSettings struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatorID  uuid.UUID `json:"creator_id" gorm:"type:uuid;uniqueIndex"`
	IsEnabled  bool      `json:"is_enabled" gorm:"default:true"`
	Period     string    `json:"period" gorm:"default:'all_time'"` // all_time, monthly, weekly
	MaxEntries int       `json:"max_entries" gorm:"default:10"`
	ShowAmount bool      `json:"show_amount" gorm:"default:true"`
	Title      string    `json:"title" gorm:"default:'Top Supporters'"`
	UpdatedAt  time.Time `json:"updated_at"`
}

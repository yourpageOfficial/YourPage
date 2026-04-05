package entity

import (
	"time"

	"github.com/google/uuid"
)

type Follow struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	FollowerID  uuid.UUID `json:"follower_id" gorm:"type:uuid;index;not null"`
	CreatorID   uuid.UUID `json:"creator_id" gorm:"type:uuid;index;not null"`
	CreatedAt   time.Time `json:"created_at"`
}

type NotificationType string

const (
	NotificationNewPost           NotificationType = "new_post"
	NotificationPurchaseSuccess   NotificationType = "purchase_success"
	NotificationDonationReceived  NotificationType = "donation_received"
	NotificationWithdrawalUpdated NotificationType = "withdrawal_updated"
	NotificationCreditTopupDone   NotificationType = "credit_topup_done"
	NotificationKYCUpdated        NotificationType = "kyc_updated"
	NotificationReportResolved    NotificationType = "report_resolved"
	NotificationNewLike           NotificationType = "new_like"
	NotificationNewChat           NotificationType = "new_chat"
	NotificationDonationReceived2 NotificationType = "donation_received"
)

type Notification struct {
	ID          uuid.UUID        `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID      uuid.UUID        `json:"user_id" gorm:"type:uuid;index;not null"`
	Type        NotificationType `json:"type"`
	Title       string           `json:"title"`
	Body        string           `json:"body"`
	ReferenceID *uuid.UUID       `json:"reference_id,omitempty" gorm:"type:uuid"`
	IsRead      bool             `json:"is_read" gorm:"default:false"`
	CreatedAt   time.Time        `json:"created_at"`
}

type PlatformSetting struct {
	ID               uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	FeePercent       int       `json:"fee_percent" gorm:"default:10"`
	MinWithdrawalIDR int64     `json:"min_withdrawal_idr" gorm:"column:min_withdrawal_idr;default:100000"`
	CreditRateIDR    int64     `json:"credit_rate_idr" gorm:"column:credit_rate_idr;default:1000"`
	PlatformQRISURL  *string   `json:"platform_qris_url"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type PlatformWithdrawal struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	AdminID       uuid.UUID `json:"admin_id" gorm:"type:uuid;not null"`
	Admin         *User     `json:"admin,omitempty" gorm:"foreignKey:AdminID"`
	AmountIDR     int64     `json:"amount_idr" gorm:"column:amount_idr"`
	BankName      string    `json:"bank_name"`
	AccountNumber string    `json:"account_number"`
	AccountName   string    `json:"account_name"`
	Note          *string   `json:"note,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

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

// UserBlock represents a user blocking another user.
type UserBlock struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	BlockerID uuid.UUID `json:"blocker_id" gorm:"type:uuid;index;not null"`
	BlockedID uuid.UUID `json:"blocked_id" gorm:"type:uuid;index;not null"`
	CreatedAt time.Time `json:"created_at"`
}

// PushSubscription stores a Web Push API subscription for a user.
type PushSubscription struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	Endpoint  string    `json:"endpoint"`
	P256DH    string    `json:"p256dh"`
	AuthKey   string    `json:"auth_key" gorm:"column:auth_key"`
	UserAgent string    `json:"user_agent,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// PlatformAnnouncement is an admin broadcast message shown to all/specific users.
type PlatformAnnouncement struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	AdminID    uuid.UUID  `json:"admin_id" gorm:"type:uuid;not null"`
	Admin      *User      `json:"admin,omitempty" gorm:"foreignKey:AdminID"`
	Title      string     `json:"title"`
	Body       string     `json:"body"`
	TargetRole string     `json:"target_role" gorm:"default:'all'"`
	IsActive   bool       `json:"is_active" gorm:"default:true"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
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
	NotificationRefund            NotificationType = "refund"
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
	QRISEnabled          bool   `json:"qris_enabled" gorm:"column:qris_enabled;default:true"`
	StripeEnabled        bool   `json:"stripe_enabled" gorm:"column:stripe_enabled;default:false"`
	StripePublishableKey string `json:"stripe_publishable_key" gorm:"column:stripe_publishable_key;default:''"`
	// Secrets are json:"-" so no handler can leak them by serializing this
	// struct directly. The admin endpoints send masked copies built by
	// handler.maskedSettings instead.
	StripeSecretKey     string `json:"-" gorm:"column:stripe_secret_key;default:''"`
	StripeWebhookSecret string `json:"-" gorm:"column:stripe_webhook_secret;default:''"`
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

package entity

import (
	"time"

	"github.com/google/uuid"
)

type PaymentProvider string

const (
	PaymentProviderXendit     PaymentProvider = "xendit"
	PaymentProviderPayPal     PaymentProvider = "paypal"
	PaymentProviderQRISManual PaymentProvider = "qris_manual"
	PaymentProviderCredits    PaymentProvider = "credits"
)

type PaymentUsecase string

const (
	PaymentUsecasePostPurchase     PaymentUsecase = "post_purchase"
	PaymentUsecaseProductPurchase  PaymentUsecase = "product_purchase"
	PaymentUsecaseDonation         PaymentUsecase = "donation"
	PaymentUsecaseCreditTopup      PaymentUsecase = "credit_topup"
)

type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusPaid     PaymentStatus = "paid"
	PaymentStatusFailed   PaymentStatus = "failed"
	PaymentStatusExpired  PaymentStatus = "expired"
	PaymentStatusRefunded PaymentStatus = "refunded"
)

type Payment struct {
	ID             uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ExternalID     string          `json:"external_id" gorm:"uniqueIndex"`
	Provider       PaymentProvider `json:"provider"`
	Usecase        PaymentUsecase  `json:"usecase"`
	ReferenceID    uuid.UUID       `json:"reference_id" gorm:"type:uuid"`
	PayerID        *uuid.UUID      `json:"payer_id" gorm:"type:uuid;index"`
	Payer          *User           `json:"payer,omitempty" gorm:"foreignKey:PayerID"`
	AmountIDR      int64           `json:"amount_idr" gorm:"column:amount_idr"`
	FeeIDR         int64           `json:"fee_idr" gorm:"column:fee_idr"`
	NetAmountIDR   int64           `json:"net_amount_idr" gorm:"column:net_amount_idr"`
	Status         PaymentStatus   `json:"status" gorm:"default:'pending'"`
	QRISString     *string         `json:"qris_string,omitempty" gorm:"column:qris_string"`
	QRISImageURL   *string         `json:"qris_image_url,omitempty" gorm:"column:qris_image_url"`
	PayPalOrderID  *string         `json:"paypal_order_id,omitempty" gorm:"column:paypal_order_id"`
	PayPalApproveURL *string       `json:"paypal_approve_url,omitempty" gorm:"column:paypal_approve_url"`
	ExpiresAt      *time.Time      `json:"expires_at,omitempty"`
	UniqueCode     int             `json:"unique_code" gorm:"default:0"`
	PaidAt         *time.Time      `json:"paid_at,omitempty"`
	WebhookPayload JSONMap         `json:"-" gorm:"type:jsonb"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

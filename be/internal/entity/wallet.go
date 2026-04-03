package entity

import (
	"time"

	"github.com/google/uuid"
)

type CreditTransactionType string

const (
	CreditTransactionTopup      CreditTransactionType = "topup"
	CreditTransactionSpend      CreditTransactionType = "spend"
	CreditTransactionRefund     CreditTransactionType = "refund"
	CreditTransactionWithdrawal CreditTransactionType = "withdrawal"
	CreditTransactionEarning    CreditTransactionType = "earning"
)

type UserWallet struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID         uuid.UUID `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"`
	BalanceCredits int64     `json:"balance_credits" gorm:"default:0"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreditTransaction struct {
	ID          uuid.UUID             `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID      uuid.UUID             `json:"user_id" gorm:"type:uuid;index;not null"`
	Type        CreditTransactionType `json:"type"`
	Credits     int64                 `json:"credits"`
	IDRAmount   int64                 `json:"idr_amount" gorm:"column:idr_amount"`
	PaymentID   *uuid.UUID            `json:"payment_id,omitempty" gorm:"type:uuid"`
	ReferenceID *uuid.UUID            `json:"reference_id,omitempty" gorm:"type:uuid"`
	Description string                `json:"description"`
	CreatedAt   time.Time             `json:"created_at"`
}

type CreditTopupRequest struct {
	ID             uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID         uuid.UUID     `json:"user_id" gorm:"type:uuid;index;not null"`
	User           *User         `json:"user,omitempty" gorm:"foreignKey:UserID"`
	AmountIDR      int64         `json:"amount_idr" gorm:"column:amount_idr"`
	Credits        int64         `json:"credits"`
	DonorName      string        `json:"donor_name"`
	ProofImageURL  *string       `json:"proof_image_url,omitempty"`
	Status         PaymentStatus `json:"status" gorm:"default:'pending'"`
	UniqueCode     int           `json:"unique_code" gorm:"default:0"`
	AdminNote      *string       `json:"admin_note,omitempty"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

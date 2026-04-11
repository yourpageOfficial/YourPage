package entity

import (
	"time"

	"github.com/google/uuid"
)

type WithdrawalStatus string

const (
	WithdrawalStatusPending   WithdrawalStatus = "pending"
	WithdrawalStatusApproved  WithdrawalStatus = "approved"
	WithdrawalStatusRejected  WithdrawalStatus = "rejected"
	WithdrawalStatusProcessed WithdrawalStatus = "processed"
)

type Withdrawal struct {
	ID            uuid.UUID        `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatorID     uuid.UUID        `json:"creator_id" gorm:"type:uuid;index;not null"`
	Creator       *User            `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	AmountIDR     int64            `json:"amount_idr" gorm:"column:amount_idr"`
	BankName      string           `json:"bank_name"`
	AccountNumber string           `json:"account_number" gorm:"column:account_number"`
	AccountName   string           `json:"account_name" gorm:"column:account_name"`
	Status        WithdrawalStatus `json:"status" gorm:"default:'pending'"`
	AdminNote     *string          `json:"admin_note,omitempty"`
	ProcessedAt   *time.Time       `json:"processed_at,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
}

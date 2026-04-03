package entity

import (
	"time"

	"github.com/google/uuid"
)

type KYCStatus string

const (
	KYCStatusPending  KYCStatus = "pending"
	KYCStatusApproved KYCStatus = "approved"
	KYCStatusRejected KYCStatus = "rejected"
)

type UserKYC struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID      uuid.UUID  `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"`
	User        *User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	KTPImageURL string     `json:"-" gorm:"column:ktp_image_url"` // never expose raw URL
	FullName    string     `json:"full_name"`
	IDNumber    string     `json:"-" gorm:"column:id_number"` // masked in responses
	Status      KYCStatus  `json:"status" gorm:"default:'pending'"`
	AdminNote   *string    `json:"admin_note,omitempty"`
	ReviewedAt  *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (UserKYC) TableName() string { return "user_kyc" }

type ReportReason string

const (
	ReportReasonNSFW      ReportReason = "nsfw"
	ReportReasonPlagiarism ReportReason = "plagiarism"
	ReportReasonScam      ReportReason = "scam"
	ReportReasonSpam      ReportReason = "spam"
	ReportReasonOther     ReportReason = "other"
)

type ReportTargetType string

const (
	ReportTargetPost    ReportTargetType = "post"
	ReportTargetProduct ReportTargetType = "product"
	ReportTargetUser    ReportTargetType = "user"
)

type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "pending"
	ReportStatusResolved  ReportStatus = "resolved"
	ReportStatusDismissed ReportStatus = "dismissed"
)

type ContentReport struct {
	ID          uuid.UUID        `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReporterID  *uuid.UUID       `json:"reporter_id,omitempty" gorm:"type:uuid;index"`
	TargetType  ReportTargetType `json:"target_type"`
	TargetID    uuid.UUID        `json:"target_id" gorm:"type:uuid"`
	Reason      ReportReason     `json:"reason"`
	Description *string          `json:"description,omitempty"`
	Status      ReportStatus     `json:"status" gorm:"default:'pending'"`
	AdminNote   *string          `json:"admin_note,omitempty"`
	ResolvedAt  *time.Time       `json:"resolved_at,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

package entity

import (
	"time"

	"github.com/google/uuid"
)

type ProductType string

const (
	ProductTypeEbook    ProductType = "ebook"
	ProductTypePreset   ProductType = "preset"
	ProductTypeTemplate ProductType = "template"
	ProductTypeOther    ProductType = "other"
)

type Product struct {
	ID           uuid.UUID    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatorID    uuid.UUID    `json:"creator_id" gorm:"type:uuid;index;not null"`
	Creator      *User        `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	Name         string       `json:"name" gorm:"not null"`
	Slug         string       `json:"slug" gorm:"uniqueIndex;not null"`
	Description  *string      `json:"description"`
	Type         ProductType  `json:"type"`
	PriceIDR     int64        `json:"price_idr" gorm:"column:price_idr"`
	IsActive     bool         `json:"is_active" gorm:"default:true"`
	DeliveryType string       `json:"delivery_type" gorm:"default:'file'"` // file, link
	DeliveryURL  *string      `json:"delivery_url,omitempty"`
	DeliveryNote *string      `json:"delivery_note,omitempty"`
	ThumbnailURL *string      `json:"thumbnail_url"`
	Assets       []ProductAsset `json:"assets,omitempty" gorm:"foreignKey:ProductID"`
	SalesCount   int64        `json:"sales_count" gorm:"default:0"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
	DeletedAt    *time.Time   `json:"-" gorm:"index"`
}

type ProductAsset struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ProductID  uuid.UUID `json:"product_id" gorm:"type:uuid;index;not null"`
	FileName   string    `json:"file_name"`
	FileURL    string    `json:"-"` // never expose raw URL
	FileSizeKB int64     `json:"file_size_kb"`
	MimeType   string    `json:"mime_type"`
	CreatedAt  time.Time `json:"created_at"`
}

type ProductPurchase struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ProductID   uuid.UUID `json:"product_id" gorm:"type:uuid;index;not null"`
	SupporterID uuid.UUID `json:"supporter_id" gorm:"type:uuid;index;not null"`
	PaymentID   uuid.UUID `json:"payment_id" gorm:"type:uuid;not null"`
	AmountIDR   int64     `json:"amount_idr" gorm:"column:amount_idr"`
	CreatedAt   time.Time `json:"created_at"`
}

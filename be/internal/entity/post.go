package entity

import (
	"time"

	"github.com/google/uuid"
)

type PostAccessType string

const (
	PostAccessFree PostAccessType = "free"
	PostAccessPaid PostAccessType = "paid"
)

type PostStatus string

const (
	PostStatusDraft     PostStatus = "draft"
	PostStatusPublished PostStatus = "published"
)

type MediaType string

const (
	MediaTypeImage    MediaType = "image"
	MediaTypeVideo    MediaType = "video"
	MediaTypeAudio    MediaType = "audio"
	MediaTypeDocument MediaType = "document"
)

type Post struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatorID   uuid.UUID      `json:"creator_id" gorm:"type:uuid;index;not null"`
	Creator     *User          `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	Title       string         `json:"title" gorm:"not null"`
	Content     string         `json:"content"`
	Excerpt     *string        `json:"excerpt"`
	AccessType  PostAccessType `json:"access_type" gorm:"default:'free'"`
	Price       *int64         `json:"price"`
	Status      PostStatus     `json:"status" gorm:"default:'draft'"`
	PublishedAt  *time.Time     `json:"published_at"`
	ScheduledAt *time.Time     `json:"scheduled_at,omitempty"`
	Media       []PostMedia    `json:"media,omitempty" gorm:"foreignKey:PostID"`
	ViewCount   int64          `json:"view_count" gorm:"default:0"`
	LikeCount   int64          `json:"like_count" gorm:"default:0"`
	CommentCount int64         `json:"comment_count" gorm:"default:0"`
	// Runtime fields (not stored in DB)
	IsLocked     bool `json:"is_locked" gorm:"-"`
	HasPurchased bool `json:"has_purchased" gorm:"-"`
	HasLiked     bool `json:"has_liked" gorm:"-"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"-" gorm:"index"`
}

type PostMedia struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PostID    uuid.UUID `json:"post_id" gorm:"type:uuid;index;not null"`
	URL       string    `json:"url"`
	ThumbURL  *string   `json:"thumb_url"`
	MediaType MediaType `json:"media_type"`
	SortOrder int       `json:"sort_order" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at"`
}

type PostLike struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PostID    uuid.UUID `json:"post_id" gorm:"type:uuid;index;not null"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	CreatedAt time.Time `json:"created_at"`
}

type PostComment struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PostID    uuid.UUID `json:"post_id" gorm:"type:uuid;index;not null"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type PostPurchase struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PostID      uuid.UUID `json:"post_id" gorm:"type:uuid;index;not null"`
	SupporterID uuid.UUID `json:"supporter_id" gorm:"type:uuid;index;not null"`
	PaymentID   uuid.UUID `json:"payment_id" gorm:"type:uuid;not null"`
	AmountIDR   int64     `json:"amount_idr" gorm:"column:amount_idr"`
	CreatedAt   time.Time `json:"created_at"`
}

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
)

// UserRepository handles user and creator profile data
type UserRepository interface {
	Create(ctx context.Context, user *entity.User) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error)
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindByUsername(ctx context.Context, username string) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, role string, cursor *uuid.UUID, limit int) ([]entity.User, error)

	CreateCreatorProfile(ctx context.Context, p *entity.CreatorProfile) error
	FindCreatorBySlug(ctx context.Context, slug string) (*entity.CreatorProfile, error)
	FindCreatorByUserID(ctx context.Context, userID uuid.UUID) (*entity.CreatorProfile, error)
	UpdateCreatorProfile(ctx context.Context, p *entity.CreatorProfile) error
	IncrementCreatorStorage(ctx context.Context, creatorID uuid.UUID, bytes int64) error
	IncrementFollowerCount(ctx context.Context, creatorID uuid.UUID, delta int) error
	SearchCreators(ctx context.Context, query string, cursor *uuid.UUID, limit int) ([]entity.CreatorProfile, error)
	ListFeaturedCreators(ctx context.Context) ([]entity.CreatorProfile, error)
	ListExpiredTierCreators(ctx context.Context) ([]entity.CreatorProfile, error)

	// Analytics
	CountCreatorPosts(ctx context.Context, userID uuid.UUID) (int64, error)
	CountCreatorProducts(ctx context.Context, userID uuid.UUID) (int64, error)
	CountCreatorDonations(ctx context.Context, userID uuid.UUID) (int64, int64, error)
	CountCreatorSales(ctx context.Context, userID uuid.UUID) (int64, int64, error)
}

// PostRepository handles posts and post media
type PostRepository interface {
	Create(ctx context.Context, post *entity.Post) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Post, error)
	FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Post, error)
	Update(ctx context.Context, post *entity.Post) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	ListByCreator(ctx context.Context, creatorID uuid.UUID, status string, cursor *uuid.UUID, limit int) ([]entity.Post, error)
	ListFeed(ctx context.Context, creatorIDs []uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, error)
	ListAll(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Post, error) // admin
	IncrementViewCount(ctx context.Context, postID uuid.UUID) error
	PublishScheduled(ctx context.Context) error

	AddMedia(ctx context.Context, media *entity.PostMedia) error
	DeleteMedia(ctx context.Context, mediaID uuid.UUID) (*entity.PostMedia, error)
	ListMedia(ctx context.Context, postID uuid.UUID) ([]entity.PostMedia, error)

	CreatePurchase(ctx context.Context, p *entity.PostPurchase) error
	FindPurchase(ctx context.Context, postID, supporterID uuid.UUID) (*entity.PostPurchase, error)
	// Batch check: returns set of postIDs that the supporter has purchased
	FindPurchasedPostIDs(ctx context.Context, supporterID uuid.UUID, postIDs []uuid.UUID) (map[uuid.UUID]bool, error)
	ListPurchasedPosts(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, error)

	LikePost(ctx context.Context, postID, userID uuid.UUID) error
	UnlikePost(ctx context.Context, postID, userID uuid.UUID) error
	HasLiked(ctx context.Context, postID, userID uuid.UUID) (bool, error)
	HasLikedBatch(ctx context.Context, userID uuid.UUID, postIDs []uuid.UUID) (map[uuid.UUID]bool, error)

	CreateComment(ctx context.Context, c *entity.PostComment) error
	ListComments(ctx context.Context, postID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.PostComment, error)
	DeleteComment(ctx context.Context, commentID, userID uuid.UUID) error
}

// ProductRepository handles digital products
type ProductRepository interface {
	Create(ctx context.Context, p *entity.Product) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Product, error)
	FindBySlug(ctx context.Context, slug string) (*entity.Product, error)
	Update(ctx context.Context, p *entity.Product) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, error)
	CountByCreator(ctx context.Context, creatorID uuid.UUID) (int64, error)
	DeactivateExcess(ctx context.Context, creatorID uuid.UUID, maxActive int) error
	ListAll(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Product, error) // admin
	IncrementSalesCount(ctx context.Context, productID uuid.UUID) error

	AddAsset(ctx context.Context, asset *entity.ProductAsset) error
	DeleteAsset(ctx context.Context, assetID uuid.UUID) (*entity.ProductAsset, error)
	ListAssets(ctx context.Context, productID uuid.UUID) ([]entity.ProductAsset, error)

	CreatePurchase(ctx context.Context, p *entity.ProductPurchase) error
	FindPurchase(ctx context.Context, productID, supporterID uuid.UUID) (*entity.ProductPurchase, error)
	ListPurchasedProducts(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, error)
}

// PaymentRepository handles payments
type PaymentRepository interface {
	Create(ctx context.Context, p *entity.Payment) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Payment, error)
	FindByExternalID(ctx context.Context, externalID string) (*entity.Payment, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, paidAt interface{}) error
	UpdateWebhookPayload(ctx context.Context, id uuid.UUID, payload entity.JSONMap) error
	List(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Payment, error) // admin
	ListByPayer(ctx context.Context, payerID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, error)
	ListByReferenceCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Payment, error)
}

// DonationRepository handles donations
type DonationRepository interface {
	Create(ctx context.Context, d *entity.Donation) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Donation, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.PaymentStatus) error
	ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, error)
	ListBySupporter(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Donation, error)
	ListAll(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Donation, error)
}

// WithdrawalRepository handles creator withdrawals
type WithdrawalRepository interface {
	Create(ctx context.Context, w *entity.Withdrawal) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Withdrawal, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.WithdrawalStatus, adminNote *string) error
	ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, error)
	ListAll(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.Withdrawal, error) // admin
	HasPreviousApproved(ctx context.Context, creatorID uuid.UUID) (bool, error)
}

// WalletRepository handles credit wallets
type WalletRepository interface {
	FindOrCreateWallet(ctx context.Context, userID uuid.UUID) (*entity.UserWallet, error)
	AddCredits(ctx context.Context, userID uuid.UUID, credits int64) error
	DeductCredits(ctx context.Context, userID uuid.UUID, credits int64) error
	GetBalance(ctx context.Context, userID uuid.UUID) (int64, error)
	CreateTransaction(ctx context.Context, tx *entity.CreditTransaction) error
	ListTransactions(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.CreditTransaction, error)

	CreateTopupRequest(ctx context.Context, req *entity.CreditTopupRequest) error
	FindTopupRequest(ctx context.Context, id uuid.UUID) (*entity.CreditTopupRequest, error)
	UpdateTopupRequest(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, adminNote *string) error
	UpdateTopupProof(ctx context.Context, id uuid.UUID, donorName, proofURL string) error
	ListTopupRequests(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.CreditTopupRequest, error) // admin
}

// FollowRepository handles follows and notifications
type FollowRepository interface {
	Follow(ctx context.Context, followerID, creatorID uuid.UUID) error
	Unfollow(ctx context.Context, followerID, creatorID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, creatorID uuid.UUID) (bool, error)
	GetFollowedCreatorIDs(ctx context.Context, followerID uuid.UUID) ([]uuid.UUID, error)

	CreateNotification(ctx context.Context, n *entity.Notification) error
	BulkCreateNotifications(ctx context.Context, notifications []entity.Notification) error
	ListNotifications(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Notification, error)
	CountUnread(ctx context.Context, userID uuid.UUID) (int64, error)
	MarkRead(ctx context.Context, notifID, userID uuid.UUID) error
	MarkAllRead(ctx context.Context, userID uuid.UUID) error
}

// KYCRepository handles KYC and content reports
type KYCRepository interface {
	CreateKYC(ctx context.Context, kyc *entity.UserKYC) error
	FindKYCByUserID(ctx context.Context, userID uuid.UUID) (*entity.UserKYC, error)
	UpdateKYCStatus(ctx context.Context, id uuid.UUID, status entity.KYCStatus, adminNote *string) error
	ListKYC(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.UserKYC, error) // admin

	CreateReport(ctx context.Context, r *entity.ContentReport) error
	FindReport(ctx context.Context, id uuid.UUID) (*entity.ContentReport, error)
	UpdateReportStatus(ctx context.Context, id uuid.UUID, status entity.ReportStatus, adminNote *string) error
	ListReports(ctx context.Context, status string, cursor *uuid.UUID, limit int) ([]entity.ContentReport, error) // admin
}

// PlatformRepository handles platform settings
type PlatformRepository interface {
	GetSettings(ctx context.Context) (*entity.PlatformSetting, error)
	UpdateSettings(ctx context.Context, s *entity.PlatformSetting) error
	CreatePlatformWithdrawal(ctx context.Context, w *entity.PlatformWithdrawal) error
	ListPlatformWithdrawals(ctx context.Context) ([]entity.PlatformWithdrawal, error)
	ListTiers(ctx context.Context) ([]entity.CreatorTier, error)
	FindTier(ctx context.Context, id uuid.UUID) (*entity.CreatorTier, error)
}

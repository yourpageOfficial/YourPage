package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
	"io"
)

// ---------------------------------------------------------------------------
// Request / response DTOs
// ---------------------------------------------------------------------------

type CreatePostRequest struct {
	Title       string                `json:"title"       validate:"required,max=255"`
	Content     string                `json:"content"`
	Excerpt     *string               `json:"excerpt"`
	AccessType  entity.PostAccessType `json:"access_type" validate:"omitempty,oneof=free paid"`
	Price       *int64                `json:"price"`
	Status      entity.PostStatus     `json:"status"      validate:"omitempty,oneof=draft published"`
	Visibility  string                `json:"visibility"  validate:"omitempty,oneof=public paid members"`
	MembershipTierID *uuid.UUID       `json:"membership_tier_id"`
	ScheduledAt *time.Time            `json:"scheduled_at"`
}

type UpdatePostRequest struct {
	Title      *string               `json:"title"       validate:"omitempty,max=255"`
	Content    *string               `json:"content"`
	Excerpt    *string               `json:"excerpt"`
	AccessType *entity.PostAccessType `json:"access_type" validate:"omitempty,oneof=free paid"`
	Price      *int64                `json:"price"`
	Status     *entity.PostStatus    `json:"status"      validate:"omitempty,oneof=draft published"`
	Visibility *string               `json:"visibility"  validate:"omitempty,oneof=public paid members"`
	MembershipTierID *uuid.UUID      `json:"membership_tier_id"`
}

type AddMediaRequest struct {
	File        io.Reader
	FileName    string
	FileSize    int64
	ContentType string
	MediaType   entity.MediaType `json:"media_type" validate:"required,oneof=image video audio document"`
	SortOrder   int              `json:"sort_order"`
	ThumbURL    *string          `json:"thumb_url"`
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

// PostService defines all business operations for posts.
type PostService interface {
	Create(ctx context.Context, creatorID uuid.UUID, req CreatePostRequest) (*entity.Post, error)
	GetByID(ctx context.Context, postID uuid.UUID, viewerID *uuid.UUID) (*entity.Post, error)
	Update(ctx context.Context, postID, creatorID uuid.UUID, req UpdatePostRequest) (*entity.Post, error)
	Delete(ctx context.Context, postID, creatorID uuid.UUID) error
	List(ctx context.Context, creatorID uuid.UUID, status string, cursor *uuid.UUID, limit int, viewerID *uuid.UUID) ([]entity.Post, *uuid.UUID, error)
	Feed(ctx context.Context, followerID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, *uuid.UUID, error)
	AddMedia(ctx context.Context, postID, creatorID uuid.UUID, req AddMediaRequest) (*entity.PostMedia, error)
	DeleteMedia(ctx context.Context, mediaID, postID, creatorID uuid.UUID) error
	IncrementView(ctx context.Context, postID uuid.UUID) error
	LikePost(ctx context.Context, postID, userID uuid.UUID) error
	UnlikePost(ctx context.Context, postID, userID uuid.UUID) error
	CreateComment(ctx context.Context, postID, userID uuid.UUID, content string) (*entity.PostComment, error)
	ListComments(ctx context.Context, postID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.PostComment, *uuid.UUID, error)
	ListPurchased(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, *uuid.UUID, error)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type postService struct {
	postRepo    repository.PostRepository
	userRepo    repository.UserRepository
	followRepo  repository.FollowRepository
	storage     storage.StorageService
	cfg         *config.Config
}

// NewPostService constructs a PostService.
func NewPostService(
	postRepo repository.PostRepository,
	userRepo repository.UserRepository,
	followRepo repository.FollowRepository,
	storageSvc storage.StorageService,
	cfg *config.Config,
) PostService {
	return &postService{
		postRepo:   postRepo,
		userRepo:   userRepo,
		followRepo: followRepo,
		storage:    storageSvc,
		cfg:        cfg,
	}
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

func (s *postService) Create(ctx context.Context, creatorID uuid.UUID, req CreatePostRequest) (*entity.Post, error) {
	// Validate that the user is a creator.
	user, err := s.userRepo.FindByID(ctx, creatorID)
	if err != nil {
		return nil, err
	}
	if user.Role != entity.RoleCreator {
		return nil, entity.ErrForbidden
	}

	status := entity.PostStatusDraft
	if req.Status != "" {
		status = req.Status
	}

	accessType := entity.PostAccessFree
	if req.AccessType != "" {
		accessType = req.AccessType
	}

	post := &entity.Post{
		ID:          uuid.New(),
		CreatorID:   creatorID,
		Title:       validator.SanitizeString(req.Title),
		Content:     validator.SanitizeString(req.Content),
		Excerpt:     req.Excerpt,
		AccessType:  accessType,
		Price:       req.Price,
		Status:      status,
		Visibility:  func() string { if req.Visibility != "" { return req.Visibility }; return "public" }(),
		MembershipTierID: req.MembershipTierID,
		ScheduledAt: req.ScheduledAt,
	}

	// If scheduled, check tier (Pro+ only) + must be future
	if req.ScheduledAt != nil {
		if !req.ScheduledAt.After(time.Now()) {
			return nil, fmt.Errorf("⚠ Waktu jadwal harus di masa depan")
		}
		cp, _ := s.userRepo.FindCreatorByUserID(ctx, creatorID)
		if cp == nil || cp.Tier == nil || cp.Tier.PriceIDR == 0 {
			return nil, fmt.Errorf("⚠ Fitur jadwal post hanya tersedia untuk tier Pro ke atas")
		}
		post.Status = entity.PostStatusDraft
		post.PublishedAt = nil
	} else if status == entity.PostStatusPublished {
		now := time.Now()
		post.PublishedAt = &now
	}

	if err := s.postRepo.Create(ctx, post); err != nil {
		return nil, err
	}
	return post, nil
}

// ---------------------------------------------------------------------------
// GetByID
// ---------------------------------------------------------------------------

func (s *postService) GetByID(ctx context.Context, postID uuid.UUID, viewerID *uuid.UUID) (*entity.Post, error) {
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		// Post deleted — check if viewer purchased it
		if viewerID != nil {
			if _, purchaseErr := s.postRepo.FindPurchase(ctx, postID, *viewerID); purchaseErr == nil {
				post, err = s.postRepo.FindByIDUnscoped(ctx, postID)
			}
		}
		if err != nil { return nil, err }
	}

	// 2.7: Draft posts only visible to creator
	if post.Status != entity.PostStatusPublished {
		if viewerID == nil || *viewerID != post.CreatorID {
			return nil, entity.ErrNotFound
		}
	}

	media, err := s.postRepo.ListMedia(ctx, postID)
	if err != nil {
		return nil, err
	}
	post.Media = media

	if post.AccessType == entity.PostAccessPaid {
		locked := true
		hasPurchased := false

		if viewerID != nil {
			if *viewerID == post.CreatorID {
				locked = false
				hasPurchased = true
			} else {
				purchase, purchaseErr := s.postRepo.FindPurchase(ctx, postID, *viewerID)
				if purchaseErr == nil && purchase != nil {
					locked = false
					hasPurchased = true
				}
			}
		}

		post.IsLocked = locked
		post.HasPurchased = hasPurchased

		if locked {
			applyPostLock(post)
		} else {
			// Generate pre-signed URLs for paid content media (stored in private bucket)
			for i := range post.Media {
				url := post.Media[i].URL
				if url != "" && !strings.HasPrefix(url, "/storage/") && !strings.HasPrefix(url, "http") {
					// Private bucket object — generate pre-signed URL
					signed, err := s.storage.GetPresignedURL(ctx, s.cfg.MinIO.PrivateBucket, url, 15*time.Minute)
					if err == nil {
						post.Media[i].URL = signed
					}
				}
			}
		}
	}

	// Members-only visibility
	if post.Visibility == "members" {
		isMember := false
		if viewerID != nil && *viewerID == post.CreatorID {
			isMember = true
		} else if viewerID != nil {
			if post.MembershipTierID != nil {
				// Specific tier required — check viewer has that tier or higher
				isMember = s.postRepo.CheckMembershipTier(ctx, *viewerID, post.CreatorID, *post.MembershipTierID)
			} else {
				// Any membership
				isMember = s.postRepo.CheckMembership(ctx, *viewerID, post.CreatorID)
			}
		}
		if !isMember {
			post.IsLocked = true
			applyPostLock(post)
		}
	}

	return post, nil
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

func (s *postService) Update(ctx context.Context, postID, creatorID uuid.UUID, req UpdatePostRequest) (*entity.Post, error) {
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		return nil, err
	}
	if post.CreatorID != creatorID {
		return nil, entity.ErrForbidden
	}

	if req.Title != nil {
		post.Title = *req.Title
	}
	if req.Content != nil {
		post.Content = *req.Content
	}
	if req.Excerpt != nil {
		post.Excerpt = req.Excerpt
	}
	if req.AccessType != nil {
		post.AccessType = *req.AccessType
	}
	if req.Price != nil {
		post.Price = req.Price
	}
	if req.Visibility != nil {
		post.Visibility = *req.Visibility
	}
	post.MembershipTierID = req.MembershipTierID
	if req.Status != nil {
		wasPublished := post.Status == entity.PostStatusPublished
		post.Status = *req.Status
		if *req.Status == entity.PostStatusPublished && !wasPublished {
			now := time.Now()
			post.PublishedAt = &now
		}
	}

	if err := s.postRepo.Update(ctx, post); err != nil {
		return nil, err
	}
	return post, nil
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

func (s *postService) Delete(ctx context.Context, postID, creatorID uuid.UUID) error {
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		return err
	}
	if post.CreatorID != creatorID {
		return entity.ErrForbidden
	}
	return s.postRepo.SoftDelete(ctx, postID)
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

func (s *postService) List(ctx context.Context, creatorID uuid.UUID, status string, cursor *uuid.UUID, limit int, viewerID *uuid.UUID) ([]entity.Post, *uuid.UUID, error) {
	posts, err := s.postRepo.ListByCreator(ctx, creatorID, status, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}

	var nextCursor *uuid.UUID
	if len(posts) > limit {
		nextCursor = &posts[limit].ID
		posts = posts[:limit]
	}

	if err := s.applyLockBatch(ctx, posts, viewerID); err != nil {
		return nil, nil, err
	}

	return posts, nextCursor, nil
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

func (s *postService) Feed(ctx context.Context, followerID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, *uuid.UUID, error) {
	creatorIDs, err := s.followRepo.GetFollowedCreatorIDs(ctx, followerID)
	if err != nil {
		return nil, nil, err
	}
	if len(creatorIDs) == 0 {
		return []entity.Post{}, nil, nil
	}

	posts, err := s.postRepo.ListFeed(ctx, creatorIDs, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}

	var nextCursor *uuid.UUID
	if len(posts) > limit {
		nextCursor = &posts[limit].ID
		posts = posts[:limit]
	}

	if err := s.applyLockBatch(ctx, posts, &followerID); err != nil {
		return nil, nil, err
	}

	return posts, nextCursor, nil
}

// ---------------------------------------------------------------------------
// AddMedia
// ---------------------------------------------------------------------------

func (s *postService) AddMedia(ctx context.Context, postID, creatorID uuid.UUID, req AddMediaRequest) (*entity.PostMedia, error) {
	// Verify post belongs to creator.
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		return nil, err
	}
	if post.CreatorID != creatorID {
		return nil, entity.ErrForbidden
	}

	// Verify storage quota.
	profile, err := s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if err != nil {
		return nil, err
	}
	if profile.StorageUsedBytes+req.FileSize > profile.StorageQuotaBytes {
		return nil, entity.ErrFileTooLarge
	}

	// Choose bucket based on post access type
	bucket := s.cfg.MinIO.PublicBucket
	if post.AccessType == entity.PostAccessPaid {
		bucket = s.cfg.MinIO.PrivateBucket
	}

	objectName := fmt.Sprintf("posts/%s/media/%s-%s", postID, uuid.NewString(), req.FileName)
	url, err := s.storage.UploadFile(ctx, bucket, objectName, req.File, req.FileSize, req.ContentType)
	if err != nil {
		return nil, err
	}

	media := &entity.PostMedia{
		ID:        uuid.New(),
		PostID:    postID,
		URL:       url,
		ThumbURL:  req.ThumbURL,
		MediaType: req.MediaType,
		SortOrder: req.SortOrder,
	}

	if err := s.postRepo.AddMedia(ctx, media); err != nil {
		_ = s.storage.DeleteFile(ctx, bucket, objectName)
		return nil, err
	}

	// Update creator storage usage.
	if err := s.userRepo.IncrementCreatorStorage(ctx, profile.ID, req.FileSize); err != nil {
		return nil, err
	}

	return media, nil
}

// ---------------------------------------------------------------------------
// DeleteMedia
// ---------------------------------------------------------------------------

func (s *postService) DeleteMedia(ctx context.Context, mediaID, postID, creatorID uuid.UUID) error {
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		return err
	}
	if post.CreatorID != creatorID {
		return entity.ErrForbidden
	}

	_, err = s.postRepo.DeleteMedia(ctx, mediaID)
	return err
}

// ---------------------------------------------------------------------------
// IncrementView
// ---------------------------------------------------------------------------

func (s *postService) IncrementView(ctx context.Context, postID uuid.UUID) error {
	return s.postRepo.IncrementViewCount(ctx, postID)
}

// ---------------------------------------------------------------------------
// ListPurchased
// ---------------------------------------------------------------------------

func (s *postService) ListPurchased(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, *uuid.UUID, error) {
	posts, err := s.postRepo.ListPurchasedPosts(ctx, supporterID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(posts) > limit {
		next = &posts[limit].ID
		posts = posts[:limit]
	}
	return posts, next, nil
}

func (s *postService) LikePost(ctx context.Context, postID, userID uuid.UUID) error {
	if err := s.postRepo.LikePost(ctx, postID, userID); err != nil { return err }
	// Notify creator
	post, err := s.postRepo.FindByID(ctx, postID)
	if err == nil && post.CreatorID != userID {
		user, _ := s.userRepo.FindByID(ctx, userID)
		name := "Seseorang"
		if user != nil { name = user.DisplayName }
		_ = s.followRepo.CreateNotification(ctx, &entity.Notification{
			ID: uuid.New(), UserID: post.CreatorID, Type: entity.NotificationNewLike,
			Title: "Like Baru ❤️", Body: fmt.Sprintf("%s menyukai post \"%s\"", name, post.Title),
			ReferenceID: &postID,
		})
	}
	return nil
}

func (s *postService) UnlikePost(ctx context.Context, postID, userID uuid.UUID) error {
	return s.postRepo.UnlikePost(ctx, postID, userID)
}

func (s *postService) CreateComment(ctx context.Context, postID, userID uuid.UUID, content string) (*entity.PostComment, error) {
	clean := validator.SanitizeString(content)
	if clean == "" {
		return nil, entity.ErrForbidden
	}
	c := &entity.PostComment{ID: uuid.New(), PostID: postID, UserID: userID, Content: clean}
	if err := s.postRepo.CreateComment(ctx, c); err != nil {
		return nil, err
	}

	// Notify post creator (if not self-comment)
	post, _ := s.postRepo.FindByID(ctx, postID)
	if post != nil && post.CreatorID != userID {
		commenter, _ := s.userRepo.FindByID(ctx, userID)
		name := "Seseorang"
		if commenter != nil { name = commenter.DisplayName }
		_ = s.followRepo.CreateNotification(ctx, &entity.Notification{
			ID: uuid.New(), UserID: post.CreatorID, Type: "new_comment",
			Title: "Komentar Baru", Body: fmt.Sprintf("%s mengomentari \"%s\"", name, post.Title),
			ReferenceID: &postID,
		})
	}
	return c, nil
}

func (s *postService) ListComments(ctx context.Context, postID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.PostComment, *uuid.UUID, error) {
	comments, err := s.postRepo.ListComments(ctx, postID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(comments) > limit {
		next = &comments[limit].ID
		comments = comments[:limit]
	}
	return comments, next, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// applyLockBatch applies the paid-content lock to a slice of posts using a
// single batch query instead of N individual queries.
func (s *postService) applyLockBatch(ctx context.Context, posts []entity.Post, viewerID *uuid.UUID) error {
	if len(posts) == 0 {
		return nil
	}

	// Collect IDs of paid posts.
	var paidIDs []uuid.UUID
	for i := range posts {
		if posts[i].AccessType == entity.PostAccessPaid {
			paidIDs = append(paidIDs, posts[i].ID)
		}
	}
	if len(paidIDs) == 0 {
		return nil
	}

	// Determine which paid posts the viewer has purchased.
	var purchasedIDs map[uuid.UUID]bool
	var likedIDs map[uuid.UUID]bool

	if viewerID != nil {
		var err error
		purchasedIDs, err = s.postRepo.FindPurchasedPostIDs(ctx, *viewerID, paidIDs)
		if err != nil {
			return err
		}
		// Batch check likes for all posts
		allIDs := make([]uuid.UUID, len(posts))
		for i := range posts { allIDs[i] = posts[i].ID }
		likedIDs, _ = s.postRepo.HasLikedBatch(ctx, *viewerID, allIDs)
	}

	for i := range posts {
		// Set liked status
		if viewerID != nil && likedIDs[posts[i].ID] {
			posts[i].HasLiked = true
		}

		if posts[i].AccessType != entity.PostAccessPaid {
			continue
		}

		// Creator always has access to their own posts.
		if viewerID != nil && *viewerID == posts[i].CreatorID {
			posts[i].IsLocked = false
			posts[i].HasPurchased = true
			s.signPaidMedia(&posts[i])
			continue
		}

		if viewerID != nil && purchasedIDs[posts[i].ID] {
			posts[i].IsLocked = false
			posts[i].HasPurchased = true
			s.signPaidMedia(&posts[i])
		} else {
			posts[i].IsLocked = true
			posts[i].HasPurchased = false
			applyPostLock(&posts[i])
		}
	}

	return nil
}

// signPaidMedia generates pre-signed URLs for paid post media in private bucket.
func (s *postService) signPaidMedia(post *entity.Post) {
	for i := range post.Media {
		url := post.Media[i].URL
		if url != "" && !strings.HasPrefix(url, "/storage/") && !strings.HasPrefix(url, "http") {
			signed, err := s.storage.GetPresignedURL(context.Background(), s.cfg.MinIO.PrivateBucket, url, 15*time.Minute)
			if err == nil {
				post.Media[i].URL = signed
			}
		}
	}
}

// applyPostLock strips sensitive content from a locked post.
func applyPostLock(post *entity.Post) {
	post.Content = ""
	for i := range post.Media {
		// Keep only the thumbnail; hide the full-resolution URL.
		post.Media[i].URL = ""
	}
}

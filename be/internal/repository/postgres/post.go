package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type postRepo struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) repository.PostRepository {
	return &postRepo{db: db}
}

func (r *postRepo) Create(ctx context.Context, post *entity.Post) error {
	return r.db.WithContext(ctx).Create(post).Error
}

func (r *postRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Post, error) {
	var post entity.Post
	err := r.db.WithContext(ctx).Preload("Creator").Where("id = ? AND deleted_at IS NULL", id).First(&post).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &post, err
}

func (r *postRepo) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Post, error) {
	var post entity.Post
	err := r.db.WithContext(ctx).Unscoped().Preload("Creator").Preload("Media").Where("id = ?", id).First(&post).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &post, err
}

func (r *postRepo) Update(ctx context.Context, post *entity.Post) error {
	return r.db.WithContext(ctx).Save(post).Error
}

func (r *postRepo) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Post{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (r *postRepo) ListByCreator(ctx context.Context, creatorID uuid.UUID, status string, cursor *uuid.UUID, limit int) ([]entity.Post, error) {
	var posts []entity.Post
	q := r.db.WithContext(ctx).Preload("Media").Preload("Creator").Where("creator_id = ? AND deleted_at IS NULL", creatorID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&posts).Error
	return posts, err
}

func (r *postRepo) ListFeed(ctx context.Context, creatorIDs []uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, error) {
	var posts []entity.Post
	q := r.db.WithContext(ctx).Preload("Media").Preload("Creator").
		Where("creator_id IN ? AND status = ? AND deleted_at IS NULL", creatorIDs, entity.PostStatusPublished)
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&posts).Error
	return posts, err
}

func (r *postRepo) ListAll(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Post, error) {
	var posts []entity.Post
	q := r.db.WithContext(ctx).Preload("Media").Preload("Creator").Where("deleted_at IS NULL")
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&posts).Error
	return posts, err
}

func (r *postRepo) PublishScheduled(ctx context.Context) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&entity.Post{}).
		Where("scheduled_at IS NOT NULL AND scheduled_at <= ? AND status = 'draft'", now).
		Updates(map[string]interface{}{"status": "published", "published_at": now}).Error
}

func (r *postRepo) IncrementViewCount(ctx context.Context, postID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Post{}).
		Where("id = ?", postID).
		Update("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *postRepo) AddMedia(ctx context.Context, media *entity.PostMedia) error {
	return r.db.WithContext(ctx).Create(media).Error
}

func (r *postRepo) DeleteMedia(ctx context.Context, mediaID uuid.UUID) (*entity.PostMedia, error) {
	var media entity.PostMedia
	err := r.db.WithContext(ctx).Where("id = ?", mediaID).First(&media).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Delete(&media).Error; err != nil {
		return nil, err
	}
	return &media, nil
}

func (r *postRepo) ListMedia(ctx context.Context, postID uuid.UUID) ([]entity.PostMedia, error) {
	var media []entity.PostMedia
	err := r.db.WithContext(ctx).
		Where("post_id = ?", postID).
		Order("sort_order").
		Find(&media).Error
	return media, err
}

func (r *postRepo) CreatePurchase(ctx context.Context, p *entity.PostPurchase) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *postRepo) FindPurchase(ctx context.Context, postID, supporterID uuid.UUID) (*entity.PostPurchase, error) {
	var purchase entity.PostPurchase
	err := r.db.WithContext(ctx).
		Where("post_id = ? AND supporter_id = ?", postID, supporterID).
		First(&purchase).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &purchase, err
}

func (r *postRepo) FindPurchasedPostIDs(ctx context.Context, supporterID uuid.UUID, postIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	var purchases []entity.PostPurchase
	err := r.db.WithContext(ctx).
		Where("post_id IN ? AND supporter_id = ?", postIDs, supporterID).
		Find(&purchases).Error
	if err != nil {
		return nil, err
	}
	result := make(map[uuid.UUID]bool, len(purchases))
	for _, p := range purchases {
		result[p.PostID] = true
	}
	return result, nil
}

func (r *postRepo) ListPurchasedPosts(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Post, error) {
	var posts []entity.Post
	q := r.db.WithContext(ctx).Unscoped().Preload("Media").Preload("Creator").
		Joins("JOIN post_purchases ON post_purchases.post_id = posts.id").
		Where("post_purchases.supporter_id = ?", supporterID)
	if cursor != nil {
		q = q.Where("posts.id > ?", *cursor)
	}
	err := q.Order("posts.created_at DESC").Limit(limit).Find(&posts).Error
	return posts, err
}

func (r *postRepo) LikePost(ctx context.Context, postID, userID uuid.UUID) error {
	like := entity.PostLike{PostID: postID, UserID: userID}
	if err := r.db.WithContext(ctx).Create(&like).Error; err != nil {
		return err
	}
	return r.db.WithContext(ctx).Model(&entity.Post{}).Where("id = ?", postID).Update("like_count", gorm.Expr("like_count + 1")).Error
}

func (r *postRepo) UnlikePost(ctx context.Context, postID, userID uuid.UUID) error {
	res := r.db.WithContext(ctx).Where("post_id = ? AND user_id = ?", postID, userID).Delete(&entity.PostLike{})
	if res.RowsAffected == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Model(&entity.Post{}).Where("id = ?", postID).Update("like_count", gorm.Expr("GREATEST(like_count - 1, 0)")).Error
}

func (r *postRepo) HasLiked(ctx context.Context, postID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.PostLike{}).Where("post_id = ? AND user_id = ?", postID, userID).Count(&count).Error
	return count > 0, err
}

func (r *postRepo) HasLikedBatch(ctx context.Context, userID uuid.UUID, postIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	var likes []entity.PostLike
	err := r.db.WithContext(ctx).Where("user_id = ? AND post_id IN ?", userID, postIDs).Find(&likes).Error
	if err != nil {
		return nil, err
	}
	m := make(map[uuid.UUID]bool, len(likes))
	for _, l := range likes {
		m[l.PostID] = true
	}
	return m, nil
}

func (r *postRepo) CreateComment(ctx context.Context, c *entity.PostComment) error {
	if err := r.db.WithContext(ctx).Create(c).Error; err != nil {
		return err
	}
	return r.db.WithContext(ctx).Model(&entity.Post{}).Where("id = ?", c.PostID).Update("comment_count", gorm.Expr("comment_count + 1")).Error
}

func (r *postRepo) ListComments(ctx context.Context, postID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.PostComment, error) {
	var comments []entity.PostComment
	q := r.db.WithContext(ctx).Preload("User").Where("post_id = ?", postID)
	if cursor != nil {
		q = q.Where("id > ?", *cursor)
	}
	err := q.Order("created_at ASC").Limit(limit).Find(&comments).Error
	return comments, err
}

func (r *postRepo) DeleteComment(ctx context.Context, commentID, userID uuid.UUID) error {
	res := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", commentID, userID).Delete(&entity.PostComment{})
	if res.Error != nil {
		return res.Error
	}
	return nil
}

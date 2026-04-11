package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type followRepo struct {
	db *gorm.DB
}

func NewFollowRepository(db *gorm.DB) repository.FollowRepository {
	return &followRepo{db: db}
}

func (r *followRepo) Follow(ctx context.Context, followerID, creatorID uuid.UUID) error {
	follow := entity.Follow{
		FollowerID: followerID,
		CreatorID:  creatorID,
	}
	return r.db.WithContext(ctx).Create(&follow).Error
}

func (r *followRepo) Unfollow(ctx context.Context, followerID, creatorID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("follower_id = ? AND creator_id = ?", followerID, creatorID).
		Delete(&entity.Follow{}).Error
}

func (r *followRepo) IsFollowing(ctx context.Context, followerID, creatorID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Follow{}).
		Where("follower_id = ? AND creator_id = ?", followerID, creatorID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *followRepo) GetFollowedCreatorIDs(ctx context.Context, followerID uuid.UUID) ([]uuid.UUID, error) {
	var follows []entity.Follow
	err := r.db.WithContext(ctx).
		Where("follower_id = ?", followerID).
		Find(&follows).Error
	if err != nil {
		return nil, err
	}
	ids := make([]uuid.UUID, len(follows))
	for i, f := range follows {
		ids[i] = f.CreatorID
	}
	return ids, nil
}

func (r *followRepo) CreateNotification(ctx context.Context, n *entity.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *followRepo) BulkCreateNotifications(ctx context.Context, notifications []entity.Notification) error {
	if len(notifications) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).CreateInBatches(notifications, 100).Error
}

func (r *followRepo) ListNotifications(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Notification, error) {
	var notifications []entity.Notification
	q := r.db.WithContext(ctx).Where("user_id = ?", userID)
	if cursor != nil {
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&notifications).Error
	return notifications, err
}

func (r *followRepo) CountUnread(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Count(&count).Error
	return count, err
}

func (r *followRepo) MarkRead(ctx context.Context, notifID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("id = ? AND user_id = ?", notifID, userID).
		Update("is_read", true).Error
}

func (r *followRepo) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Update("is_read", true).Error
}

func (r *followRepo) DeleteNotification(ctx context.Context, notifID, userID uuid.UUID) error {
	result := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", notifID, userID).Delete(&entity.Notification{})
	if result.RowsAffected == 0 { return entity.ErrNotFound }
	return result.Error
}

func (r *followRepo) DeleteReadNotifications(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("user_id = ? AND is_read = true", userID).Delete(&entity.Notification{}).Error
}

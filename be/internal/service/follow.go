package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
)

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

type FollowService interface {
	Follow(ctx context.Context, followerID, creatorID uuid.UUID) error
	Unfollow(ctx context.Context, followerID, creatorID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, creatorID uuid.UUID) (bool, error)
	ListNotifications(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Notification, *uuid.UUID, error)
	CountUnread(ctx context.Context, userID uuid.UUID) (int64, error)
	MarkRead(ctx context.Context, notifID, userID uuid.UUID) error
	MarkAllRead(ctx context.Context, userID uuid.UUID) error
	DeleteNotification(ctx context.Context, notifID, userID uuid.UUID) error
	DeleteReadNotifications(ctx context.Context, userID uuid.UUID) error
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type followService struct {
	followRepo repository.FollowRepository
	userRepo   repository.UserRepository
}

func NewFollowService(followRepo repository.FollowRepository, userRepo repository.UserRepository) FollowService {
	return &followService{followRepo: followRepo, userRepo: userRepo}
}

func (s *followService) Follow(ctx context.Context, followerID, creatorID uuid.UUID) error {
	if followerID == creatorID {
		return entity.ErrForbidden // can't follow yourself
	}
	profile, err := s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("follow: creator not found: %w", err)
	}

	// 9.4: Check already following
	already, _ := s.followRepo.IsFollowing(ctx, followerID, creatorID)
	if already { return nil } // idempotent

	if err := s.followRepo.Follow(ctx, followerID, creatorID); err != nil {
		return err
	}
	_ = s.userRepo.IncrementFollowerCount(ctx, profile.ID, 1)

	follower, _ := s.userRepo.FindByID(ctx, followerID)
	name := "Seseorang"
	if follower != nil { name = follower.DisplayName }
	_ = s.followRepo.CreateNotification(ctx, &entity.Notification{
		ID: uuid.New(), UserID: creatorID, Type: "new_follower",
		Title: "Follower Baru!", Body: fmt.Sprintf("%s mulai mengikuti kamu.", name),
	})
	return nil
}

func (s *followService) Unfollow(ctx context.Context, followerID, creatorID uuid.UUID) error {
	profile, err := s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("unfollow: creator not found: %w", err)
	}

	// 9.5: Check actually following before decrement
	following, _ := s.followRepo.IsFollowing(ctx, followerID, creatorID)
	if !following { return nil } // idempotent

	if err := s.followRepo.Unfollow(ctx, followerID, creatorID); err != nil {
		return err
	}
	_ = s.userRepo.IncrementFollowerCount(ctx, profile.ID, -1)
	return nil
}

func (s *followService) IsFollowing(ctx context.Context, followerID, creatorID uuid.UUID) (bool, error) {
	return s.followRepo.IsFollowing(ctx, followerID, creatorID)
}

func (s *followService) ListNotifications(ctx context.Context, userID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Notification, *uuid.UUID, error) {
	notifs, err := s.followRepo.ListNotifications(ctx, userID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(notifs) > limit {
		next = &notifs[limit].ID
		notifs = notifs[:limit]
	}
	return notifs, next, nil
}

func (s *followService) CountUnread(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.followRepo.CountUnread(ctx, userID)
}

func (s *followService) MarkRead(ctx context.Context, notifID, userID uuid.UUID) error {
	return s.followRepo.MarkRead(ctx, notifID, userID)
}

func (s *followService) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	return s.followRepo.MarkAllRead(ctx, userID)
}

func (s *followService) DeleteNotification(ctx context.Context, notifID, userID uuid.UUID) error {
	return s.followRepo.DeleteNotification(ctx, notifID, userID)
}

func (s *followService) DeleteReadNotifications(ctx context.Context, userID uuid.UUID) error {
	return s.followRepo.DeleteReadNotifications(ctx, userID)
}

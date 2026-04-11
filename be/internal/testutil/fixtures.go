package testutil

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// CreateUser creates a test user with sensible defaults.
func CreateUser(db *gorm.DB, role entity.UserRole, email string) *entity.User {
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 4)
	u := &entity.User{
		ID: uuid.New(), Email: email, Username: email[:8],
		PasswordHash: string(hash), DisplayName: "Test " + string(role), Role: role,
	}
	db.Create(u)
	return u
}

// CreateCreatorWithProfile creates a creator user + profile.
func CreateCreatorWithProfile(db *gorm.DB, email, slug string) (*entity.User, *entity.CreatorProfile) {
	u := CreateUser(db, entity.RoleCreator, email)
	p := &entity.CreatorProfile{ID: uuid.New(), UserID: u.ID, PageSlug: slug}
	db.Create(p)
	return u, p
}

// CreateWallet ensures a wallet exists with the given balance.
func CreateWallet(db *gorm.DB, userID uuid.UUID, balance int64) *entity.UserWallet {
	w := &entity.UserWallet{ID: uuid.New(), UserID: userID, BalanceCredits: balance}
	db.Create(w)
	return w
}

// CreatePost creates a test post.
func CreatePost(db *gorm.DB, creatorID uuid.UUID, access entity.PostAccessType, price *int64) *entity.Post {
	now := time.Now()
	p := &entity.Post{
		ID: uuid.New(), CreatorID: creatorID, Title: "Test Post",
		Content: "content", AccessType: access, Price: price,
		Status: entity.PostStatusPublished, Visibility: "public", PublishedAt: &now,
	}
	db.Create(p)
	return p
}

// Ctx returns a background context.
func Ctx() context.Context { return context.Background() }

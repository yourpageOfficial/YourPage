package service_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

func BenchmarkCheckoutPost(b *testing.B) {
	e := newPaymentTestEnv()
	creatorID := uuid.New()
	price := int64(10000)

	e.userRepo.Users[creatorID] = &entity.User{ID: creatorID}
	e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		buyerID := uuid.New()
		e.walletRepo.Wallets[buyerID] = 1000
		e.userRepo.Users[buyerID] = &entity.User{ID: buyerID}

		postID := uuid.New()
		e.postRepo.Posts[postID] = &entity.Post{
			ID: postID, CreatorID: creatorID, AccessType: entity.PostAccessPaid,
			Price: &price, Status: entity.PostStatusPublished,
		}

		e.svc.CheckoutPost(ctx, buyerID, service.CheckoutPostRequest{PostID: postID})
	}
}

func BenchmarkCheckoutDonation(b *testing.B) {
	e := newPaymentTestEnv()
	creatorID := uuid.New()

	e.userRepo.Users[creatorID] = &entity.User{ID: creatorID}
	e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		buyerID := uuid.New()
		e.walletRepo.Wallets[buyerID] = 10000
		e.userRepo.Users[buyerID] = &entity.User{ID: buyerID, DisplayName: "Donor"}

		e.svc.CheckoutDonation(ctx, buyerID, service.CheckoutDonationRequest{
			CreatorID: creatorID, AmountIDR: 10000, DonorName: "Test",
		})
	}
}

func BenchmarkChatSendMessage(b *testing.B) {
	chatRepo := testutil.NewMockChatRepo()
	userRepo := testutil.NewMockUserRepo()
	walletRepo := testutil.NewMockWalletRepo()
	followRepo := testutil.NewMockFollowRepo()

	svc := service.NewChatService(chatRepo, userRepo, walletRepo, followRepo, testutil.NewMockPaymentRepo())

	creatorID := uuid.New()
	supporterID := uuid.New()

	userRepo.Users[supporterID] = &entity.User{ID: supporterID, Role: entity.RoleSupporter, DisplayName: "S"}
	userRepo.Users[creatorID] = &entity.User{ID: creatorID, Role: entity.RoleCreator}
	userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID, ChatAllowFrom: "all"}

	// Pre-create conversation and set following
	conv, _ := chatRepo.FindOrCreateConversation(context.Background(), creatorID, supporterID)

	ctx := context.Background()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		svc.SendMessage(ctx, supporterID, service.SendMessageRequest{
			ConversationID: &conv.ID, Content: "Hello!",
		})
	}
}

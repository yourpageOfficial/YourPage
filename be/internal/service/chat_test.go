package service_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

type chatTestEnv struct {
	svc        service.ChatService
	chatRepo   *testutil.MockChatRepo
	userRepo   *testutil.MockUserRepo
	walletRepo *testutil.MockWalletRepo
	followRepo *testutil.MockFollowRepo
}

func newChatTestEnv() *chatTestEnv {
	e := &chatTestEnv{
		chatRepo:   testutil.NewMockChatRepo(),
		userRepo:   testutil.NewMockUserRepo(),
		walletRepo: testutil.NewMockWalletRepo(),
		followRepo: testutil.NewMockFollowRepo(),
	}
	e.svc = service.NewChatService(e.chatRepo, e.userRepo, e.walletRepo, e.followRepo, testutil.NewMockPaymentRepo())
	return e
}

func TestChatSendMessage(t *testing.T) {
	ctx := context.Background()
	creatorID := uuid.New()
	supporterID := uuid.New()

	tests := []struct {
		name    string
		setup   func(e *chatTestEnv)
		sender  uuid.UUID
		req     service.SendMessageRequest
		wantErr bool
	}{
		{
			name: "supporter sends to creator (free chat)",
			setup: func(e *chatTestEnv) {
				e.userRepo.Users[supporterID] = &entity.User{ID: supporterID, Role: entity.RoleSupporter, DisplayName: "Supporter"}
				e.userRepo.Users[creatorID] = &entity.User{ID: creatorID, Role: entity.RoleCreator}
				e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID, ChatAllowFrom: "all"}
			},
			sender:  supporterID,
			req:     service.SendMessageRequest{CreatorID: creatorID, Content: "Hello!"},
			wantErr: true, // must follow first
		},
		{
			name: "self-chat blocked",
			setup: func(e *chatTestEnv) {
				e.userRepo.Users[creatorID] = &entity.User{ID: creatorID, Role: entity.RoleCreator}
				e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}
			},
			sender:  creatorID,
			req:     service.SendMessageRequest{CreatorID: creatorID, Content: "Hi"},
			wantErr: true,
		},
		{
			name: "chat disabled (none)",
			setup: func(e *chatTestEnv) {
				e.userRepo.Users[supporterID] = &entity.User{ID: supporterID, Role: entity.RoleSupporter}
				e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID, ChatAllowFrom: "none"}
			},
			sender:  supporterID,
			req:     service.SendMessageRequest{CreatorID: creatorID, Content: "Hi"},
			wantErr: true,
		},
		{
			name: "missing creator_id",
			setup: func(e *chatTestEnv) {
				e.userRepo.Users[supporterID] = &entity.User{ID: supporterID, Role: entity.RoleSupporter}
			},
			sender:  supporterID,
			req:     service.SendMessageRequest{Content: "Hi"},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := newChatTestEnv()
			tt.setup(e)
			_, err := e.svc.SendMessage(ctx, tt.sender, tt.req)
			if tt.wantErr && err == nil {
				t.Error("expected error, got nil")
			}
			if !tt.wantErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestChatGetMessages_Forbidden(t *testing.T) {
	e := newChatTestEnv()
	creatorID := uuid.New()
	supporterID := uuid.New()
	outsiderID := uuid.New()

	conv := &entity.ChatConversation{ID: uuid.New(), CreatorID: creatorID, SupporterID: supporterID}
	e.chatRepo.Conversations[conv.ID] = conv

	_, err := e.svc.GetMessages(context.Background(), outsiderID, conv.ID, 50)
	if err != entity.ErrForbidden {
		t.Errorf("got err=%v, want ErrForbidden", err)
	}
}

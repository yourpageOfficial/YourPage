package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"github.com/yourpage/be/internal/repository/postgres"
)

type ChatService interface {
	ListConversations(ctx context.Context, userID uuid.UUID) ([]entity.ChatConversation, error)
	GetMessages(ctx context.Context, userID, convID uuid.UUID, limit int) ([]entity.ChatMessage, error)
	SendMessage(ctx context.Context, senderID uuid.UUID, req SendMessageRequest) (*entity.ChatMessage, error)
	MarkRead(ctx context.Context, userID, convID uuid.UUID) error
}

type SendMessageRequest struct {
	CreatorID      uuid.UUID  `json:"creator_id"`
	ConversationID *uuid.UUID `json:"conversation_id"`
	Content        string     `json:"content" validate:"required,max=2000"`
}

type chatService struct {
	chatRepo   *postgres.ChatRepo
	userRepo   repository.UserRepository
	walletRepo repository.WalletRepository
	followRepo repository.FollowRepository
}

func NewChatService(chatRepo *postgres.ChatRepo, userRepo repository.UserRepository, walletRepo repository.WalletRepository, followRepo repository.FollowRepository) ChatService {
	return &chatService{chatRepo: chatRepo, userRepo: userRepo, walletRepo: walletRepo, followRepo: followRepo}
}

func (s *chatService) ListConversations(ctx context.Context, userID uuid.UUID) ([]entity.ChatConversation, error) {
	return s.chatRepo.ListConversations(ctx, userID)
}

func (s *chatService) GetMessages(ctx context.Context, userID, convID uuid.UUID, limit int) ([]entity.ChatMessage, error) {
	conv, err := s.chatRepo.FindConversation(ctx, convID)
	if err != nil { return nil, err }
	if conv.CreatorID != userID && conv.SupporterID != userID { return nil, entity.ErrForbidden }
	isCreator := conv.CreatorID == userID
	s.chatRepo.ResetUnread(ctx, convID, isCreator)
	return s.chatRepo.ListMessages(ctx, convID, limit)
}

func (s *chatService) SendMessage(ctx context.Context, senderID uuid.UUID, req SendMessageRequest) (*entity.ChatMessage, error) {
	sender, err := s.userRepo.FindByID(ctx, senderID)
	if err != nil { return nil, err }

	// Creator replying to existing conversation
	if req.ConversationID != nil {
		conv, err := s.chatRepo.FindConversation(ctx, *req.ConversationID)
		if err != nil { return nil, err }
		if conv.CreatorID != senderID && conv.SupporterID != senderID { return nil, entity.ErrForbidden }

		// Check daily limit for Free tier creator
		if conv.CreatorID == senderID {
			profile, _ := s.userRepo.FindCreatorByUserID(ctx, senderID)
			if profile != nil && (profile.Tier == nil || profile.Tier.PriceIDR == 0) {
				count, _ := s.chatRepo.CountTodayMessages(ctx, senderID)
				if count >= 10 { return nil, fmt.Errorf("Batas 10 chat/hari untuk tier Free. Upgrade untuk unlimited.") }
			}
		}

		msg := &entity.ChatMessage{ID: uuid.New(), ConversationID: conv.ID, SenderID: senderID, Content: req.Content}
		if err := s.chatRepo.CreateMessage(ctx, msg); err != nil { return nil, err }
		forCreator := conv.SupporterID == senderID
		s.chatRepo.IncrementUnread(ctx, conv.ID, forCreator)
		msg.Sender = sender
		return msg, nil
	}

	// Supporter starting new chat
	if req.CreatorID == uuid.Nil { return nil, fmt.Errorf("creator_id required") }
	if req.CreatorID == senderID { return nil, entity.ErrForbidden }

	creatorProfile, err := s.userRepo.FindCreatorByUserID(ctx, req.CreatorID)
	if err != nil { return nil, entity.ErrNotFound }

	// Must follow
	isFollowing, _ := s.followRepo.IsFollowing(ctx, senderID, req.CreatorID)
	if !isFollowing { return nil, fmt.Errorf("Follow creator terlebih dahulu untuk mengirim chat") }

	conv, err := s.chatRepo.FindOrCreateConversation(ctx, req.CreatorID, senderID)
	if err != nil { return nil, err }

	// Paid chat
	isPaid := creatorProfile.ChatPriceIDR > 0
	if isPaid {
		wallet, err := s.walletRepo.FindOrCreateWallet(ctx, senderID)
		if err != nil { return nil, err }
		if wallet.BalanceCredits < creatorProfile.ChatPriceIDR { return nil, entity.ErrInsufficientCredit }
		if err := s.walletRepo.DeductCredits(ctx, senderID, creatorProfile.ChatPriceIDR); err != nil { return nil, err }
		fee := creatorProfile.ChatPriceIDR * 20 / 100
		creatorProfile.BalanceIDR += creatorProfile.ChatPriceIDR - fee
		creatorProfile.TotalEarnings += creatorProfile.ChatPriceIDR - fee
		creatorProfile.Tier = nil
		s.userRepo.UpdateCreatorProfile(ctx, creatorProfile)
	}

	msg := &entity.ChatMessage{
		ID: uuid.New(), ConversationID: conv.ID, SenderID: senderID,
		Content: req.Content, IsPaid: isPaid, AmountIDR: creatorProfile.ChatPriceIDR,
	}
	if err := s.chatRepo.CreateMessage(ctx, msg); err != nil { return nil, err }
	s.chatRepo.IncrementUnread(ctx, conv.ID, true)

	// Auto-reply (Business tier)
	if creatorProfile.AutoReply != nil && *creatorProfile.AutoReply != "" && creatorProfile.Tier != nil && creatorProfile.Tier.Name == "Business" {
		autoMsg := &entity.ChatMessage{ID: uuid.New(), ConversationID: conv.ID, SenderID: req.CreatorID, Content: *creatorProfile.AutoReply}
		s.chatRepo.CreateMessage(ctx, autoMsg)
		s.chatRepo.IncrementUnread(ctx, conv.ID, false)
	}

	msg.Sender = sender
	return msg, nil
}

func (s *chatService) MarkRead(ctx context.Context, userID, convID uuid.UUID) error {
	conv, err := s.chatRepo.FindConversation(ctx, convID)
	if err != nil { return err }
	isCreator := conv.CreatorID == userID
	return s.chatRepo.ResetUnread(ctx, convID, isCreator)
}

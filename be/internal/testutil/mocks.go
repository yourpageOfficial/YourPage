package testutil

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
)

// --- Mock Repositories ---

// MockPaymentRepo implements repository.PaymentRepository
type MockPaymentRepo struct {
	mu       sync.Mutex
	Payments map[uuid.UUID]*entity.Payment
	ByExtID  map[string]*entity.Payment
}

func NewMockPaymentRepo() *MockPaymentRepo {
	return &MockPaymentRepo{Payments: map[uuid.UUID]*entity.Payment{}, ByExtID: map[string]*entity.Payment{}}
}

func (m *MockPaymentRepo) Create(_ context.Context, p *entity.Payment) error {
	m.mu.Lock(); defer m.mu.Unlock()
	m.Payments[p.ID] = p; m.ByExtID[p.ExternalID] = p; return nil
}
func (m *MockPaymentRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.Payment, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	if p, ok := m.Payments[id]; ok { return p, nil }
	return nil, entity.ErrNotFound
}
func (m *MockPaymentRepo) FindByExternalID(_ context.Context, eid string) (*entity.Payment, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	if p, ok := m.ByExtID[eid]; ok { return p, nil }
	return nil, entity.ErrNotFound
}
func (m *MockPaymentRepo) UpdateStatus(_ context.Context, id uuid.UUID, s entity.PaymentStatus, paidAt interface{}) error {
	m.mu.Lock(); defer m.mu.Unlock()
	if p, ok := m.Payments[id]; ok { p.Status = s }; return nil
}
func (m *MockPaymentRepo) UpdateWebhookPayload(_ context.Context, id uuid.UUID, payload entity.JSONMap) error {
	return nil
}
func (m *MockPaymentRepo) List(_ context.Context, _ *uuid.UUID, _ int) ([]entity.Payment, error) {
	return nil, nil
}
func (m *MockPaymentRepo) ListByPayer(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Payment, error) {
	return nil, nil
}
func (m *MockPaymentRepo) ListByReferenceCreator(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Payment, error) {
	return nil, nil
}

// MockPostRepo implements repository.PostRepository
type MockPostRepo struct {
	mu        sync.Mutex
	Posts     map[uuid.UUID]*entity.Post
	Purchases map[string]bool // "postID:userID"
}

func NewMockPostRepo() *MockPostRepo {
	return &MockPostRepo{Posts: map[uuid.UUID]*entity.Post{}, Purchases: map[string]bool{}}
}

func (m *MockPostRepo) Create(_ context.Context, p *entity.Post) error {
	m.mu.Lock(); defer m.mu.Unlock(); m.Posts[p.ID] = p; return nil
}
func (m *MockPostRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.Post, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	if p, ok := m.Posts[id]; ok { return p, nil }
	return nil, entity.ErrNotFound
}
func (m *MockPostRepo) FindByIDUnscoped(_ context.Context, id uuid.UUID) (*entity.Post, error) {
	return m.FindByID(context.Background(), id)
}
func (m *MockPostRepo) Update(_ context.Context, _ *entity.Post) error { return nil }
func (m *MockPostRepo) SoftDelete(_ context.Context, _ uuid.UUID) error { return nil }
func (m *MockPostRepo) ListByCreator(_ context.Context, _ uuid.UUID, _ string, _ *uuid.UUID, _ int) ([]entity.Post, error) {
	return nil, nil
}
func (m *MockPostRepo) ListFeed(_ context.Context, _ []uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Post, error) {
	return nil, nil
}
func (m *MockPostRepo) ListAll(_ context.Context, _ *uuid.UUID, _ int) ([]entity.Post, error) {
	return nil, nil
}
func (m *MockPostRepo) IncrementViewCount(_ context.Context, _ uuid.UUID) error { return nil }
func (m *MockPostRepo) PublishScheduled(_ context.Context) error                { return nil }
func (m *MockPostRepo) CheckMembership(_ context.Context, _, _ uuid.UUID) bool  { return false }
func (m *MockPostRepo) CheckMembershipTier(_ context.Context, _, _, _ uuid.UUID) bool {
	return false
}
func (m *MockPostRepo) AddMedia(_ context.Context, _ *entity.PostMedia) error { return nil }
func (m *MockPostRepo) DeleteMedia(_ context.Context, _ uuid.UUID) (*entity.PostMedia, error) {
	return nil, nil
}
func (m *MockPostRepo) ListMedia(_ context.Context, _ uuid.UUID) ([]entity.PostMedia, error) {
	return nil, nil
}
func (m *MockPostRepo) CreatePurchase(_ context.Context, p *entity.PostPurchase) error {
	m.mu.Lock(); defer m.mu.Unlock()
	m.Purchases[p.PostID.String()+":"+p.SupporterID.String()] = true; return nil
}
func (m *MockPostRepo) FindPurchase(_ context.Context, postID, userID uuid.UUID) (*entity.PostPurchase, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	if m.Purchases[postID.String()+":"+userID.String()] { return &entity.PostPurchase{}, nil }
	return nil, entity.ErrNotFound
}
func (m *MockPostRepo) DeletePurchase(_ context.Context, postID, userID uuid.UUID) error {
	m.mu.Lock(); defer m.mu.Unlock()
	delete(m.Purchases, postID.String()+":"+userID.String()); return nil
}
func (m *MockPostRepo) FindPurchasedPostIDs(_ context.Context, _ uuid.UUID, _ []uuid.UUID) (map[uuid.UUID]bool, error) {
	return nil, nil
}
func (m *MockPostRepo) ListPurchasedPosts(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Post, error) {
	return nil, nil
}
func (m *MockPostRepo) LikePost(_ context.Context, _, _ uuid.UUID) error   { return nil }
func (m *MockPostRepo) UnlikePost(_ context.Context, _, _ uuid.UUID) error { return nil }
func (m *MockPostRepo) HasLiked(_ context.Context, _, _ uuid.UUID) (bool, error) {
	return false, nil
}
func (m *MockPostRepo) HasLikedBatch(_ context.Context, _ uuid.UUID, _ []uuid.UUID) (map[uuid.UUID]bool, error) {
	return nil, nil
}
func (m *MockPostRepo) CreateComment(_ context.Context, _ *entity.PostComment) error { return nil }
func (m *MockPostRepo) ListComments(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.PostComment, error) {
	return nil, nil
}
func (m *MockPostRepo) DeleteComment(_ context.Context, _, _ uuid.UUID) error { return nil }

// MockProductRepo implements repository.ProductRepository
type MockProductRepo struct {
	Products  map[uuid.UUID]*entity.Product
	Purchases map[string]bool
}

func NewMockProductRepo() *MockProductRepo {
	return &MockProductRepo{Products: map[uuid.UUID]*entity.Product{}, Purchases: map[string]bool{}}
}

func (m *MockProductRepo) Create(_ context.Context, p *entity.Product) error {
	m.Products[p.ID] = p; return nil
}
func (m *MockProductRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.Product, error) {
	if p, ok := m.Products[id]; ok { return p, nil }
	return nil, entity.ErrNotFound
}
func (m *MockProductRepo) FindBySlug(_ context.Context, _ string) (*entity.Product, error) {
	return nil, entity.ErrNotFound
}
func (m *MockProductRepo) Update(_ context.Context, _ *entity.Product) error { return nil }
func (m *MockProductRepo) SoftDelete(_ context.Context, _ uuid.UUID) error   { return nil }
func (m *MockProductRepo) ListByCreator(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Product, error) {
	return nil, nil
}
func (m *MockProductRepo) CountByCreator(_ context.Context, _ uuid.UUID) (int64, error) {
	return 0, nil
}
func (m *MockProductRepo) DeactivateExcess(_ context.Context, _ uuid.UUID, _ int) error {
	return nil
}
func (m *MockProductRepo) ListAll(_ context.Context, _ *uuid.UUID, _ int) ([]entity.Product, error) {
	return nil, nil
}
func (m *MockProductRepo) IncrementSalesCount(_ context.Context, _ uuid.UUID) error { return nil }
func (m *MockProductRepo) AddAsset(_ context.Context, _ *entity.ProductAsset) error { return nil }
func (m *MockProductRepo) DeleteAsset(_ context.Context, _ uuid.UUID) (*entity.ProductAsset, error) {
	return nil, nil
}
func (m *MockProductRepo) ListAssets(_ context.Context, _ uuid.UUID) ([]entity.ProductAsset, error) {
	return nil, nil
}
func (m *MockProductRepo) CreatePurchase(_ context.Context, p *entity.ProductPurchase) error {
	m.Purchases[p.ProductID.String()+":"+p.SupporterID.String()] = true; return nil
}
func (m *MockProductRepo) FindPurchase(_ context.Context, pid, uid uuid.UUID) (*entity.ProductPurchase, error) {
	if m.Purchases[pid.String()+":"+uid.String()] { return &entity.ProductPurchase{}, nil }
	return nil, entity.ErrNotFound
}
func (m *MockProductRepo) DeletePurchase(_ context.Context, _, _ uuid.UUID) error { return nil }
func (m *MockProductRepo) ListPurchasedProducts(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Product, error) {
	return nil, nil
}
func (m *MockProductRepo) LogDownload(_ context.Context, _, _ uuid.UUID) error { return nil }
func (m *MockProductRepo) GetDownloadCount(_ context.Context, _ uuid.UUID) (int64, error) {
	return 0, nil
}

// MockDonationRepo implements repository.DonationRepository
type MockDonationRepo struct {
	Donations map[uuid.UUID]*entity.Donation
}

func NewMockDonationRepo() *MockDonationRepo {
	return &MockDonationRepo{Donations: map[uuid.UUID]*entity.Donation{}}
}

func (m *MockDonationRepo) Create(_ context.Context, d *entity.Donation) error {
	m.Donations[d.ID] = d; return nil
}
func (m *MockDonationRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.Donation, error) {
	if d, ok := m.Donations[id]; ok { return d, nil }
	return nil, entity.ErrNotFound
}
func (m *MockDonationRepo) UpdateStatus(_ context.Context, _ uuid.UUID, _ entity.PaymentStatus) error {
	return nil
}
func (m *MockDonationRepo) ListByCreator(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Donation, error) {
	return nil, nil
}
func (m *MockDonationRepo) ListBySupporter(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Donation, error) {
	return nil, nil
}
func (m *MockDonationRepo) ListAll(_ context.Context, _ *uuid.UUID, _ int) ([]entity.Donation, error) {
	return nil, nil
}
func (m *MockDonationRepo) GetLatest(_ context.Context, _ uuid.UUID) (*entity.Donation, error) {
	return nil, entity.ErrNotFound
}
func (m *MockDonationRepo) GetTopSupporters(_ context.Context, _ uuid.UUID, _ int) ([]entity.TopSupporter, error) {
	return nil, nil
}

// MockWalletRepo implements repository.WalletRepository
type MockWalletRepo struct {
	mu       sync.Mutex
	Wallets  map[uuid.UUID]int64 // userID → balance
	TxLog    []entity.CreditTransaction
}

func NewMockWalletRepo() *MockWalletRepo {
	return &MockWalletRepo{Wallets: map[uuid.UUID]int64{}}
}

func (m *MockWalletRepo) FindOrCreateWallet(_ context.Context, uid uuid.UUID) (*entity.UserWallet, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	bal := m.Wallets[uid]
	return &entity.UserWallet{UserID: uid, BalanceCredits: bal}, nil
}
func (m *MockWalletRepo) AddCredits(_ context.Context, uid uuid.UUID, credits int64) error {
	m.mu.Lock(); defer m.mu.Unlock()
	m.Wallets[uid] += credits; return nil
}
func (m *MockWalletRepo) DeductCredits(_ context.Context, uid uuid.UUID, credits int64) error {
	m.mu.Lock(); defer m.mu.Unlock()
	if m.Wallets[uid] < credits { return entity.ErrInsufficientCredit }
	m.Wallets[uid] -= credits; return nil
}
func (m *MockWalletRepo) GetBalance(_ context.Context, uid uuid.UUID) (int64, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	return m.Wallets[uid], nil
}
func (m *MockWalletRepo) CreateTransaction(_ context.Context, tx *entity.CreditTransaction) error {
	m.mu.Lock(); defer m.mu.Unlock()
	m.TxLog = append(m.TxLog, *tx); return nil
}
func (m *MockWalletRepo) ListTransactions(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.CreditTransaction, error) {
	return nil, nil
}
func (m *MockWalletRepo) CreateTopupRequest(_ context.Context, _ *entity.CreditTopupRequest) error {
	return nil
}
func (m *MockWalletRepo) FindTopupRequest(_ context.Context, _ uuid.UUID) (*entity.CreditTopupRequest, error) {
	return nil, entity.ErrNotFound
}
func (m *MockWalletRepo) UpdateTopupRequest(_ context.Context, _ uuid.UUID, _ entity.PaymentStatus, _ *string) error {
	return nil
}
func (m *MockWalletRepo) UpdateTopupProof(_ context.Context, _ uuid.UUID, _, _ string) error {
	return nil
}
func (m *MockWalletRepo) ListTopupRequests(_ context.Context, _ string, _ *uuid.UUID, _ int) ([]entity.CreditTopupRequest, error) {
	return nil, nil
}
func (m *MockWalletRepo) CountPendingTopups(_ context.Context) (int64, error) { return 0, nil }
func (m *MockWalletRepo) CountPendingTopupsByUser(_ context.Context, _ uuid.UUID) (int64, error) { return 0, nil }

// MockUserRepo implements repository.UserRepository (minimal for payment tests)
type MockUserRepo struct {
	mu       sync.Mutex
	Users    map[uuid.UUID]*entity.User
	Profiles map[uuid.UUID]*entity.CreatorProfile
}

func NewMockUserRepo() *MockUserRepo {
	return &MockUserRepo{Users: map[uuid.UUID]*entity.User{}, Profiles: map[uuid.UUID]*entity.CreatorProfile{}}
}

func (m *MockUserRepo) Create(_ context.Context, u *entity.User) error {
	m.mu.Lock(); defer m.mu.Unlock(); m.Users[u.ID] = u; return nil
}
func (m *MockUserRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.User, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	if u, ok := m.Users[id]; ok { return u, nil }
	return nil, entity.ErrNotFound
}
func (m *MockUserRepo) FindByEmail(_ context.Context, email string) (*entity.User, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	for _, u := range m.Users { if u.Email == email { return u, nil } }
	return nil, entity.ErrNotFound
}
func (m *MockUserRepo) FindByUsername(_ context.Context, _ string) (*entity.User, error) {
	return nil, entity.ErrNotFound
}
func (m *MockUserRepo) Update(_ context.Context, _ *entity.User) error { return nil }
func (m *MockUserRepo) SoftDelete(_ context.Context, _ uuid.UUID) error { return nil }
func (m *MockUserRepo) HardDelete(_ context.Context, _ uuid.UUID) error { return nil }
func (m *MockUserRepo) List(_ context.Context, _ string, _ *uuid.UUID, _ int) ([]entity.User, error) {
	return nil, nil
}
func (m *MockUserRepo) CreateCreatorProfile(_ context.Context, p *entity.CreatorProfile) error {
	m.mu.Lock(); defer m.mu.Unlock(); m.Profiles[p.UserID] = p; return nil
}
func (m *MockUserRepo) FindCreatorBySlug(_ context.Context, _ string) (*entity.CreatorProfile, error) {
	return nil, entity.ErrNotFound
}
func (m *MockUserRepo) FindCreatorByUserID(_ context.Context, uid uuid.UUID) (*entity.CreatorProfile, error) {
	m.mu.Lock(); defer m.mu.Unlock()
	if p, ok := m.Profiles[uid]; ok { return p, nil }
	return nil, entity.ErrNotFound
}
func (m *MockUserRepo) UpdateCreatorProfile(_ context.Context, p *entity.CreatorProfile) error {
	m.mu.Lock(); defer m.mu.Unlock(); m.Profiles[p.UserID] = p; return nil
}
func (m *MockUserRepo) IncrementCreatorStorage(_ context.Context, _ uuid.UUID, _ int64) error {
	return nil
}
func (m *MockUserRepo) IncrementFollowerCount(_ context.Context, _ uuid.UUID, _ int) error {
	return nil
}
func (m *MockUserRepo) SearchCreators(_ context.Context, _, _ string, _ *uuid.UUID, _ int) ([]entity.CreatorProfile, error) {
	return nil, nil
}
func (m *MockUserRepo) ListFeaturedCreators(_ context.Context) ([]entity.CreatorProfile, error) {
	return nil, nil
}
func (m *MockUserRepo) ListExpiredTierCreators(_ context.Context) ([]entity.CreatorProfile, error) {
	return nil, nil
}
func (m *MockUserRepo) ListOverlayTiers(_ context.Context, _ uuid.UUID) ([]entity.OverlayTier, error) {
	return nil, nil
}
func (m *MockUserRepo) CreateOverlayTier(_ context.Context, _ *entity.OverlayTier) error { return nil }
func (m *MockUserRepo) DeleteOverlayTier(_ context.Context, _, _ uuid.UUID) error        { return nil }
func (m *MockUserRepo) ListFollowerIDs(_ context.Context, _ uuid.UUID) ([]uuid.UUID, error) {
	return nil, nil
}
func (m *MockUserRepo) GetAnalyticsCounts(_ context.Context) (map[string]int64, error) {
	return nil, nil
}
func (m *MockUserRepo) CreateNotification(_ context.Context, _ uuid.UUID, _, _, _ string, _ *uuid.UUID) error {
	return nil
}
func (m *MockUserRepo) FindReferralCode(_ context.Context, _ string) (*entity.ReferralCode, error) {
	return nil, entity.ErrNotFound
}
func (m *MockUserRepo) CreateReferralCode(_ context.Context, _ *entity.ReferralCode) error {
	return nil
}
func (m *MockUserRepo) IncrementReferralUsed(_ context.Context, _ uuid.UUID) error { return nil }
func (m *MockUserRepo) CountCreatorPosts(_ context.Context, _ uuid.UUID) (int64, error) {
	return 0, nil
}
func (m *MockUserRepo) CountCreatorProducts(_ context.Context, _ uuid.UUID) (int64, error) {
	return 0, nil
}
func (m *MockUserRepo) CountCreatorDonations(_ context.Context, _ uuid.UUID) (int64, int64, error) {
	return 0, 0, nil
}
func (m *MockUserRepo) CountCreatorSales(_ context.Context, _ uuid.UUID) (int64, int64, error) {
	return 0, 0, nil
}
func (m *MockUserRepo) CountCreatorDonationsRange(_ context.Context, _ uuid.UUID, _, _ time.Time) (int64, int64, error) {
	return 0, 0, nil
}
func (m *MockUserRepo) CountCreatorSalesRange(_ context.Context, _ uuid.UUID, _, _ time.Time) (int64, int64, error) {
	return 0, 0, nil
}

// MockFollowRepo implements repository.FollowRepository
type MockFollowRepo struct {
	Notifs []entity.Notification
}

func NewMockFollowRepo() *MockFollowRepo { return &MockFollowRepo{} }

func (m *MockFollowRepo) Follow(_ context.Context, _, _ uuid.UUID) error   { return nil }
func (m *MockFollowRepo) Unfollow(_ context.Context, _, _ uuid.UUID) error { return nil }
func (m *MockFollowRepo) IsFollowing(_ context.Context, _, _ uuid.UUID) (bool, error) {
	return false, nil
}
func (m *MockFollowRepo) GetFollowedCreatorIDs(_ context.Context, _ uuid.UUID) ([]uuid.UUID, error) {
	return nil, nil
}
func (m *MockFollowRepo) CreateNotification(_ context.Context, n *entity.Notification) error {
	m.Notifs = append(m.Notifs, *n); return nil
}
func (m *MockFollowRepo) BulkCreateNotifications(_ context.Context, _ []entity.Notification) error {
	return nil
}
func (m *MockFollowRepo) ListNotifications(_ context.Context, _ uuid.UUID, _ *uuid.UUID, _ int) ([]entity.Notification, error) {
	return nil, nil
}
func (m *MockFollowRepo) CountUnread(_ context.Context, _ uuid.UUID) (int64, error) { return 0, nil }
func (m *MockFollowRepo) MarkRead(_ context.Context, _, _ uuid.UUID) error          { return nil }
func (m *MockFollowRepo) MarkAllRead(_ context.Context, _ uuid.UUID) error          { return nil }
func (m *MockFollowRepo) DeleteNotification(_ context.Context, _, _ uuid.UUID) error { return nil }
func (m *MockFollowRepo) DeleteReadNotifications(_ context.Context, _ uuid.UUID) error {
	return nil
}

// MockPlatformRepo implements repository.PlatformRepository
type MockPlatformRepo struct {
	Settings *entity.PlatformSetting
}

func NewMockPlatformRepo() *MockPlatformRepo {
	return &MockPlatformRepo{Settings: &entity.PlatformSetting{FeePercent: 20, CreditRateIDR: 1000, MinWithdrawalIDR: 100000}}
}

func (m *MockPlatformRepo) GetSettings(_ context.Context) (*entity.PlatformSetting, error) {
	return m.Settings, nil
}
func (m *MockPlatformRepo) UpdateSettings(_ context.Context, _ *entity.PlatformSetting) error {
	return nil
}
func (m *MockPlatformRepo) CreatePlatformWithdrawal(_ context.Context, _ *entity.PlatformWithdrawal) error {
	return nil
}
func (m *MockPlatformRepo) ListPlatformWithdrawals(_ context.Context) ([]entity.PlatformWithdrawal, error) {
	return nil, nil
}
func (m *MockPlatformRepo) ListTiers(_ context.Context) ([]entity.CreatorTier, error) {
	return nil, nil
}
func (m *MockPlatformRepo) FindTier(_ context.Context, _ uuid.UUID) (*entity.CreatorTier, error) {
	return nil, entity.ErrNotFound
}

// MockMailer implements mailer.Mailer (no-op)
type MockMailer struct{}

func (MockMailer) SendPasswordReset(_ context.Context, _, _ string) error            { return nil }
func (MockMailer) SendEmailVerification(_ context.Context, _, _ string) error        { return nil }
func (MockMailer) SendWelcome(_ context.Context, _, _ string) error                  { return nil }
func (MockMailer) SendTopupApproved(_ context.Context, _ string, _ int64) error      { return nil }
func (MockMailer) SendTopupRejected(_ context.Context, _, _ string) error            { return nil }
func (MockMailer) SendWithdrawalProcessed(_ context.Context, _ string, _ int64, _ string) error {
	return nil
}
func (MockMailer) SendWithdrawalRejected(_ context.Context, _, _ string) error { return nil }
func (MockMailer) SendPurchaseReceipt(_ context.Context, _, _ string, _ int64) error { return nil }
func (MockMailer) SendDonationReceived(_ context.Context, _, _ string, _ int64, _ string) error {
	return nil
}
func (MockMailer) SendKYCApproved(_ context.Context, _ string) error                { return nil }
func (MockMailer) SendKYCRejected(_ context.Context, _, _ string) error             { return nil }
func (MockMailer) SendTierUpgrade(_ context.Context, _, _ string) error             { return nil }
func (MockMailer) SendTierExpired(_ context.Context, _ string) error                { return nil }
func (MockMailer) SendAdminPendingDigest(_ context.Context, _ string, _, _, _ int) error {
	return nil
}

// MockChatRepo implements repository.ChatRepository
type MockChatRepo struct {
	Conversations map[uuid.UUID]*entity.ChatConversation
	Messages      []entity.ChatMessage
}

func NewMockChatRepo() *MockChatRepo {
	return &MockChatRepo{Conversations: map[uuid.UUID]*entity.ChatConversation{}}
}

func (m *MockChatRepo) FindOrCreateConversation(_ context.Context, cid, sid uuid.UUID) (*entity.ChatConversation, error) {
	for _, c := range m.Conversations {
		if c.CreatorID == cid && c.SupporterID == sid { return c, nil }
	}
	conv := &entity.ChatConversation{ID: uuid.New(), CreatorID: cid, SupporterID: sid}
	m.Conversations[conv.ID] = conv
	return conv, nil
}
func (m *MockChatRepo) FindConversation(_ context.Context, id uuid.UUID) (*entity.ChatConversation, error) {
	if c, ok := m.Conversations[id]; ok { return c, nil }
	return nil, entity.ErrNotFound
}
func (m *MockChatRepo) ListConversations(_ context.Context, _ uuid.UUID) ([]entity.ChatConversation, error) {
	return nil, nil
}
func (m *MockChatRepo) CreateMessage(_ context.Context, msg *entity.ChatMessage) error {
	m.Messages = append(m.Messages, *msg); return nil
}
func (m *MockChatRepo) ListMessages(_ context.Context, _ uuid.UUID, _ int) ([]entity.ChatMessage, error) {
	return nil, nil
}
func (m *MockChatRepo) IncrementUnread(_ context.Context, _ uuid.UUID, _ bool) error { return nil }
func (m *MockChatRepo) ResetUnread(_ context.Context, _ uuid.UUID, _ bool) error     { return nil }
func (m *MockChatRepo) CountTodayMessages(_ context.Context, _ uuid.UUID) (int64, error) {
	return 0, nil
}

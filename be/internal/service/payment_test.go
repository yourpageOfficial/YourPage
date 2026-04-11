package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

// helper to build a payment service with mocks
type paymentTestEnv struct {
	svc         service.PaymentService
	paymentRepo *testutil.MockPaymentRepo
	postRepo    *testutil.MockPostRepo
	productRepo *testutil.MockProductRepo
	donationRepo *testutil.MockDonationRepo
	walletRepo  *testutil.MockWalletRepo
	userRepo    *testutil.MockUserRepo
	followRepo  *testutil.MockFollowRepo
	platformRepo *testutil.MockPlatformRepo
}

func newPaymentTestEnv() *paymentTestEnv {
	e := &paymentTestEnv{
		paymentRepo:  testutil.NewMockPaymentRepo(),
		postRepo:     testutil.NewMockPostRepo(),
		productRepo:  testutil.NewMockProductRepo(),
		donationRepo: testutil.NewMockDonationRepo(),
		walletRepo:   testutil.NewMockWalletRepo(),
		userRepo:     testutil.NewMockUserRepo(),
		followRepo:   testutil.NewMockFollowRepo(),
		platformRepo: testutil.NewMockPlatformRepo(),
	}
	e.svc = service.NewPaymentService(
		e.paymentRepo, e.postRepo, e.productRepo, e.donationRepo,
		e.walletRepo, e.userRepo, e.followRepo, e.platformRepo,
		testutil.MockMailer{},
	)
	return e
}

// --- CheckoutPost Tests ---

func TestCheckoutPost(t *testing.T) {
	ctx := context.Background()
	creatorID := uuid.New()
	price := int64(10000) // 10 credits

	tests := []struct {
		name      string
		setup     func(e *paymentTestEnv) uuid.UUID // returns buyerID
		postID    uuid.UUID
		wantErr   error
		wantBal   *int64 // expected buyer balance after
	}{
		{
			name: "happy path - buy paid post",
			setup: func(e *paymentTestEnv) uuid.UUID {
				buyerID := uuid.New()
				e.userRepo.Users[creatorID] = &entity.User{ID: creatorID, DisplayName: "Creator"}
				e.userRepo.Users[buyerID] = &entity.User{ID: buyerID, DisplayName: "Buyer"}
				e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}
				e.walletRepo.Wallets[buyerID] = 100 // 100 credits
				e.walletRepo.Wallets[creatorID] = 0
				return buyerID
			},
			wantErr: nil,
		},
		{
			name: "insufficient credits",
			setup: func(e *paymentTestEnv) uuid.UUID {
				buyerID := uuid.New()
				e.walletRepo.Wallets[buyerID] = 5 // only 5 credits, need 10
				return buyerID
			},
			wantErr: entity.ErrInsufficientCredit,
		},
		{
			name: "self-purchase blocked",
			setup: func(e *paymentTestEnv) uuid.UUID {
				return creatorID // buyer == creator
			},
			wantErr: entity.ErrForbidden,
		},
		{
			name: "already purchased",
			setup: func(e *paymentTestEnv) uuid.UUID {
				buyerID := uuid.New()
				e.walletRepo.Wallets[buyerID] = 100
				e.postRepo.Purchases[uuid.Nil.String()+":"+buyerID.String()] = true // will be set below
				return buyerID
			},
			wantErr: entity.ErrAlreadyPurchased,
		},
		{
			name: "post not found",
			setup: func(e *paymentTestEnv) uuid.UUID {
				return uuid.New()
			},
			postID:  uuid.New(), // non-existent
			wantErr: entity.ErrNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := newPaymentTestEnv()

			// Create the post
			postID := uuid.New()
			post := &entity.Post{
				ID: postID, CreatorID: creatorID, Title: "Test",
				AccessType: entity.PostAccessPaid, Price: &price,
				Status: entity.PostStatusPublished,
			}
			e.postRepo.Posts[postID] = post

			buyerID := tt.setup(e)

			// For "already purchased" test, fix the purchase key
			if tt.name == "already purchased" {
				e.postRepo.Purchases[postID.String()+":"+buyerID.String()] = true
			}

			targetPostID := postID
			if tt.postID != uuid.Nil {
				targetPostID = tt.postID
			}

			resp, err := e.svc.CheckoutPost(ctx, buyerID, service.CheckoutPostRequest{PostID: targetPostID})

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("got err=%v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if resp.Status != "paid" {
				t.Errorf("status = %s, want paid", resp.Status)
			}
			if resp.Subtotal != 10 {
				t.Errorf("subtotal = %d, want 10", resp.Subtotal)
			}
			// Verify buyer balance deducted
			bal, _ := e.walletRepo.GetBalance(ctx, buyerID)
			if bal != 90 {
				t.Errorf("buyer balance = %d, want 90", bal)
			}
			// Verify creator received net (80% of 10 = 8 credits)
			creatorBal, _ := e.walletRepo.GetBalance(ctx, creatorID)
			if creatorBal != 8 {
				t.Errorf("creator balance = %d, want 8", creatorBal)
			}
			// Verify purchase recorded
			if _, err := e.postRepo.FindPurchase(ctx, postID, buyerID); err != nil {
				t.Error("purchase not recorded")
			}
			// Verify payment created
			if len(e.paymentRepo.Payments) == 0 {
				t.Error("no payment created")
			}
		})
	}
}

// --- CheckoutProduct Tests ---

func TestCheckoutProduct(t *testing.T) {
	ctx := context.Background()
	creatorID := uuid.New()

	tests := []struct {
		name    string
		setup   func(e *paymentTestEnv, productID uuid.UUID) uuid.UUID
		wantErr error
	}{
		{
			name: "happy path",
			setup: func(e *paymentTestEnv, _ uuid.UUID) uuid.UUID {
				buyerID := uuid.New()
				e.userRepo.Users[creatorID] = &entity.User{ID: creatorID}
				e.userRepo.Users[buyerID] = &entity.User{ID: buyerID}
				e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}
				e.walletRepo.Wallets[buyerID] = 50
				return buyerID
			},
		},
		{
			name: "self-purchase blocked",
			setup: func(e *paymentTestEnv, _ uuid.UUID) uuid.UUID {
				e.walletRepo.Wallets[creatorID] = 100
				return creatorID
			},
			wantErr: entity.ErrForbidden,
		},
		{
			name: "inactive product",
			setup: func(e *paymentTestEnv, pid uuid.UUID) uuid.UUID {
				e.productRepo.Products[pid].IsActive = false
				buyerID := uuid.New()
				e.walletRepo.Wallets[buyerID] = 100
				return buyerID
			},
			wantErr: nil, // will get user-facing error string
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := newPaymentTestEnv()
			productID := uuid.New()
			e.productRepo.Products[productID] = &entity.Product{
				ID: productID, CreatorID: creatorID, PriceIDR: 20000, IsActive: true,
			}
			buyerID := tt.setup(e, productID)

			_, err := e.svc.CheckoutProduct(ctx, buyerID, service.CheckoutProductRequest{ProductID: productID})

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("got err=%v, want %v", err, tt.wantErr)
				}
			} else if tt.name == "inactive product" {
				if err == nil {
					t.Error("expected error for inactive product")
				}
			} else if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

// --- CheckoutDonation Tests ---

func TestCheckoutDonation(t *testing.T) {
	ctx := context.Background()
	creatorID := uuid.New()

	tests := []struct {
		name    string
		amount  int64
		setup   func(e *paymentTestEnv) uuid.UUID
		wantErr error
	}{
		{
			name:   "happy path",
			amount: 10000,
			setup: func(e *paymentTestEnv) uuid.UUID {
				buyerID := uuid.New()
				e.userRepo.Users[creatorID] = &entity.User{ID: creatorID}
				e.userRepo.Users[buyerID] = &entity.User{ID: buyerID, DisplayName: "Donor"}
				e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}
				e.walletRepo.Wallets[buyerID] = 100
				return buyerID
			},
		},
		{
			name:   "self-donation blocked",
			amount: 5000,
			setup: func(e *paymentTestEnv) uuid.UUID {
				return creatorID
			},
			wantErr: entity.ErrForbidden,
		},
		{
			name:   "insufficient credits",
			amount: 50000,
			setup: func(e *paymentTestEnv) uuid.UUID {
				buyerID := uuid.New()
				e.walletRepo.Wallets[buyerID] = 10 // only 10 credits, need 50
				return buyerID
			},
			wantErr: entity.ErrInsufficientCredit,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := newPaymentTestEnv()
			buyerID := tt.setup(e)

			resp, err := e.svc.CheckoutDonation(ctx, buyerID, service.CheckoutDonationRequest{
				CreatorID: creatorID, AmountIDR: tt.amount, DonorName: "Test",
			})

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("got err=%v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if resp.Status != "paid" {
				t.Errorf("status = %s, want paid", resp.Status)
			}
			// Verify donation created
			if len(e.donationRepo.Donations) == 0 {
				t.Error("no donation created")
			}
		})
	}
}

// --- Fee Calculation Tests ---

func TestFeePercentByTier(t *testing.T) {
	ctx := context.Background()
	creatorID := uuid.New()
	buyerID := uuid.New()
	price := int64(100000) // 100 credits

	tests := []struct {
		name            string
		customFee       *int
		wantCreatorBal  int64
	}{
		{"default 20% fee", nil, 80},
		{"custom 10% fee (Pro)", intPtr(10), 90},
		{"custom 5% fee (Business)", intPtr(5), 95},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := newPaymentTestEnv()
			postID := uuid.New()
			e.postRepo.Posts[postID] = &entity.Post{
				ID: postID, CreatorID: creatorID, AccessType: entity.PostAccessPaid,
				Price: &price, Status: entity.PostStatusPublished,
			}
			e.userRepo.Users[creatorID] = &entity.User{ID: creatorID}
			e.userRepo.Users[buyerID] = &entity.User{ID: buyerID}
			e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{
				UserID: creatorID, CustomFeePercent: tt.customFee,
			}
			e.walletRepo.Wallets[buyerID] = 1000
			e.walletRepo.Wallets[creatorID] = 0

			_, err := e.svc.CheckoutPost(ctx, buyerID, service.CheckoutPostRequest{PostID: postID})
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			creatorBal, _ := e.walletRepo.GetBalance(ctx, creatorID)
			if creatorBal != tt.wantCreatorBal {
				t.Errorf("creator balance = %d, want %d", creatorBal, tt.wantCreatorBal)
			}
		})
	}
}

// --- Double Spend Prevention ---

func TestDoubleSpendPrevention(t *testing.T) {
	ctx := context.Background()
	creatorID := uuid.New()
	buyerID := uuid.New()
	price := int64(50000) // 50 credits

	e := newPaymentTestEnv()
	postID := uuid.New()
	e.postRepo.Posts[postID] = &entity.Post{
		ID: postID, CreatorID: creatorID, AccessType: entity.PostAccessPaid,
		Price: &price, Status: entity.PostStatusPublished,
	}
	e.userRepo.Users[creatorID] = &entity.User{ID: creatorID}
	e.userRepo.Users[buyerID] = &entity.User{ID: buyerID}
	e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}
	e.walletRepo.Wallets[buyerID] = 100

	// First purchase should succeed
	_, err := e.svc.CheckoutPost(ctx, buyerID, service.CheckoutPostRequest{PostID: postID})
	if err != nil {
		t.Fatalf("first purchase failed: %v", err)
	}

	// Second purchase should fail with ErrAlreadyPurchased
	_, err = e.svc.CheckoutPost(ctx, buyerID, service.CheckoutPostRequest{PostID: postID})
	if !errors.Is(err, entity.ErrAlreadyPurchased) {
		t.Errorf("second purchase: got err=%v, want ErrAlreadyPurchased", err)
	}

	// Balance should only be deducted once
	bal, _ := e.walletRepo.GetBalance(ctx, buyerID)
	if bal != 50 {
		t.Errorf("balance = %d, want 50 (deducted once)", bal)
	}
}

// --- Notification Tests ---

func TestCheckoutCreatesNotification(t *testing.T) {
	ctx := context.Background()
	creatorID := uuid.New()
	buyerID := uuid.New()
	price := int64(5000)

	e := newPaymentTestEnv()
	postID := uuid.New()
	e.postRepo.Posts[postID] = &entity.Post{
		ID: postID, CreatorID: creatorID, AccessType: entity.PostAccessPaid,
		Price: &price, Status: entity.PostStatusPublished,
	}
	e.userRepo.Users[creatorID] = &entity.User{ID: creatorID}
	e.userRepo.Users[buyerID] = &entity.User{ID: buyerID}
	e.userRepo.Profiles[creatorID] = &entity.CreatorProfile{UserID: creatorID}
	e.walletRepo.Wallets[buyerID] = 100

	_, err := e.svc.CheckoutPost(ctx, buyerID, service.CheckoutPostRequest{PostID: postID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(e.followRepo.Notifs) == 0 {
		t.Error("no notification created for creator")
	}
	if e.followRepo.Notifs[0].UserID != creatorID {
		t.Error("notification sent to wrong user")
	}
}

func intPtr(v int) *int { return &v }

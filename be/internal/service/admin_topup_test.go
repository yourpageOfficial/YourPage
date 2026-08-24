package service_test

import (
	"context"
	"sync"
	"testing"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/audit"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

// newAdminSvcForTopup builds an adminService with only the collaborators the
// topup approval path touches; the rest are unused there.
func newAdminSvcForTopup(walletRepo *testutil.MockWalletRepo, userRepo *testutil.MockUserRepo) service.AdminService {
	return service.NewAdminService(
		userRepo, nil, nil, nil, nil,
		nil, walletRepo, nil, testutil.NewMockFollowRepo(), testutil.NewMockPlatformRepo(),
		testutil.MockMailer{}, nil, audit.Nop(),
	)
}

func seedPendingTopup(walletRepo *testutil.MockWalletRepo, userID uuid.UUID, credits int64) uuid.UUID {
	id := uuid.New()
	walletRepo.SeedTopup(&entity.CreditTopupRequest{
		ID:         id,
		UserID:     userID,
		AmountIDR:  credits * 1000,
		Credits:    credits,
		Method:     entity.TopupMethodQRIS,
		Status:     entity.PaymentStatusPending,
		UniqueCode: 123,
	})
	return id
}

// A topup must be credited exactly once even when several approvals race —
// an admin double-clicking "Setujui" is enough to fire two concurrent calls,
// and each one credits real money.
func TestApproveTopup_ConcurrentApprovalsCreditOnce(t *testing.T) {
	const (
		concurrency = 8
		credits     = int64(50)
	)

	walletRepo := testutil.NewMockWalletRepo()
	userRepo := testutil.NewMockUserRepo()
	userID := uuid.New()
	topupID := seedPendingTopup(walletRepo, userID, credits)

	svc := newAdminSvcForTopup(walletRepo, userRepo)

	var (
		wg        sync.WaitGroup
		mu        sync.Mutex
		successes int
	)
	start := make(chan struct{})
	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start // release all goroutines at once to maximise overlap
			if err := svc.ApproveTopup(context.Background(), topupID, service.ApproveTopupRequest{}); err == nil {
				mu.Lock()
				successes++
				mu.Unlock()
			}
		}()
	}
	close(start)
	wg.Wait()

	if successes != 1 {
		t.Errorf("ApproveTopup succeeded %d times, want exactly 1", successes)
	}
	if got := walletRepo.Wallets[userID]; got != credits {
		t.Errorf("wallet balance = %d credits, want %d — topup was credited more than once", got, credits)
	}
}

// Approving an already-approved topup must be rejected, not silently
// credited a second time.
func TestApproveTopup_SecondApprovalRejected(t *testing.T) {
	walletRepo := testutil.NewMockWalletRepo()
	userRepo := testutil.NewMockUserRepo()
	userID := uuid.New()
	topupID := seedPendingTopup(walletRepo, userID, 25)

	svc := newAdminSvcForTopup(walletRepo, userRepo)

	if err := svc.ApproveTopup(context.Background(), topupID, service.ApproveTopupRequest{}); err != nil {
		t.Fatalf("first approval failed: %v", err)
	}
	if err := svc.ApproveTopup(context.Background(), topupID, service.ApproveTopupRequest{}); err != entity.ErrConflict {
		t.Errorf("second approval error = %v, want ErrConflict", err)
	}
	if got := walletRepo.Wallets[userID]; got != 25 {
		t.Errorf("wallet balance = %d credits, want 25", got)
	}
}

// Rejecting a topup that was already approved must not undo or re-run the
// approval, and must never credit the wallet.
func TestRejectTopup_AfterApprovalIsConflict(t *testing.T) {
	walletRepo := testutil.NewMockWalletRepo()
	userRepo := testutil.NewMockUserRepo()
	userID := uuid.New()
	topupID := seedPendingTopup(walletRepo, userID, 30)

	svc := newAdminSvcForTopup(walletRepo, userRepo)

	if err := svc.ApproveTopup(context.Background(), topupID, service.ApproveTopupRequest{}); err != nil {
		t.Fatalf("approval failed: %v", err)
	}
	if err := svc.RejectTopup(context.Background(), topupID, nil); err != entity.ErrConflict {
		t.Errorf("reject after approve error = %v, want ErrConflict", err)
	}
	if got := walletRepo.Wallets[userID]; got != 30 {
		t.Errorf("wallet balance = %d credits, want 30", got)
	}
}

// Approve and reject racing each other: exactly one must win.
func TestApproveAndRejectRace_OnlyOneWins(t *testing.T) {
	walletRepo := testutil.NewMockWalletRepo()
	userRepo := testutil.NewMockUserRepo()
	userID := uuid.New()
	topupID := seedPendingTopup(walletRepo, userID, 40)

	svc := newAdminSvcForTopup(walletRepo, userRepo)

	var (
		wg               sync.WaitGroup
		approveOK, rejOK bool
	)
	start := make(chan struct{})
	wg.Add(2)
	go func() {
		defer wg.Done()
		<-start
		approveOK = svc.ApproveTopup(context.Background(), topupID, service.ApproveTopupRequest{}) == nil
	}()
	go func() {
		defer wg.Done()
		<-start
		rejOK = svc.RejectTopup(context.Background(), topupID, nil) == nil
	}()
	close(start)
	wg.Wait()

	if approveOK == rejOK {
		t.Errorf("approve=%v reject=%v — exactly one must succeed", approveOK, rejOK)
	}
	bal := walletRepo.Wallets[userID]
	if approveOK && bal != 40 {
		t.Errorf("approval won but balance = %d, want 40", bal)
	}
	if rejOK && bal != 0 {
		t.Errorf("rejection won but balance = %d, want 0", bal)
	}
}

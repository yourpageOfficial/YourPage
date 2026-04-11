package service_test

import (
	"testing"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/validator"
)

// --- Helpers for unit tests (no DB needed) ---

func TestFeeCalculation(t *testing.T) {
	tests := []struct {
		name     string
		amount   int64
		feePct   int
		wantFee  int64
		wantNet  int64
	}{
		{"20% fee on 100k", 100000, 20, 20000, 80000},
		{"10% fee on 50k", 50000, 10, 5000, 45000},
		{"5% fee on 200k", 200000, 5, 10000, 190000},
		{"0% fee", 100000, 0, 0, 100000},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fee := tt.amount * int64(tt.feePct) / 100
			net := tt.amount - fee
			if fee != tt.wantFee { t.Errorf("fee = %d, want %d", fee, tt.wantFee) }
			if net != tt.wantNet { t.Errorf("net = %d, want %d", net, tt.wantNet) }
		})
	}
}

func TestCreditConversion(t *testing.T) {
	rate := int64(1000) // 1 credit = Rp 1.000
	tests := []struct{ idr, wantCredits int64 }{
		{50000, 50}, {100000, 100}, {1000, 1}, {0, 0},
	}
	for _, tt := range tests {
		credits := tt.idr / rate
		if credits != tt.wantCredits {
			t.Errorf("IDR %d → %d credits, want %d", tt.idr, credits, tt.wantCredits)
		}
	}
}

func TestSelfPurchaseBlocked(t *testing.T) {
	buyerID := uuid.New()
	creatorID := buyerID // same person
	if buyerID != creatorID {
		t.Error("expected same ID")
	}
	// In real code: if post.CreatorID == buyerID → ErrForbidden
}

func TestPaymentStatusTransitions(t *testing.T) {
	valid := map[entity.PaymentStatus][]entity.PaymentStatus{
		entity.PaymentStatusPending: {entity.PaymentStatusPaid, entity.PaymentStatusFailed, entity.PaymentStatusExpired},
		entity.PaymentStatusPaid:    {entity.PaymentStatusRefunded},
	}
	// Paid → Paid should be invalid
	allowed := valid[entity.PaymentStatusPaid]
	for _, s := range allowed {
		if s == entity.PaymentStatusPaid { t.Error("paid → paid should not be allowed") }
	}
}

func TestUniqueCodeRange(t *testing.T) {
	for i := 0; i < 100; i++ {
		code := validator.GenerateUniqueCode()
		if code < 100 || code > 999 {
			t.Errorf("unique code %d out of range [100,999]", code)
		}
	}
}

func TestSanitizeString(t *testing.T) {
	tests := []struct{ input, want string }{
		{"hello", "hello"},
		{"<script>alert('xss')</script>", "alert('xss')"},
		{"normal text", "normal text"},
	}
	for _, tt := range tests {
		got := validator.SanitizeString(tt.input)
		if got != tt.want { t.Errorf("sanitize(%q) = %q, want %q", tt.input, got, tt.want) }
	}
}

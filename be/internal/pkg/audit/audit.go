// Package audit records an immutable trail of every money/credit movement.
// Writes are best-effort: an audit failure is logged but never blocks the
// payment path itself.
package audit

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"

	"github.com/yourpage/be/internal/entity"
)

type ipCtxKey struct{}
type actorCtxKey struct{}

type actorInfo struct {
	ID   uuid.UUID
	Role string
}

// WithIP stores the client IP in the context (set by auth middleware).
func WithIP(ctx context.Context, ip string) context.Context {
	return context.WithValue(ctx, ipCtxKey{}, ip)
}

func ipFromContext(ctx context.Context) string {
	if ip, ok := ctx.Value(ipCtxKey{}).(string); ok {
		return ip
	}
	return ""
}

// WithActor stores the authenticated actor (set by auth middleware) so
// service-layer audit entries know who performed the action.
func WithActor(ctx context.Context, id uuid.UUID, role string) context.Context {
	return context.WithValue(ctx, actorCtxKey{}, actorInfo{ID: id, Role: role})
}

func actorFromContext(ctx context.Context) (uuid.UUID, string, bool) {
	if a, ok := ctx.Value(actorCtxKey{}).(actorInfo); ok {
		return a.ID, a.Role, true
	}
	return uuid.Nil, "", false
}

// Payment lifecycle events.
const (
	EventTopupCreated      = "topup.created"
	EventTopupPaid         = "topup.paid"     // stripe webhook / reconcile
	EventTopupApproved     = "topup.approved" // admin manual QRIS
	EventTopupRejected     = "topup.rejected"
	EventCheckoutPost      = "checkout.post"
	EventCheckoutProduct   = "checkout.product"
	EventCheckoutDonation  = "checkout.donation"
	EventCheckoutChat      = "checkout.chat"
	EventPaymentRefunded   = "payment.refunded"
	EventWithdrawRequested = "withdrawal.requested"
	EventWithdrawUpdated   = "withdrawal.status_changed"
)

type Entry struct {
	ActorID       *uuid.UUID
	ActorRole     string // user | admin | finance | system
	Event         string
	ReferenceType string // topup | payment | withdrawal
	ReferenceID   *uuid.UUID
	AmountIDR     int64
	Credits       int64
	Method        string
	Detail        entity.JSONMap
}

type Logger interface {
	Log(ctx context.Context, e Entry)
}

type dbLogger struct {
	db *gorm.DB
}

func NewLogger(db *gorm.DB) Logger {
	return &dbLogger{db: db}
}

func (l *dbLogger) Log(ctx context.Context, e Entry) {
	// Fill actor from authenticated request context when the caller didn't set one.
	if e.ActorID == nil {
		if id, role, ok := actorFromContext(ctx); ok {
			e.ActorID = &id
			if e.ActorRole == "" {
				e.ActorRole = role
			}
		}
	}
	if e.ActorRole == "" {
		e.ActorRole = "system"
	}
	row := &entity.PaymentAuditLog{
		ID:            uuid.New(),
		ActorID:       e.ActorID,
		ActorRole:     e.ActorRole,
		Event:         e.Event,
		ReferenceType: e.ReferenceType,
		ReferenceID:   e.ReferenceID,
		AmountIDR:     e.AmountIDR,
		Credits:       e.Credits,
		Method:        e.Method,
		Detail:        e.Detail,
		IPAddress:     ipFromContext(ctx),
		CreatedAt:     time.Now(),
	}
	// Detached context: audit must survive request cancellation post-payment.
	writeCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
	defer cancel()
	if err := l.db.WithContext(writeCtx).Create(row).Error; err != nil {
		log.Error().Err(err).Str("event", e.Event).Msg("audit: failed to write payment audit log")
	}
}

// Nop returns a no-op logger for tests.
func Nop() Logger { return nopLogger{} }

type nopLogger struct{}

func (nopLogger) Log(context.Context, Entry) {}

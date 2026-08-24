// Package realtime delivers overlay alerts to a creator's OBS browser source
// the moment they happen.
//
// Redis pub/sub rather than an in-process channel: alerts must still reach the
// browser when the publishing request and the open SSE connection are served
// by different API replicas.
package realtime

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

type EventType string

const (
	EventDonation            EventType = "donation"
	EventTest                EventType = "test"
	EventMediaShareReceived  EventType = "media_share_received"
	EventMediaSharePlay      EventType = "media_share_play"
)

// Alert is the payload an overlay renders.
type Alert struct {
	Type      EventType `json:"type"`
	ID        string    `json:"id"`
	DonorName string    `json:"donor_name"`
	Credits   int64     `json:"credits"`
	AmountIDR int64     `json:"amount_idr"`
	Message   string    `json:"message,omitempty"`
	MediaURL  string    `json:"media_url,omitempty"`
}

type Broker interface {
	Publish(ctx context.Context, creatorID uuid.UUID, alert Alert) error
	// Subscribe returns a channel of alerts for one creator. The channel is
	// closed when ctx is cancelled.
	Subscribe(ctx context.Context, creatorID uuid.UUID) (<-chan Alert, error)
}

type redisBroker struct {
	rdb *redis.Client
}

func NewBroker(rdb *redis.Client) Broker {
	return &redisBroker{rdb: rdb}
}

func channelFor(creatorID uuid.UUID) string {
	return fmt.Sprintf("overlay:%s", creatorID)
}

func (b *redisBroker) Publish(ctx context.Context, creatorID uuid.UUID, alert Alert) error {
	payload, err := json.Marshal(alert)
	if err != nil {
		return err
	}
	return b.rdb.Publish(ctx, channelFor(creatorID), payload).Err()
}

func (b *redisBroker) Subscribe(ctx context.Context, creatorID uuid.UUID) (<-chan Alert, error) {
	sub := b.rdb.Subscribe(ctx, channelFor(creatorID))
	// Confirm the subscription before returning so a caller that publishes
	// immediately afterwards is not silently missed.
	if _, err := sub.Receive(ctx); err != nil {
		_ = sub.Close()
		return nil, err
	}

	out := make(chan Alert, 16)
	go func() {
		defer close(out)
		defer sub.Close()
		ch := sub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok {
					return
				}
				var alert Alert
				if err := json.Unmarshal([]byte(msg.Payload), &alert); err != nil {
					log.Warn().Err(err).Msg("realtime: bad alert payload")
					continue
				}
				select {
				case out <- alert:
				case <-ctx.Done():
					return
				default:
					// A stalled overlay must not block delivery to others.
					log.Warn().Str("creator_id", creatorID.String()).Msg("realtime: overlay buffer full, dropping alert")
				}
			}
		}
	}()
	return out, nil
}

// Nop returns a broker that discards everything, for tests.
func Nop() Broker { return nopBroker{} }

type nopBroker struct{}

func (nopBroker) Publish(context.Context, uuid.UUID, Alert) error { return nil }
func (nopBroker) Subscribe(ctx context.Context, _ uuid.UUID) (<-chan Alert, error) {
	ch := make(chan Alert)
	go func() { <-ctx.Done(); close(ch) }()
	return ch, nil
}

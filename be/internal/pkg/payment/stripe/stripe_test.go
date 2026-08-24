package stripe

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"testing"
	"time"
)

func sign(payload []byte, secret string, ts int64) string {
	mac := hmac.New(sha256.New, []byte(secret))
	fmt.Fprintf(mac, "%d.", ts)
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

func TestVerifyWebhookSignature(t *testing.T) {
	payload := []byte(`{"id":"evt_1","type":"checkout.session.completed"}`)
	secret := "whsec_test_secret"
	now := time.Now().Unix()

	tests := []struct {
		name    string
		header  string
		secret  string
		wantErr bool
	}{
		{
			name:   "valid signature",
			header: fmt.Sprintf("t=%d,v1=%s", now, sign(payload, secret, now)),
			secret: secret,
		},
		{
			name:   "valid with extra v0 element",
			header: fmt.Sprintf("t=%d,v0=deadbeef,v1=%s", now, sign(payload, secret, now)),
			secret: secret,
		},
		{
			name:    "wrong secret",
			header:  fmt.Sprintf("t=%d,v1=%s", now, sign(payload, "whsec_other", now)),
			secret:  secret,
			wantErr: true,
		},
		{
			name:    "tampered payload signature",
			header:  fmt.Sprintf("t=%d,v1=%s", now, sign([]byte(`{"amount":9999999}`), secret, now)),
			secret:  secret,
			wantErr: true,
		},
		{
			name:    "stale timestamp outside tolerance",
			header:  fmt.Sprintf("t=%d,v1=%s", now-3600, sign(payload, secret, now-3600)),
			secret:  secret,
			wantErr: true,
		},
		{
			name:    "empty header",
			header:  "",
			secret:  secret,
			wantErr: true,
		},
		{
			name:    "malformed header",
			header:  "not-a-signature",
			secret:  secret,
			wantErr: true,
		},
		{
			name:    "empty secret",
			header:  fmt.Sprintf("t=%d,v1=%s", now, sign(payload, secret, now)),
			secret:  "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := VerifyWebhookSignature(payload, tt.header, tt.secret, 5*time.Minute)
			if (err != nil) != tt.wantErr {
				t.Fatalf("VerifyWebhookSignature() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestVerifyWebhookSignatureNoTolerance(t *testing.T) {
	payload := []byte(`{}`)
	secret := "whsec_x"
	old := time.Now().Add(-24 * time.Hour).Unix()
	header := fmt.Sprintf("t=%d,v1=%s", old, sign(payload, secret, old))
	if err := VerifyWebhookSignature(payload, header, secret, 0); err != nil {
		t.Fatalf("tolerance=0 should skip timestamp check, got %v", err)
	}
}

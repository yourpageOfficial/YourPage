package stripe

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const apiBase = "https://api.stripe.com/v1"

// Client is a minimal Stripe REST client. Keys live in platform settings
// (admin-managed), so a Client is constructed per call with the current key.
type Client struct {
	secretKey string
	http      *http.Client
}

func NewClient(secretKey string) *Client {
	return &Client{
		secretKey: secretKey,
		http:      &http.Client{Timeout: 15 * time.Second},
	}
}

type CheckoutSession struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Status    string `json:"status"`         // open | complete | expired
	PayStatus string `json:"payment_status"` // paid | unpaid | no_payment_required
}

type CheckoutParams struct {
	AmountIDR   int64
	ProductName string
	SuccessURL  string
	CancelURL   string
	TopupID     string
	UserEmail   string
}

// CreateCheckoutSession creates a hosted Checkout session in IDR.
// IDR is a two-decimal currency on Stripe, so unit_amount is IDR * 100.
func (c *Client) CreateCheckoutSession(ctx context.Context, p CheckoutParams) (*CheckoutSession, error) {
	form := url.Values{}
	form.Set("mode", "payment")
	form.Set("line_items[0][price_data][currency]", "idr")
	form.Set("line_items[0][price_data][product_data][name]", p.ProductName)
	form.Set("line_items[0][price_data][unit_amount]", strconv.FormatInt(p.AmountIDR*100, 10))
	form.Set("line_items[0][quantity]", "1")
	form.Set("success_url", p.SuccessURL)
	form.Set("cancel_url", p.CancelURL)
	form.Set("metadata[topup_id]", p.TopupID)
	form.Set("payment_intent_data[metadata][topup_id]", p.TopupID)
	if p.UserEmail != "" {
		form.Set("customer_email", p.UserEmail)
	}
	// Expire the session after 1 hour so stale topups don't linger.
	form.Set("expires_at", strconv.FormatInt(time.Now().Add(1*time.Hour).Unix(), 10))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiBase+"/checkout/sessions", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("stripe: request failed: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		var apiErr struct {
			Error struct {
				Message string `json:"message"`
				Type    string `json:"type"`
			} `json:"error"`
		}
		_ = json.Unmarshal(body, &apiErr)
		if apiErr.Error.Message != "" {
			return nil, fmt.Errorf("stripe: %s", apiErr.Error.Message)
		}
		return nil, fmt.Errorf("stripe: http %d", resp.StatusCode)
	}
	var session CheckoutSession
	if err := json.Unmarshal(body, &session); err != nil {
		return nil, fmt.Errorf("stripe: decode response: %w", err)
	}
	return &session, nil
}

// GetCheckoutSession fetches a session (used to reconcile status on return URL).
func (c *Client) GetCheckoutSession(ctx context.Context, id string) (*CheckoutSession, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiBase+"/checkout/sessions/"+url.PathEscape(id), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("stripe: request failed: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("stripe: http %d", resp.StatusCode)
	}
	var session CheckoutSession
	if err := json.Unmarshal(body, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

// WebhookEvent is the subset of a Stripe event we care about.
type WebhookEvent struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Data struct {
		Object json.RawMessage `json:"object"`
	} `json:"data"`
}

// VerifyWebhookSignature validates the Stripe-Signature header
// (scheme: "t=<unix>,v1=<hmac-sha256 of '<t>.<payload>'>").
func VerifyWebhookSignature(payload []byte, sigHeader, secret string, tolerance time.Duration) error {
	if sigHeader == "" || secret == "" {
		return fmt.Errorf("stripe: missing signature or secret")
	}
	var ts string
	var sigs []string
	for _, part := range strings.Split(sigHeader, ",") {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "t":
			ts = kv[1]
		case "v1":
			sigs = append(sigs, kv[1])
		}
	}
	if ts == "" || len(sigs) == 0 {
		return fmt.Errorf("stripe: malformed signature header")
	}
	tsInt, err := strconv.ParseInt(ts, 10, 64)
	if err != nil {
		return fmt.Errorf("stripe: invalid timestamp")
	}
	if tolerance > 0 {
		age := time.Since(time.Unix(tsInt, 0))
		if age > tolerance || age < -tolerance {
			return fmt.Errorf("stripe: signature timestamp outside tolerance")
		}
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(ts))
	mac.Write([]byte("."))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	for _, s := range sigs {
		if hmac.Equal([]byte(expected), []byte(s)) {
			return nil
		}
	}
	return fmt.Errorf("stripe: signature mismatch")
}

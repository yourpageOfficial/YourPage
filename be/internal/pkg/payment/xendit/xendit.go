package xendit

// XenditClient is a placeholder for Xendit QRIS integration.
// Uncomment xendit-go/v6 in go.mod and implement when ready.
type XenditClient struct {
	SecretKey    string
	WebhookToken string
}

func New(secretKey, webhookToken string) *XenditClient {
	return &XenditClient{SecretKey: secretKey, WebhookToken: webhookToken}
}

// VerifyWebhookToken checks the x-callback-token header from Xendit webhooks.
func (c *XenditClient) VerifyWebhookToken(token string) bool {
	return token == c.WebhookToken
}

// TODO: Implement CreateQRIS, etc. when xendit-go/v6 is enabled.

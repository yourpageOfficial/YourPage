package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/yourpage/be/internal/pkg/payment/xendit"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/repository"
)

type WebhookHandler struct {
	paymentRepo repository.PaymentRepository
	xendit      *xendit.XenditClient
}

func NewWebhookHandler(paymentRepo repository.PaymentRepository, xc *xendit.XenditClient) *WebhookHandler {
	return &WebhookHandler{paymentRepo: paymentRepo, xendit: xc}
}

// XenditCallback handles Xendit QRIS webhook notifications.
// TODO: implement full flow when xendit SDK is enabled.
func (h *WebhookHandler) XenditCallback(c *gin.Context) {
	token := c.GetHeader("x-callback-token")
	if !h.xendit.VerifyWebhookToken(token) {
		response.Unauthorized(c)
		return
	}

	// TODO: parse body, find payment by external_id, update status, fulfill purchase
	response.OKMessage(c, "ok")
}

// PayPalWebhook handles PayPal webhook notifications.
// TODO: implement signature verification + fulfillment.
func (h *WebhookHandler) PayPalWebhook(c *gin.Context) {
	// TODO: verify PayPal webhook signature
	// TODO: parse event, find payment, update status, fulfill purchase
	response.OKMessage(c, "ok")
}

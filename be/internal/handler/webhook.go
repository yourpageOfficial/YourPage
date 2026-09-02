package handler

import (
	"encoding/json"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/payment/stripe"
	"github.com/yourpage/be/internal/pkg/payment/xendit"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/repository"
	"github.com/yourpage/be/internal/service"
)

type WebhookHandler struct {
	paymentRepo  repository.PaymentRepository
	platformRepo repository.PlatformRepository
	walletSvc    service.WalletService
	xendit       *xendit.XenditClient
}

func NewWebhookHandler(paymentRepo repository.PaymentRepository, platformRepo repository.PlatformRepository, walletSvc service.WalletService, xc *xendit.XenditClient) *WebhookHandler {
	return &WebhookHandler{paymentRepo: paymentRepo, platformRepo: platformRepo, walletSvc: walletSvc, xendit: xc}
}

// StripeWebhook handles Stripe events (topup fulfillment).
// Signature is verified against the admin-managed webhook secret.
func (h *WebhookHandler) StripeWebhook(c *gin.Context) {
	body, err := io.ReadAll(io.LimitReader(c.Request.Body, 1<<20))
	if err != nil {
		log.Error().Err(err).Msg("webhook/stripe: failed to read body")
		response.BadRequest(c, "invalid body")
		return
	}

	settings, err := h.platformRepo.GetSettings(c.Request.Context())
	if err != nil || settings.StripeWebhookSecret == "" {
		log.Warn().Msg("webhook/stripe: webhook secret not configured")
		response.Unauthorized(c)
		return
	}

	sig := c.GetHeader("Stripe-Signature")
	if err := stripe.VerifyWebhookSignature(body, sig, settings.StripeWebhookSecret, 5*time.Minute); err != nil {
		log.Warn().Err(err).Msg("webhook/stripe: signature verification failed")
		response.Unauthorized(c)
		return
	}

	var event stripe.WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Error().Err(err).Msg("webhook/stripe: failed to parse event")
		response.BadRequest(c, "invalid json")
		return
	}

	log.Info().Str("type", event.Type).Str("event_id", event.ID).Msg("webhook/stripe: received")

	switch event.Type {
	case "checkout.session.completed", "checkout.session.async_payment_succeeded":
		var session struct {
			ID        string `json:"id"`
			PayStatus string `json:"payment_status"`
		}
		if err := json.Unmarshal(event.Data.Object, &session); err != nil || session.ID == "" {
			response.BadRequest(c, "invalid session object")
			return
		}
		if session.PayStatus != "paid" {
			response.OKMessage(c, "ok") // async payment still pending
			return
		}
		if err := h.walletSvc.FulfillStripeTopup(c.Request.Context(), session.ID); err != nil {
			if err == entity.ErrNotFound {
				log.Warn().Str("session_id", session.ID).Msg("webhook/stripe: topup not found")
				response.OKMessage(c, "ok")
				return
			}
			log.Error().Err(err).Str("session_id", session.ID).Msg("webhook/stripe: fulfillment failed")
			c.JSON(500, gin.H{"error": "fulfillment failed"}) // 500 → Stripe retries
			return
		}
	case "checkout.session.expired", "checkout.session.async_payment_failed":
		var session struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(event.Data.Object, &session); err == nil && session.ID != "" {
			if err := h.walletSvc.ExpireStripeTopup(c.Request.Context(), session.ID); err != nil && err != entity.ErrNotFound {
				log.Error().Err(err).Str("session_id", session.ID).Msg("webhook/stripe: expire failed")
			}
		}
	}

	response.OKMessage(c, "ok")
}

// XenditCallback handles Xendit QRIS webhook notifications.
func (h *WebhookHandler) XenditCallback(c *gin.Context) {
	token := c.GetHeader("x-callback-token")
	if !h.xendit.VerifyWebhookToken(token) {
		response.Unauthorized(c)
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Error().Err(err).Msg("webhook/xendit: failed to read body")
		response.BadRequest(c, "invalid body")
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Error().Err(err).Msg("webhook/xendit: failed to parse JSON")
		response.BadRequest(c, "invalid json")
		return
	}

	log.Info().RawJSON("payload", body).Msg("webhook/xendit: received")

	externalID, _ := payload["external_id"].(string)
	status, _ := payload["status"].(string)
	if externalID == "" {
		response.BadRequest(c, "missing external_id")
		return
	}

	payment, err := h.paymentRepo.FindByExternalID(c.Request.Context(), externalID)
	if err != nil {
		log.Warn().Str("external_id", externalID).Msg("webhook/xendit: payment not found")
		response.OKMessage(c, "ok")
		return
	}

	// Store raw webhook payload for audit
	jsonPayload := entity.JSONMap(payload)
	h.paymentRepo.UpdateWebhookPayload(c.Request.Context(), payment.ID, jsonPayload)

	// Idempotency: skip if already in terminal state
	if payment.Status == entity.PaymentStatusPaid || payment.Status == entity.PaymentStatusRefunded {
		response.OKMessage(c, "ok")
		return
	}

	switch status {
	case "COMPLETED", "PAID", "SUCCEEDED":
		now := time.Now()
		h.paymentRepo.UpdateStatus(c.Request.Context(), payment.ID, entity.PaymentStatusPaid, &now)
		log.Info().Str("payment_id", payment.ID.String()).Msg("webhook/xendit: payment fulfilled")
		// TODO: fulfill purchase (add credits/unlock content) when Xendit SDK is enabled
	case "FAILED", "EXPIRED":
		h.paymentRepo.UpdateStatus(c.Request.Context(), payment.ID, entity.PaymentStatusFailed, nil)
		log.Info().Str("payment_id", payment.ID.String()).Str("status", status).Msg("webhook/xendit: payment failed")
	}

	response.OKMessage(c, "ok")
}

// PayPalWebhook handles PayPal webhook notifications.
func (h *WebhookHandler) PayPalWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Error().Err(err).Msg("webhook/paypal: failed to read body")
		response.BadRequest(c, "invalid body")
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Error().Err(err).Msg("webhook/paypal: failed to parse JSON")
		response.BadRequest(c, "invalid json")
		return
	}

	log.Info().RawJSON("payload", body).Msg("webhook/paypal: received")

	// TODO: verify PayPal webhook signature via PayPal API
	// TODO: extract order_id from payload, find payment, update status, fulfill

	response.OKMessage(c, "ok")
}

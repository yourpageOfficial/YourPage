package handler

import (
	"encoding/json"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/yourpage/be/internal/entity"
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

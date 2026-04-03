package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/handler/middleware"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
)

type AuthHandler struct {
	svc      service.AuthService
	validate *validator.Validator
}

func NewAuthHandler(svc service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc, validate: validator.New()}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}

	resp, err := h.svc.Register(c.Request.Context(), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, resp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, resp)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID := getUserID(c)
	var body struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "refresh_token is required")
		return
	}
	// Get access token to blacklist it
	accessToken := c.GetHeader("Authorization")
	if len(accessToken) > 7 {
		accessToken = accessToken[7:] // strip "Bearer "
	}
	if err := h.svc.Logout(c.Request.Context(), userID, body.RefreshToken, accessToken); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "logged out")
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "refresh_token is required")
		return
	}
	resp, err := h.svc.RefreshToken(c.Request.Context(), body.RefreshToken)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, resp)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userID := getUserID(c)
	resp, err := h.svc.GetMe(c.Request.Context(), userID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, resp)
}

func (h *AuthHandler) UpdateMe(c *gin.Context) {
	userID := getUserID(c)
	var body struct {
		DisplayName *string `json:"display_name"`
		Bio         *string `json:"bio"`
		AvatarURL   *string `json:"avatar_url"`
		PageColor   *string `json:"page_color"`
		HeaderImage *string `json:"header_image"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	err := h.svc.UpdateProfile(c.Request.Context(), userID, body.DisplayName, body.Bio, body.AvatarURL, body.PageColor, body.HeaderImage)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "profile updated")
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var body struct {
		Email string `json:"email" validate:"required,email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "email is required")
		return
	}
	_ = h.svc.ForgotPassword(c.Request.Context(), body.Email)
	response.OKMessage(c, "if the email is registered, a reset link has been sent")
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var body struct {
		Token       string `json:"token"        validate:"required"`
		NewPassword string `json:"new_password" validate:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := h.svc.ResetPassword(c.Request.Context(), body.Token, body.NewPassword); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "password has been reset")
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var body struct {
		OldPassword string `json:"old_password" validate:"required"`
		NewPassword string `json:"new_password" validate:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "old_password and new_password required")
		return
	}
	if err := h.svc.ChangePassword(c.Request.Context(), getUserID(c), body.OldPassword, body.NewPassword); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "password changed")
}

func (h *AuthHandler) SubscribeTier(c *gin.Context) {
	var body struct {
		TierID string `json:"tier_id" validate:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "tier_id required"); return
	}
	tierID, err := uuid.Parse(body.TierID)
	if err != nil { response.BadRequest(c, "invalid tier_id"); return }
	if err := h.svc.SubscribeTier(c.Request.Context(), getUserID(c), tierID); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "tier updated")
}

func (h *AuthHandler) UpgradeToCreator(c *gin.Context) {
	userID := getUserID(c)
	var req service.UpgradeCreatorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	if err := h.svc.UpgradeToCreator(c.Request.Context(), userID, req); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "upgraded to creator")
}

// ------------------------------------------------------------------ helpers

func getUserID(c *gin.Context) uuid.UUID {
	val, _ := c.Get(middleware.ContextKeyUserID)
	return val.(uuid.UUID)
}

func getUserRole(c *gin.Context) entity.UserRole {
	val, _ := c.Get(middleware.ContextKeyRole)
	return val.(entity.UserRole)
}

func handleServiceError(c *gin.Context, err error) {
	// Log all errors server-side for debugging
	log.Error().Err(err).Str("path", c.FullPath()).Str("method", c.Request.Method).Msg("service error")

	// Return user-friendly messages — never expose internal details
	switch {
	case errors.Is(err, entity.ErrNotFound):
		response.NotFound(c, "Data tidak ditemukan")
	case errors.Is(err, entity.ErrUnauthorized):
		response.Unauthorized(c)
	case errors.Is(err, entity.ErrForbidden):
		response.Forbidden(c)
	case errors.Is(err, entity.ErrConflict):
		response.Conflict(c, "Data sudah ada")
	case errors.Is(err, entity.ErrAlreadyPurchased):
		response.Conflict(c, "Kamu sudah membeli ini sebelumnya")
	case errors.Is(err, entity.ErrInsufficientCredit):
		response.UnprocessableEntity(c, "Credit tidak cukup. Silakan top-up terlebih dahulu.")
	case errors.Is(err, entity.ErrBanned):
		response.Forbidden(c)
	case errors.Is(err, entity.ErrInvalidToken):
		response.Unauthorized(c)
	case errors.Is(err, entity.ErrMinWithdrawal):
		response.UnprocessableEntity(c, "Nominal di bawah minimum penarikan (Rp 100.000)")
	case errors.Is(err, entity.ErrFileTooLarge):
		response.UnprocessableEntity(c, "File terlalu besar atau kuota penyimpanan habis")
	case errors.Is(err, entity.ErrKYCRequired):
		response.UnprocessableEntity(c, "Verifikasi KYC diperlukan untuk penarikan pertama. Silakan upload KTP di menu KYC.")
	case errors.Is(err, entity.ErrPaymentFailed):
		response.UnprocessableEntity(c, "Pembayaran gagal. Silakan coba lagi.")
	default:
		// Check if error message is user-friendly (Indonesian)
		msg := err.Error()
		if len(msg) > 0 && (msg[0] >= 'A' && msg[0] <= 'Z' || msg[0] >= 'a' && msg[0] <= 'z') {
			// Likely a custom message from service — return as 422
			response.UnprocessableEntity(c, msg)
			return
		}
		response.InternalError(c)
	}
}

func formatValidationErrors(errs map[string]string) string {
	for _, v := range errs {
		return v // return first error
	}
	return "validation failed"
}

package handler

import (
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/realtime"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type MediaShareHandler struct {
	db          *gorm.DB
	userRepo    repository.UserRepository
	walletRepo  repository.WalletRepository
	paymentRepo repository.PaymentRepository
	storage     storage.StorageService
	broker      realtime.Broker
	validate    *validator.Validator
}

func NewMediaShareHandler(
	db *gorm.DB,
	userRepo repository.UserRepository,
	walletRepo repository.WalletRepository,
	paymentRepo repository.PaymentRepository,
	storageSvc storage.StorageService,
	broker realtime.Broker,
) *MediaShareHandler {
	return &MediaShareHandler{
		db: db, userRepo: userRepo, walletRepo: walletRepo,
		paymentRepo: paymentRepo, storage: storageSvc, broker: broker,
		validate: validator.New(),
	}
}

// GetSettings returns media share settings for a creator.
// GET /media-share/settings/:creatorId
func (h *MediaShareHandler) GetSettings(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}
	var settings entity.MediaShareSettings
	if err := h.db.WithContext(c.Request.Context()).Where("creator_id = ?", creatorID).First(&settings).Error; err != nil {
		// Return defaults if not configured
		response.OK(c, entity.MediaShareSettings{
			CreatorID:    creatorID,
			IsEnabled:    false,
			PriceCredits: 5,
			AllowedTypes: "image,gif",
		})
		return
	}
	response.OK(c, settings)
}

type upsertMediaShareSettingsReq struct {
	IsEnabled    *bool   `json:"is_enabled"`
	PriceCredits *int    `json:"price_credits" validate:"omitempty,min=0,max=10000"`
	AllowedTypes *string `json:"allowed_types" validate:"omitempty,max=50"`
}

// UpsertSettings creates or updates media share settings.
// PUT /media-share/settings
func (h *MediaShareHandler) UpsertSettings(c *gin.Context) {
	var req upsertMediaShareSettingsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}

	userID := getUserID(c)
	cp, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), userID)
	if err != nil {
		// Only a genuine absence is a 404. Reporting a database or scan
		// failure as "not found" is how a real defect once looked like a
		// deleted profile instead of an error.
		if err == entity.ErrNotFound {
			response.NotFound(c, "creator not found")
			return
		}
		log.Error().Err(err).Msg("failed to load creator profile")
		response.InternalError(c)
		return
	}

	var settings entity.MediaShareSettings
	h.db.WithContext(c.Request.Context()).Where("creator_id = ?", cp.UserID).First(&settings)
	settings.CreatorID = cp.UserID
	settings.UpdatedAt = time.Now()

	if req.IsEnabled != nil {
		settings.IsEnabled = *req.IsEnabled
	}
	if req.PriceCredits != nil {
		settings.PriceCredits = *req.PriceCredits
	}
	if req.AllowedTypes != nil {
		settings.AllowedTypes = *req.AllowedTypes
	}

	if settings.ID == uuid.Nil {
		settings.ID = uuid.New()
		if err := h.db.WithContext(c.Request.Context()).Create(&settings).Error; err != nil {
			response.InternalError(c)
			return
		}
	} else {
		if err := h.db.WithContext(c.Request.Context()).Save(&settings).Error; err != nil {
			response.InternalError(c)
			return
		}
	}
	response.OK(c, settings)
}

var allowedMediaShareMIMEs = map[string]string{
	"\xff\xd8\xff": "jpg",
	"\x89PNG":      "png",
	"GIF8":         "gif",
	"RIFF":         "webp",
}

// Submit allows a supporter to submit a media share to the creator's queue.
// POST /media-share/submit/:creatorId
func (h *MediaShareHandler) Submit(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}

	// Load settings
	var settings entity.MediaShareSettings
	if err := h.db.WithContext(c.Request.Context()).Where("creator_id = ? AND is_enabled = true", creatorID).First(&settings).Error; err != nil {
		response.BadRequest(c, "⚠ Fitur media share tidak aktif untuk creator ini")
		return
	}

	senderID := getUserID(c)
	if senderID == creatorID {
		response.BadRequest(c, "⚠ Tidak bisa kirim media share ke diri sendiri")
		return
	}

	// Parse multipart file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "⚠ File wajib di-upload")
		return
	}
	defer file.Close()

	if header.Size > 10<<20 {
		response.BadRequest(c, "⚠ Ukuran file maksimal 10MB")
		return
	}

	// Magic byte validation
	magic := make([]byte, 4)
	if _, err := file.Read(magic); err != nil {
		response.BadRequest(c, "⚠ File tidak valid")
		return
	}
	if _, err := file.Seek(0, 0); err != nil {
		response.InternalError(c)
		return
	}

	mediaType := ""
	ext := ""
	for prefix, fileExt := range allowedMediaShareMIMEs {
		if strings.HasPrefix(string(magic), prefix) {
			mediaType = "image"
			ext = fileExt
			if fileExt == "gif" {
				mediaType = "gif"
			}
			break
		}
	}
	if ext == "" {
		response.BadRequest(c, "⚠ Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP")
		return
	}

	// Check allowed types
	allowed := strings.Split(settings.AllowedTypes, ",")
	typeOK := false
	for _, t := range allowed {
		if strings.TrimSpace(t) == mediaType || strings.TrimSpace(t) == ext {
			typeOK = true
			break
		}
	}
	if !typeOK {
		response.BadRequest(c, fmt.Sprintf("⚠ Tipe file tidak diizinkan. Tipe yang diizinkan: %s", settings.AllowedTypes))
		return
	}

	message := c.PostForm("message")
	senderName := c.PostForm("sender_name")
	if senderName == "" {
		if sender, err := h.userRepo.FindByID(c.Request.Context(), senderID); err == nil {
			senderName = sender.DisplayName
		} else {
			senderName = "Anonim"
		}
	}

	// Charge credits if price > 0
	var paymentID *uuid.UUID
	if settings.PriceCredits > 0 {
		wallet, err := h.walletRepo.FindOrCreateWallet(c.Request.Context(), senderID)
		if err != nil {
			response.InternalError(c)
			return
		}
		if wallet.BalanceCredits < int64(settings.PriceCredits) {
			response.BadRequest(c, entity.ErrInsufficientCredit.Error())
			return
		}
		if err := h.walletRepo.DeductCredits(c.Request.Context(), senderID, int64(settings.PriceCredits)); err != nil {
			response.InternalError(c)
			return
		}
		pID := uuid.New()
		now := time.Now()
		amountIDR := int64(settings.PriceCredits) * 1000
		payment := &entity.Payment{
			ID:           pID,
			ExternalID:   fmt.Sprintf("MSHARE-%s", pID),
			Provider:     entity.PaymentProviderCredits,
			Usecase:      entity.PaymentUsecaseChat, // reuse as closest type
			ReferenceID:  creatorID,
			PayerID:      &senderID,
			AmountIDR:    amountIDR,
			NetAmountIDR: amountIDR,
			Status:       entity.PaymentStatusPaid,
			PaidAt:       &now,
		}
		if err := h.paymentRepo.Create(c.Request.Context(), payment); err != nil {
			// Refund credits on payment record failure
			_ = h.walletRepo.AddCredits(c.Request.Context(), senderID, int64(settings.PriceCredits))
			response.InternalError(c)
			return
		}
		paymentID = &pID
	}

	// Upload to MinIO
	path := fmt.Sprintf("media-shares/%s/%s.%s", creatorID, uuid.New(), ext)
	mediaURL, err := h.storage.UploadFile(c.Request.Context(), "yourpage", path, file, header.Size, header.Header.Get("Content-Type"))
	if err != nil {
		// Refund if uploaded failed after charge
		if settings.PriceCredits > 0 {
			_ = h.walletRepo.AddCredits(c.Request.Context(), senderID, int64(settings.PriceCredits))
		}
		response.InternalError(c)
		return
	}

	var msgPtr *string
	if message != "" {
		msgPtr = &message
	}

	share := entity.MediaShare{
		ID:         uuid.New(),
		CreatorID:  creatorID,
		SenderID:   &senderID,
		SenderName: senderName,
		MediaURL:   mediaURL,
		MediaType:  mediaType,
		Message:    msgPtr,
		Status:     "pending",
		PaymentID:  paymentID,
	}
	if err := h.db.WithContext(c.Request.Context()).Create(&share).Error; err != nil {
		response.InternalError(c)
		return
	}

	// Notify creator via SSE
	go h.broker.Publish(c.Request.Context(), creatorID, realtime.Alert{
		Type:     "media_share_received",
		ID:       share.ID.String(),
		DonorName: senderName,
		Message:  message,
		MediaURL: mediaURL,
	})

	response.Created(c, share)
}

// ListQueue returns the pending media share queue for the creator.
// GET /media-share/queue
func (h *MediaShareHandler) ListQueue(c *gin.Context) {
	userID := getUserID(c)
	var shares []entity.MediaShare
	err := h.db.WithContext(c.Request.Context()).
		Where("creator_id = ? AND status = 'pending'", userID).
		Order("created_at ASC").
		Limit(50).
		Find(&shares).Error
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, shares)
}

// PlayNext marks the first pending item as playing and broadcasts to OBS overlay.
// POST /media-share/play-next
func (h *MediaShareHandler) PlayNext(c *gin.Context) {
	userID := getUserID(c)
	var share entity.MediaShare
	err := h.db.WithContext(c.Request.Context()).
		Where("creator_id = ? AND status = 'pending'", userID).
		Order("created_at ASC").
		First(&share).Error
	if err != nil {
		response.NotFound(c, "queue kosong")
		return
	}

	now := time.Now()
	if err := h.db.WithContext(c.Request.Context()).Model(&share).
		Updates(map[string]interface{}{"status": "playing", "played_at": now}).Error; err != nil {
		response.InternalError(c)
		return
	}

	// Broadcast to OBS overlay
	h.broker.Publish(c.Request.Context(), userID, realtime.Alert{
		Type:     "media_share_play",
		ID:       share.ID.String(),
		DonorName: share.SenderName,
		MediaURL: share.MediaURL,
		Message:  func() string { if share.Message != nil { return *share.Message }; return "" }(),
	})

	// Mark as played after a short delay (async)
	shareID := share.ID
	go func() {
		time.Sleep(100 * time.Millisecond)
		h.db.Model(&entity.MediaShare{}).Where("id = ?", shareID).Update("status", "played")
	}()

	response.OK(c, share)
}

// Skip removes a media share from the queue without playing it.
// DELETE /media-share/:id
func (h *MediaShareHandler) Skip(c *gin.Context) {
	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid share id")
		return
	}
	userID := getUserID(c)
	result := h.db.WithContext(c.Request.Context()).
		Model(&entity.MediaShare{}).
		Where("id = ? AND creator_id = ? AND status = 'pending'", shareID, userID).
		Update("status", "skipped")
	if result.RowsAffected == 0 {
		response.NotFound(c, "item tidak ditemukan atau sudah diproses")
		return
	}
	if result.Error != nil {
		response.InternalError(c)
		return
	}
	response.OKMessage(c, "skipped")
}

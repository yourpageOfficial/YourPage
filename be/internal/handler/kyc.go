package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
)

type KYCHandler struct {
	svc      service.KYCService
	validate *validator.Validator
	storage  storage.StorageService
	cfg      *config.Config
}

func NewKYCHandler(svc service.KYCService, storageSvc storage.StorageService, cfg *config.Config) *KYCHandler {
	return &KYCHandler{svc: svc, validate: validator.New(), storage: storageSvc, cfg: cfg}
}

func (h *KYCHandler) SubmitKYC(c *gin.Context) {
	var req service.SubmitKYCRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	kyc, err := h.svc.SubmitKYC(c.Request.Context(), getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, kyc)
}

func (h *KYCHandler) GetMyKYC(c *gin.Context) {
	kyc, err := h.svc.GetMyKYC(c.Request.Context(), getUserID(c))
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, kyc)
}

func (h *KYCHandler) UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "file is required")
		return
	}
	defer file.Close()

	// Validate file type
	ct := header.Header.Get("Content-Type")
	allowed := map[string]bool{
		"image/jpeg": true, "image/png": true, "image/gif": true, "image/webp": true,
		"video/mp4": true, "video/webm": true,
		"audio/mpeg": true, "audio/wav": true,
		"application/pdf": true, "application/zip": true,
	}
	if !allowed[ct] {
		response.BadRequest(c, "file type not allowed")
		return
	}

	// Max 50MB for generic uploads
	if header.Size > 50*1024*1024 {
		response.UnprocessableEntity(c, "file too large (max 50MB)")
		return
	}

	objectName := fmt.Sprintf("uploads/%s/%s-%s", getUserID(c), uuid.NewString(), header.Filename)
	url, err := h.storage.UploadFile(c.Request.Context(), h.cfg.MinIO.PublicBucket, objectName, file, header.Size, ct)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"url": url})
}

func (h *KYCHandler) CreateReport(c *gin.Context) {
	var req service.CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	reporterID := optionalUserID(c)
	report, err := h.svc.CreateReport(c.Request.Context(), reporterID, req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, report)
}

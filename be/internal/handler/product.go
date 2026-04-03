package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
)

type ProductHandler struct {
	svc      service.ProductService
	validate *validator.Validator
}

func NewProductHandler(svc service.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc, validate: validator.New()}
}

func (h *ProductHandler) Create(c *gin.Context) {
	var req service.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	product, err := h.svc.Create(c.Request.Context(), getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, product)
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}
	viewerID := optionalUserID(c)
	product, err := h.svc.GetByID(c.Request.Context(), productID, viewerID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}
	var req service.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	product, err := h.svc.Update(c.Request.Context(), productID, getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), productID, getUserID(c)); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "product deleted")
}

func (h *ProductHandler) ListByCreator(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}
	cursor, limit := parsePagination(c)
	products, nextCursor, err := h.svc.List(c.Request.Context(), creatorID, cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, products, uuidToString(nextCursor))
}

func (h *ProductHandler) AddAsset(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "file is required")
		return
	}
	defer file.Close()

	req := service.AddAssetRequest{
		File:        file,
		FileName:    header.Filename,
		FileSize:    header.Size,
		ContentType: header.Header.Get("Content-Type"),
	}

	asset, err := h.svc.AddAsset(c.Request.Context(), productID, getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, asset)
}

func (h *ProductHandler) DeleteAsset(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}
	assetID, err := uuid.Parse(c.Param("assetId"))
	if err != nil {
		response.BadRequest(c, "invalid asset id")
		return
	}
	if err := h.svc.DeleteAsset(c.Request.Context(), assetID, productID, getUserID(c)); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "asset deleted")
}

func (h *ProductHandler) GetDownloadURL(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}
	urls, err := h.svc.GetDownloadURL(c.Request.Context(), productID, getUserID(c))
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, urls)
}

// ListPurchased returns products the current user has purchased.
func (h *ProductHandler) ListPurchased(c *gin.Context) {
	cursor, limit := parsePagination(c)
	products, next, err := h.svc.ListPurchased(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, products, uuidToString(next))
}

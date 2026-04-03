package service

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/config"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/storage"
	"github.com/yourpage/be/internal/repository"
)

// ---------------------------------------------------------------------------
// Request / response DTOs
// ---------------------------------------------------------------------------

type CreateProductRequest struct {
	Name         string              `json:"name"         validate:"required,max=255"`
	Slug         string              `json:"slug"         validate:"required,max=100"`
	Description  *string             `json:"description"`
	Type         entity.ProductType  `json:"type"         validate:"required,oneof=ebook preset template other"`
	PriceIDR     int64               `json:"price_idr"    validate:"min=0"`
	IsActive     bool                `json:"is_active"`
	ThumbnailURL *string             `json:"thumbnail_url"`
	DeliveryType string              `json:"delivery_type"` // file, link
	DeliveryURL  *string             `json:"delivery_url"`
}

type UpdateProductRequest struct {
	Name         *string              `json:"name"          validate:"omitempty,max=255"`
	Description  *string              `json:"description"`
	Type         *entity.ProductType  `json:"type"          validate:"omitempty,oneof=ebook preset template other"`
	PriceIDR     *int64               `json:"price_idr"     validate:"omitempty,min=0"`
	IsActive     *bool                `json:"is_active"`
	ThumbnailURL *string              `json:"thumbnail_url"`
	DeliveryType *string              `json:"delivery_type"`
	DeliveryURL  *string              `json:"delivery_url"`
}

type AddAssetRequest struct {
	File        io.Reader
	FileName    string
	FileSize    int64 // bytes
	ContentType string
}

// DownloadURLResponse wraps per-asset signed URLs returned to the supporter.
type DownloadURLResponse struct {
	AssetID    uuid.UUID `json:"asset_id"`
	FileName   string    `json:"file_name"`
	SignedURL  string    `json:"signed_url"`
	ExpiresIn  int       `json:"expires_in_seconds"`
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

// ProductService defines all business operations for digital products.
type ProductService interface {
	Create(ctx context.Context, creatorID uuid.UUID, req CreateProductRequest) (*entity.Product, error)
	GetByID(ctx context.Context, productID uuid.UUID, viewerID *uuid.UUID) (*entity.Product, error)
	Update(ctx context.Context, productID, creatorID uuid.UUID, req UpdateProductRequest) (*entity.Product, error)
	Delete(ctx context.Context, productID, creatorID uuid.UUID) error
	List(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, *uuid.UUID, error)
	AddAsset(ctx context.Context, productID, creatorID uuid.UUID, req AddAssetRequest) (*entity.ProductAsset, error)
	DeleteAsset(ctx context.Context, assetID, productID, creatorID uuid.UUID) error
	GetDownloadURL(ctx context.Context, productID, supporterID uuid.UUID) ([]DownloadURLResponse, error)
	ListPurchased(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, *uuid.UUID, error)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

type productService struct {
	productRepo repository.ProductRepository
	userRepo    repository.UserRepository
	storage     storage.StorageService
	cfg         *config.Config
}

// NewProductService constructs a ProductService.
func NewProductService(
	productRepo repository.ProductRepository,
	userRepo repository.UserRepository,
	storageSvc storage.StorageService,
	cfg *config.Config,
) ProductService {
	return &productService{
		productRepo: productRepo,
		userRepo:    userRepo,
		storage:     storageSvc,
		cfg:         cfg,
	}
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

func (s *productService) Create(ctx context.Context, creatorID uuid.UUID, req CreateProductRequest) (*entity.Product, error) {
	user, err := s.userRepo.FindByID(ctx, creatorID)
	if err != nil {
		return nil, err
	}
	if user.Role != entity.RoleCreator {
		return nil, entity.ErrForbidden
	}

	// Check product limit based on tier
	profile, _ := s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if profile != nil && profile.Tier != nil && profile.Tier.MaxProducts > 0 {
		count, _ := s.productRepo.CountByCreator(ctx, creatorID)
		if count >= int64(profile.Tier.MaxProducts) {
			return nil, fmt.Errorf("batas produk untuk tier %s adalah %d. Upgrade tier untuk menambah produk", profile.Tier.Name, profile.Tier.MaxProducts)
		}
	} else if profile != nil && profile.TierID == nil {
		count, _ := s.productRepo.CountByCreator(ctx, creatorID)
		if count >= 3 { return nil, fmt.Errorf("batas produk untuk tier Free adalah 3. Upgrade tier untuk menambah produk") }
	}

	product := &entity.Product{
		ID:           uuid.New(),
		CreatorID:    creatorID,
		Name:         req.Name,
		Slug:         req.Slug,
		Description:  req.Description,
		Type:         req.Type,
		PriceIDR:     req.PriceIDR,
		IsActive:     req.IsActive,
		ThumbnailURL: req.ThumbnailURL,
	}

	if err := s.productRepo.Create(ctx, product); err != nil {
		return nil, err
	}
	return product, nil
}

// ---------------------------------------------------------------------------
// GetByID
// ---------------------------------------------------------------------------

// GetByID returns the product with its assets. Raw FileURLs are never exposed;
// the caller must use GetDownloadURL after purchase to obtain signed URLs.
func (s *productService) GetByID(ctx context.Context, productID uuid.UUID, viewerID *uuid.UUID) (*entity.Product, error) {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}

	assets, err := s.productRepo.ListAssets(ctx, productID)
	if err != nil {
		return nil, err
	}
	// Strip raw FileURL before attaching assets to the response.
	for i := range assets {
		assets[i].FileURL = ""
	}
	product.Assets = assets

	return product, nil
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

func (s *productService) Update(ctx context.Context, productID, creatorID uuid.UUID, req UpdateProductRequest) (*entity.Product, error) {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if product.CreatorID != creatorID {
		return nil, entity.ErrForbidden
	}

	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = req.Description
	}
	if req.Type != nil {
		product.Type = *req.Type
	}
	if req.PriceIDR != nil {
		product.PriceIDR = *req.PriceIDR
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}
	if req.ThumbnailURL != nil {
		product.ThumbnailURL = req.ThumbnailURL
	}

	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, err
	}
	return product, nil
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

func (s *productService) Delete(ctx context.Context, productID, creatorID uuid.UUID) error {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product.CreatorID != creatorID {
		return entity.ErrForbidden
	}
	return s.productRepo.SoftDelete(ctx, productID)
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

func (s *productService) List(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, *uuid.UUID, error) {
	products, err := s.productRepo.ListByCreator(ctx, creatorID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}

	var nextCursor *uuid.UUID
	if len(products) > limit {
		nextCursor = &products[limit].ID
		products = products[:limit]
	}

	// Strip raw FileURL from each asset.
	for i := range products {
		for j := range products[i].Assets {
			products[i].Assets[j].FileURL = ""
		}
	}

	return products, nextCursor, nil
}

// ---------------------------------------------------------------------------
// AddAsset
// ---------------------------------------------------------------------------

func (s *productService) AddAsset(ctx context.Context, productID, creatorID uuid.UUID, req AddAssetRequest) (*entity.ProductAsset, error) {
	// Verify product belongs to creator.
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if product.CreatorID != creatorID {
		return nil, entity.ErrForbidden
	}

	// Check storage quota.
	profile, err := s.userRepo.FindCreatorByUserID(ctx, creatorID)
	if err != nil {
		return nil, err
	}
	if profile.StorageUsedBytes+req.FileSize > profile.StorageQuotaBytes {
		return nil, entity.ErrFileTooLarge
	}

	// Upload to private MinIO bucket.
	objectName := fmt.Sprintf("products/%s/assets/%s-%s", productID, uuid.NewString(), req.FileName)
	fileURL, err := s.storage.UploadFile(ctx, s.cfg.MinIO.PrivateBucket, objectName, req.File, req.FileSize, req.ContentType)
	if err != nil {
		return nil, err
	}

	fileSizeKB := req.FileSize / 1024
	if req.FileSize%1024 != 0 {
		fileSizeKB++
	}

	asset := &entity.ProductAsset{
		ID:         uuid.New(),
		ProductID:  productID,
		FileName:   req.FileName,
		FileURL:    fileURL,
		FileSizeKB: fileSizeKB,
		MimeType:   req.ContentType,
	}

	if err := s.productRepo.AddAsset(ctx, asset); err != nil {
		_ = s.storage.DeleteFile(ctx, s.cfg.MinIO.PrivateBucket, objectName)
		return nil, err
	}

	// Update creator storage usage.
	if err := s.userRepo.IncrementCreatorStorage(ctx, profile.ID, req.FileSize); err != nil {
		return nil, err
	}

	// Return asset with empty FileURL so the caller never sees the raw path.
	safeAsset := *asset
	safeAsset.FileURL = ""
	return &safeAsset, nil
}

// ---------------------------------------------------------------------------
// DeleteAsset
// ---------------------------------------------------------------------------

func (s *productService) DeleteAsset(ctx context.Context, assetID, productID, creatorID uuid.UUID) error {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product.CreatorID != creatorID {
		return entity.ErrForbidden
	}

	_, err = s.productRepo.DeleteAsset(ctx, assetID)
	return err
}

// ---------------------------------------------------------------------------
// GetDownloadURL
// ---------------------------------------------------------------------------

const downloadURLExpiry = 15 * time.Minute

func (s *productService) GetDownloadURL(ctx context.Context, productID, supporterID uuid.UUID) ([]DownloadURLResponse, error) {
	_, err := s.productRepo.FindPurchase(ctx, productID, supporterID)
	if err != nil {
		return nil, entity.ErrForbidden
	}

	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}

	// Link-type product — return the link directly
	if product.DeliveryType == "link" && product.DeliveryURL != nil {
		return []DownloadURLResponse{{
			FileName:  "Link",
			SignedURL: *product.DeliveryURL,
			ExpiresIn: 0,
		}}, nil
	}

	// File-type product — return pre-signed URLs
	assets, err := s.productRepo.ListAssets(ctx, productID)
	if err != nil {
		return nil, err
	}

	var result []DownloadURLResponse
	for _, asset := range assets {
		signedURL, err := s.storage.GetPresignedURL(ctx, s.cfg.MinIO.PrivateBucket, asset.FileURL, downloadURLExpiry)
		if err != nil {
			return nil, err
		}
		result = append(result, DownloadURLResponse{
			AssetID:   asset.ID,
			FileName:  asset.FileName,
			SignedURL: signedURL,
			ExpiresIn: int(downloadURLExpiry.Seconds()),
		})
	}
	return result, nil
}

// ---------------------------------------------------------------------------
// ListPurchased
// ---------------------------------------------------------------------------

func (s *productService) ListPurchased(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, *uuid.UUID, error) {
	products, err := s.productRepo.ListPurchasedProducts(ctx, supporterID, cursor, limit+1)
	if err != nil {
		return nil, nil, err
	}
	var next *uuid.UUID
	if len(products) > limit {
		next = &products[limit].ID
		products = products[:limit]
	}
	return products, next, nil
}

package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/repository"
	"gorm.io/gorm"
)

type productRepo struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) repository.ProductRepository {
	return &productRepo{db: db}
}

func (r *productRepo) Create(ctx context.Context, p *entity.Product) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *productRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Product, error) {
	var product entity.Product
	err := r.db.WithContext(ctx).Preload("Creator").Preload("Assets").Where("id = ? AND deleted_at IS NULL", id).First(&product).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &product, err
}

func (r *productRepo) FindBySlug(ctx context.Context, slug string) (*entity.Product, error) {
	var product entity.Product
	err := r.db.WithContext(ctx).Where("slug = ? AND deleted_at IS NULL", slug).First(&product).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &product, err
}

func (r *productRepo) Update(ctx context.Context, p *entity.Product) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *productRepo) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Product{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (r *productRepo) DeactivateExcess(ctx context.Context, creatorID uuid.UUID, maxActive int) error {
	// Get IDs of products to keep (oldest first, up to maxActive)
	var keepIDs []uuid.UUID
	r.db.WithContext(ctx).Model(&entity.Product{}).
		Where("creator_id = ? AND deleted_at IS NULL AND is_active = true", creatorID).
		Order("created_at ASC").Limit(maxActive).Pluck("id", &keepIDs)

	if len(keepIDs) == 0 { return nil }

	// Deactivate the rest
	return r.db.WithContext(ctx).Model(&entity.Product{}).
		Where("creator_id = ? AND deleted_at IS NULL AND is_active = true AND id NOT IN ?", creatorID, keepIDs).
		Update("is_active", false).Error
}

func (r *productRepo) CountByCreator(ctx context.Context, creatorID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.Product{}).Where("creator_id = ? AND deleted_at IS NULL", creatorID).Count(&count).Error
	return count, err
}

func (r *productRepo) ListByCreator(ctx context.Context, creatorID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, error) {
	var products []entity.Product
	q := r.db.WithContext(ctx).Preload("Assets").Where("creator_id = ? AND deleted_at IS NULL", creatorID)
	if cursor != nil {
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&products).Error
	return products, err
}

func (r *productRepo) ListAll(ctx context.Context, cursor *uuid.UUID, limit int) ([]entity.Product, error) {
	var products []entity.Product
	q := r.db.WithContext(ctx).Preload("Creator").Where("deleted_at IS NULL")
	if cursor != nil {
		q = q.Where("id < ?", *cursor)
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&products).Error
	return products, err
}

func (r *productRepo) IncrementSalesCount(ctx context.Context, productID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Product{}).
		Where("id = ?", productID).
		Update("sales_count", gorm.Expr("sales_count + 1")).Error
}

func (r *productRepo) AddAsset(ctx context.Context, asset *entity.ProductAsset) error {
	return r.db.WithContext(ctx).Create(asset).Error
}

func (r *productRepo) DeleteAsset(ctx context.Context, assetID uuid.UUID) (*entity.ProductAsset, error) {
	var asset entity.ProductAsset
	err := r.db.WithContext(ctx).Where("id = ?", assetID).First(&asset).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Delete(&asset).Error; err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *productRepo) ListAssets(ctx context.Context, productID uuid.UUID) ([]entity.ProductAsset, error) {
	var assets []entity.ProductAsset
	err := r.db.WithContext(ctx).
		Where("product_id = ?", productID).
		Order("created_at").
		Find(&assets).Error
	return assets, err
}

func (r *productRepo) CreatePurchase(ctx context.Context, p *entity.ProductPurchase) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *productRepo) FindPurchase(ctx context.Context, productID, supporterID uuid.UUID) (*entity.ProductPurchase, error) {
	var purchase entity.ProductPurchase
	err := r.db.WithContext(ctx).
		Where("product_id = ? AND supporter_id = ?", productID, supporterID).
		First(&purchase).Error
	if err == gorm.ErrRecordNotFound {
		return nil, entity.ErrNotFound
	}
	return &purchase, err
}

func (r *productRepo) ListPurchasedProducts(ctx context.Context, supporterID uuid.UUID, cursor *uuid.UUID, limit int) ([]entity.Product, error) {
	var products []entity.Product
	q := r.db.WithContext(ctx).Unscoped().Preload("Creator").Preload("Assets").
		Joins("JOIN product_purchases ON product_purchases.product_id = products.id").
		Where("product_purchases.supporter_id = ?", supporterID)
	if cursor != nil {
		q = q.Where("products.id > ?", *cursor)
	}
	err := q.Order("products.created_at DESC").Limit(limit).Find(&products).Error
	return products, err
}

func (r *productRepo) DeletePurchase(ctx context.Context, productID, supporterID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("product_id = ? AND supporter_id = ?", productID, supporterID).Delete(&entity.ProductPurchase{}).Error
}

func (r *productRepo) LogDownload(ctx context.Context, productID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Create(&entity.ProductDownload{ID: uuid.New(), ProductID: productID, UserID: userID}).Error
}

func (r *productRepo) GetDownloadCount(ctx context.Context, productID uuid.UUID) (int64, error) {
	var c int64
	err := r.db.WithContext(ctx).Model(&entity.ProductDownload{}).Where("product_id = ?", productID).Count(&c).Error
	return c, err
}

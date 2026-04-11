-- +goose Up
-- Batch 11: Product download tracking
CREATE TABLE IF NOT EXISTS product_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES users(id),
    downloaded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_downloads_product ON product_downloads(product_id);
CREATE INDEX IF NOT EXISTS idx_product_downloads_user ON product_downloads(user_id);

-- +goose Down

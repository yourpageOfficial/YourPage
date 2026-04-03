-- +goose Up
CREATE TABLE product_assets (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_name    VARCHAR(500) NOT NULL,
    file_url     TEXT NOT NULL,
    file_size_kb BIGINT NOT NULL DEFAULT 0,
    mime_type    VARCHAR(200) NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_assets_product_id ON product_assets(product_id);

-- +goose Down
DROP TABLE IF EXISTS product_assets;

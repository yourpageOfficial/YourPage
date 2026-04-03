-- +goose Up
CREATE TABLE products (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(500) NOT NULL,
    slug          VARCHAR(300) NOT NULL,
    description   TEXT,
    type          VARCHAR(20) NOT NULL DEFAULT 'other'
                  CHECK (type IN ('ebook', 'preset', 'template', 'other')),
    price_idr     BIGINT NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    thumbnail_url TEXT,
    sales_count   BIGINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_products_slug       ON products(slug) WHERE deleted_at IS NULL;
CREATE INDEX        idx_products_creator_id ON products(creator_id);
CREATE INDEX        idx_products_active     ON products(is_active) WHERE deleted_at IS NULL;

-- +goose Down
DROP TABLE IF EXISTS products;

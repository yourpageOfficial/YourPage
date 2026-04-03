-- +goose Up
CREATE TABLE post_purchases (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id      UUID NOT NULL REFERENCES posts(id),
    supporter_id UUID NOT NULL REFERENCES users(id),
    payment_id   UUID NOT NULL REFERENCES payments(id),
    amount_idr   BIGINT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_post_purchases_unique     ON post_purchases(post_id, supporter_id);
CREATE INDEX        idx_post_purchases_supporter  ON post_purchases(supporter_id);
CREATE INDEX        idx_post_purchases_post       ON post_purchases(post_id);

CREATE TABLE product_purchases (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id   UUID NOT NULL REFERENCES products(id),
    supporter_id UUID NOT NULL REFERENCES users(id),
    payment_id   UUID NOT NULL REFERENCES payments(id),
    amount_idr   BIGINT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_product_purchases_unique     ON product_purchases(product_id, supporter_id);
CREATE INDEX        idx_product_purchases_supporter  ON product_purchases(supporter_id);
CREATE INDEX        idx_product_purchases_product    ON product_purchases(product_id);

-- +goose Down
DROP TABLE IF EXISTS product_purchases;
DROP TABLE IF EXISTS post_purchases;

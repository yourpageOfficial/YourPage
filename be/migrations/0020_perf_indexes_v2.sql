-- +goose Up
CREATE INDEX IF NOT EXISTS idx_post_media_post_id_sort ON post_media(post_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_assets_product_id ON product_assets(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_slug ON creator_profiles(page_slug);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_creator_status ON posts(creator_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_creator ON products(creator_id) WHERE deleted_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_post_media_post_id_sort;
DROP INDEX IF EXISTS idx_product_assets_product_id;
DROP INDEX IF EXISTS idx_creator_profiles_slug;
DROP INDEX IF EXISTS idx_creator_profiles_user_id;
DROP INDEX IF EXISTS idx_posts_creator_status;
DROP INDEX IF EXISTS idx_products_creator;

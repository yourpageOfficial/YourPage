package testutil

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewTestDB connects to a test database. Set DATABASE_URL_TEST env or defaults to local.
func NewTestDB() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		dsn = "host=localhost port=5432 user=test password=test dbname=yourpage_test sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent), SkipDefaultTransaction: true})
	if err != nil {
		return nil, fmt.Errorf("testutil: connect: %w", err)
	}
	return db, nil
}

// TruncateAll truncates all application tables for a clean test state.
func TruncateAll(db *gorm.DB) {
	tables := []string{
		"admin_audit_logs", "notifications", "follows", "chat_messages", "chat_conversations",
		"post_likes", "post_comments", "post_purchases", "post_media", "posts",
		"product_purchases", "product_assets", "products", "overlay_tiers",
		"donations", "payments", "credit_transactions", "credit_topup_requests",
		"user_wallets", "withdrawals", "user_kyc", "content_reports",
		"memberships", "membership_tiers", "referral_codes",
		"creator_profiles", "users",
	}
	for _, t := range tables {
		db.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", t))
	}
}

package config

import (
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	App      AppConfig
	DB       DBConfig
	Redis    RedisConfig
	JWT      JWTConfig
	MinIO    MinIOConfig
	Xendit   XenditConfig
	PayPal   PayPalConfig
	SMTP     SMTPConfig
	Platform PlatformConfig
}

type AppConfig struct {
	Env         string
	Port        string
	FrontendURL string
	AdminEmail  string
}

type DBConfig struct {
	URL string
}

type RedisConfig struct {
	URL string
}

type JWTConfig struct {
	Secret     string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

type MinIOConfig struct {
	Endpoint       string
	PublicEndpoint string
	AccessKey      string
	SecretKey      string
	UseSSL         bool
	PublicBucket   string
	PrivateBucket  string
}

type XenditConfig struct {
	SecretKey     string
	WebhookToken  string
}

type PayPalConfig struct {
	ClientID     string
	ClientSecret string
	Mode         string // sandbox | live
}

type SMTPConfig struct {
	Host string
	Port int
	User string
	Pass string
	From string
}

type PlatformConfig struct {
	FeePercent       int
	MinWithdrawalIDR int64
	CreditRateIDR    int64
	MaxUploadSizeMB  int64
}

func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	_ = viper.ReadInConfig()

	accessTTL, _ := time.ParseDuration(viper.GetString("JWT_ACCESS_TTL"))
	if accessTTL == 0 {
		accessTTL = 15 * time.Minute
	}
	refreshTTL, _ := time.ParseDuration(viper.GetString("JWT_REFRESH_TTL"))
	if refreshTTL == 0 {
		refreshTTL = 7 * 24 * time.Hour
	}

	adminEmail := viper.GetString("ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = "nandolimwork+admin@gmail.com"
	}

	return &Config{
		App: AppConfig{
			Env:         viper.GetString("APP_ENV"),
			Port:        viper.GetString("APP_PORT"),
			FrontendURL: viper.GetString("FRONTEND_URL"),
			AdminEmail:  adminEmail,
		},
		DB: DBConfig{
			URL: viper.GetString("DATABASE_URL"),
		},
		Redis: RedisConfig{
			URL: viper.GetString("REDIS_URL"),
		},
		JWT: JWTConfig{
			Secret:     viper.GetString("JWT_SECRET"),
			AccessTTL:  accessTTL,
			RefreshTTL: refreshTTL,
		},
		MinIO: MinIOConfig{
			Endpoint:       viper.GetString("MINIO_ENDPOINT"),
			PublicEndpoint: viper.GetString("MINIO_PUBLIC_ENDPOINT"),
			AccessKey:      viper.GetString("MINIO_ACCESS_KEY"),
			SecretKey:     viper.GetString("MINIO_SECRET_KEY"),
			UseSSL:        viper.GetBool("MINIO_USE_SSL"),
			PublicBucket:  viper.GetString("MINIO_PUBLIC_BUCKET"),
			PrivateBucket: viper.GetString("MINIO_PRIVATE_BUCKET"),
		},
		Xendit: XenditConfig{
			SecretKey:    viper.GetString("XENDIT_SECRET_KEY"),
			WebhookToken: viper.GetString("XENDIT_WEBHOOK_TOKEN"),
		},
		PayPal: PayPalConfig{
			ClientID:     viper.GetString("PAYPAL_CLIENT_ID"),
			ClientSecret: viper.GetString("PAYPAL_CLIENT_SECRET"),
			Mode:         viper.GetString("PAYPAL_MODE"),
		},
		SMTP: SMTPConfig{
			Host: viper.GetString("SMTP_HOST"),
			Port: viper.GetInt("SMTP_PORT"),
			User: viper.GetString("SMTP_USER"),
			Pass: viper.GetString("SMTP_PASS"),
			From: viper.GetString("SMTP_FROM"),
		},
		Platform: PlatformConfig{
			FeePercent:       viper.GetInt("PLATFORM_FEE_PERCENT"),
			MinWithdrawalIDR: viper.GetInt64("MIN_WITHDRAWAL_IDR"),
			CreditRateIDR:    viper.GetInt64("CREDIT_RATE_IDR"),
			MaxUploadSizeMB:  viper.GetInt64("MAX_UPLOAD_SIZE_MB"),
		},
	}, nil
}

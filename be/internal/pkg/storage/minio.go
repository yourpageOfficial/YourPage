package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/yourpage/be/internal/config"
)

type minioStorage struct {
	client         *minio.Client
	endpoint       string
	publicEndpoint string
	publicBaseURL  string
	useSSL         bool
}

func NewMinIO(cfg config.MinIOConfig) (StorageService, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
		Region: cfg.Region,
	})
	if err != nil {
		return nil, fmt.Errorf("minio: init: %w", err)
	}

	publicEndpoint := cfg.PublicEndpoint
	if publicEndpoint == "" {
		publicEndpoint = cfg.Endpoint
	}

	return &minioStorage{
		client:         client,
		endpoint:       cfg.Endpoint,
		publicEndpoint: publicEndpoint,
		publicBaseURL:  cfg.PublicBaseURL,
		useSSL:         cfg.UseSSL,
	}, nil
}

func (s *minioStorage) UploadFile(ctx context.Context, bucket, objectName string, file io.Reader, size int64, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, bucket, objectName, file, size, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", fmt.Errorf("minio: upload: %w", err)
	}

	// When a public base URL is configured (e.g. an R2 custom domain), serve
	// objects straight from the provider — proxying them through this app
	// would put every media byte back on our own egress bill.
	if s.publicBaseURL != "" {
		return fmt.Sprintf("%s/%s/%s", s.publicBaseURL, bucket, objectName), nil
	}
	// Otherwise use a relative /storage/ path via the app proxy, with caching.
	return fmt.Sprintf("/storage/%s/%s", bucket, objectName), nil
}

// normalizeObjectName accepts whatever form a caller stored — a bare object
// name, the "/storage/<bucket>/<object>" path this package returns today, or an
// absolute "http://host/<bucket>/<object>" URL written by earlier versions —
// and reduces it to the object name the S3 API expects. Passing the stored
// value straight through produced doubled paths and unusable signatures.
func normalizeObjectName(bucket, stored string) string {
	name := stored
	if i := strings.Index(name, "://"); i >= 0 {
		if slash := strings.Index(name[i+3:], "/"); slash >= 0 {
			name = name[i+3+slash:]
		}
	}
	name = strings.TrimPrefix(name, "/storage/")
	name = strings.TrimPrefix(name, "/")
	name = strings.TrimPrefix(name, bucket+"/")
	return name
}

func (s *minioStorage) GetPresignedURL(ctx context.Context, bucket, storedName string, expiry time.Duration) (string, error) {
	objectName := normalizeObjectName(bucket, storedName)
	u, err := s.client.PresignedGetObject(ctx, bucket, objectName, expiry, url.Values{})
	if err != nil {
		return "", fmt.Errorf("minio: presign: %w", err)
	}
	result := fmt.Sprintf("/storage/%s/%s", bucket, objectName)
	if u.RawQuery != "" {
		result += "?" + u.RawQuery
	}
	return result, nil
}

func (s *minioStorage) DeleteFile(ctx context.Context, bucket, objectName string) error {
	return s.client.RemoveObject(ctx, bucket, objectName, minio.RemoveObjectOptions{})
}

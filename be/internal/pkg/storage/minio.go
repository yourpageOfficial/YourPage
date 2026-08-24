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
	useSSL         bool
}

func NewMinIO(cfg config.MinIOConfig) (StorageService, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio: init: %w", err)
	}

	publicEndpoint := cfg.PublicEndpoint
	if publicEndpoint == "" {
		publicEndpoint = cfg.Endpoint
	}

	return &minioStorage{client: client, endpoint: cfg.Endpoint, publicEndpoint: publicEndpoint, useSSL: cfg.UseSSL}, nil
}

func (s *minioStorage) UploadFile(ctx context.Context, bucket, objectName string, file io.Reader, size int64, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, bucket, objectName, file, size, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", fmt.Errorf("minio: upload: %w", err)
	}

	// Use relative /storage/ path so it goes through Next.js proxy with caching
	return fmt.Sprintf("/storage/%s/%s", bucket, objectName), nil
}

func (s *minioStorage) GetPresignedURL(ctx context.Context, bucket, objectName string, expiry time.Duration) (string, error) {
	// Strip leading /storage/{bucket}/ or /{bucket}/ if present
	prefix := fmt.Sprintf("/storage/%s/", bucket)
	if strings.HasPrefix(objectName, prefix) {
		objectName = strings.TrimPrefix(objectName, prefix)
	} else if strings.HasPrefix(objectName, fmt.Sprintf("/%s/", bucket)) {
		objectName = strings.TrimPrefix(objectName, fmt.Sprintf("/%s/", bucket))
	} else if strings.HasPrefix(objectName, "/storage/") {
		parts := strings.SplitN(objectName, "/", 4)
		if len(parts) >= 4 {
			objectName = parts[3]
		}
	}

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

package storage

import (
	"context"
	"io"
	"time"
)

// StorageService abstracts object-storage operations (MinIO implementation is separate).
type StorageService interface {
	// UploadFile uploads a file to the given bucket and returns its public URL.
	UploadFile(ctx context.Context, bucket, objectName string, file io.Reader, size int64, contentType string) (url string, err error)

	// GetPresignedURL generates a time-limited pre-signed download URL.
	GetPresignedURL(ctx context.Context, bucket, objectName string, expiry time.Duration) (string, error)

	// DeleteFile removes an object from the given bucket.
	DeleteFile(ctx context.Context, bucket, objectName string) error
}

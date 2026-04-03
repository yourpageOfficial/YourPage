package entity

import "errors"

var (
	ErrNotFound         = errors.New("resource not found")
	ErrUnauthorized     = errors.New("unauthorized")
	ErrForbidden        = errors.New("forbidden")
	ErrConflict         = errors.New("already exists")
	ErrPaymentFailed    = errors.New("payment processing failed")
	ErrContentLocked    = errors.New("content is locked")
	ErrAlreadyPurchased = errors.New("already purchased")
	ErrInsufficientCredit = errors.New("insufficient credit balance")
	ErrBanned           = errors.New("account is banned")
	ErrInvalidToken     = errors.New("invalid or expired token")
	ErrMinWithdrawal    = errors.New("amount below minimum withdrawal")
	ErrFileTooLarge     = errors.New("file size exceeds limit")
	ErrKYCRequired      = errors.New("KYC verification required")
)

package response

// Standard error codes for FE to switch on (not parse message strings).
const (
	ErrCodeAuthRequired        = "auth_required"
	ErrCodeAuthInvalid         = "auth_invalid"
	ErrCodeForbidden           = "forbidden"
	ErrCodeNotFound            = "not_found"
	ErrCodeValidation          = "validation_error"
	ErrCodeConflict            = "conflict"
	ErrCodeInsufficientCredits = "insufficient_credits"
	ErrCodeStorageLimit        = "storage_limit_exceeded"
	ErrCodeRateLimited         = "rate_limited"
	ErrCodeServerError         = "server_error"
	ErrCodeAccountSuspended    = "account_suspended"
	ErrCodeKYCRequired         = "kyc_required"
	ErrCodeMinWithdrawal       = "min_withdrawal"
	ErrCodeFileTooLarge        = "file_too_large"
	ErrCodeAlreadyPurchased    = "already_purchased"
	ErrCodePaymentFailed       = "payment_failed"
)

// ErrorWithCode returns a structured error response with a machine-readable code.
func ErrorWithCode(c interface{ JSON(int, interface{}) }, status int, code, message string) {
	c.(interface{ JSON(int, interface{}) }).JSON(status, map[string]interface{}{
		"success": false,
		"error":   code,
		"message": message,
	})
}

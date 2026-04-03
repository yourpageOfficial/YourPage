package validator

import (
	"crypto/rand"
	"math/big"
)

// GenerateUniqueCode returns a random 3-digit number (100-999).
func GenerateUniqueCode() int {
	n, _ := rand.Int(rand.Reader, big.NewInt(900))
	return int(n.Int64()) + 100
}

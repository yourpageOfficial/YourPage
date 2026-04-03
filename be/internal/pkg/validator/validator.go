package validator

import (
	"errors"

	"github.com/go-playground/validator/v10"
)

// Validator wraps go-playground/validator with a friendlier API.
type Validator struct {
	v *validator.Validate
}

// New creates a ready-to-use Validator instance.
func New() *Validator {
	return &Validator{v: validator.New()}
}

// Validate checks s against its struct tags.
// It returns a map of field name → human-readable message.
// An empty map means no validation errors.
func (vl *Validator) Validate(s interface{}) map[string]string {
	err := vl.v.Struct(s)
	if err == nil {
		return nil
	}

	var ve validator.ValidationErrors
	if !errors.As(err, &ve) {
		// Unexpected error type – surface it under a generic key.
		return map[string]string{"_": err.Error()}
	}

	errs := make(map[string]string, len(ve))
	for _, fe := range ve {
		errs[fieldName(fe)] = message(fe)
	}
	return errs
}

// fieldName returns the JSON-friendly lowercase field name.
func fieldName(fe validator.FieldError) string {
	return fe.Field()
}

// message produces a human-readable description of the constraint violation.
func message(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "this field is required"
	case "email":
		return "must be a valid email address"
	case "min":
		return "value is too short (min " + fe.Param() + ")"
	case "max":
		return "value is too long (max " + fe.Param() + ")"
	case "alphanum":
		return "only alphanumeric characters are allowed"
	case "oneof":
		return "must be one of: " + fe.Param()
	case "url":
		return "must be a valid URL"
	default:
		return "failed validation: " + fe.Tag()
	}
}

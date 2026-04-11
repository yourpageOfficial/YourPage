package validator_test

import (
	"testing"

	"github.com/yourpage/be/internal/pkg/validator"
)

func TestSanitizeString(t *testing.T) {
	tests := []struct{ name, input, notContain string }{
		{"strip script tag", "<script>alert(1)</script>", "<script>"},
		{"strip html", "<b>bold</b>", "<b>"},
		{"strip onclick", `<div onclick="hack()">`, "onclick"},
		{"keep normal", "hello world", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validator.SanitizeString(tt.input)
			if tt.notContain != "" && contains(got, tt.notContain) {
				t.Errorf("sanitize(%q) = %q, should not contain %q", tt.input, got, tt.notContain)
			}
		})
	}
}

func TestUniqueCode(t *testing.T) {
	seen := map[int]bool{}
	for i := 0; i < 50; i++ {
		code := validator.GenerateUniqueCode()
		if code < 100 || code > 999 { t.Fatalf("code %d out of range", code) }
		seen[code] = true
	}
	if len(seen) < 10 { t.Error("codes not random enough") }
}

func TestValidateStruct(t *testing.T) {
	v := validator.New()
	type req struct {
		Email string `validate:"required,email"`
		Name  string `validate:"required,min=3"`
	}
	errs := v.Validate(req{Email: "bad", Name: "ab"})
	if errs == nil { t.Error("expected validation errors") }
	errs = v.Validate(req{Email: "test@example.com", Name: "abc"})
	if errs != nil { t.Errorf("unexpected errors: %v", errs) }
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || indexStr(s, sub) >= 0)
}

func indexStr(s, sub string) int {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub { return i }
	}
	return -1
}

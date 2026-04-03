package validator

import (
	"regexp"
	"strings"
)

var htmlTagRe = regexp.MustCompile(`<[^>]*>`)
var scriptRe = regexp.MustCompile(`(?i)(javascript:|on\w+=|<script)`)

// SanitizeString strips HTML tags and dangerous patterns.
func SanitizeString(s string) string {
	s = htmlTagRe.ReplaceAllString(s, "")
	s = scriptRe.ReplaceAllString(s, "")
	return strings.TrimSpace(s)
}

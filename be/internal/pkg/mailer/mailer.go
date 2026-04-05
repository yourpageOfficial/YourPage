package mailer

import (
	"context"
	"fmt"
	"net/mail"
	"net/smtp"
	"strings"

	"github.com/yourpage/be/internal/config"
)

// Mailer sends transactional emails.
type Mailer interface {
	SendPasswordReset(ctx context.Context, toEmail, token string) error
}

// SMTPMailer is the production SMTP implementation.
type SMTPMailer struct {
	cfg         config.SMTPConfig
	frontendURL string
}

// New returns a ready SMTPMailer.
func New(cfg config.SMTPConfig, frontendURL string) *SMTPMailer {
	return &SMTPMailer{cfg: cfg, frontendURL: frontendURL}
}

// SendPasswordReset sends a password-reset link to the user's email address.
func (m *SMTPMailer) SendPasswordReset(_ context.Context, toEmail, token string) error {
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", m.frontendURL, token)
	subject := "Reset Password YourPage"
	body := fmt.Sprintf(
		"Klik link berikut untuk reset password kamu (berlaku 15 menit):\n\n%s\n\n"+
			"Jika kamu tidak meminta reset password, abaikan email ini.",
		resetLink,
	)

	msg := strings.Join([]string{
		"From: " + m.cfg.From,
		"To: " + toEmail,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")

	// Extract plain email address from "Name <email>" format for SMTP envelope
	fromAddr := m.cfg.From
	if parsed, err := mail.ParseAddress(m.cfg.From); err == nil {
		fromAddr = parsed.Address
	}

	addr := fmt.Sprintf("%s:%d", m.cfg.Host, m.cfg.Port)
	var auth smtp.Auth
	if m.cfg.User != "" {
		auth = smtp.PlainAuth("", m.cfg.User, m.cfg.Pass, m.cfg.Host)
	}

	return smtp.SendMail(addr, auth, fromAddr, []string{toEmail}, []byte(msg))
}

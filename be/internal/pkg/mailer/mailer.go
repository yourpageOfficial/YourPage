package mailer

import (
	"context"
	"fmt"
	"net/mail"
	"net/smtp"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/yourpage/be/internal/config"
)

type Mailer interface {
	SendPasswordReset(ctx context.Context, toEmail, token string) error
	SendEmailVerification(ctx context.Context, toEmail, token string) error
	SendWelcome(ctx context.Context, toEmail, displayName string) error
	SendTopupApproved(ctx context.Context, toEmail string, credits int64) error
	SendTopupRejected(ctx context.Context, toEmail, reason string) error
	SendWithdrawalProcessed(ctx context.Context, toEmail string, amountIDR int64, bankName string) error
	SendWithdrawalRejected(ctx context.Context, toEmail, reason string) error
	SendPurchaseReceipt(ctx context.Context, toEmail, itemName string, credits int64) error
	SendDonationReceived(ctx context.Context, toEmail, donorName string, credits int64, message string) error
	SendKYCApproved(ctx context.Context, toEmail string) error
	SendKYCRejected(ctx context.Context, toEmail, reason string) error
	SendTierUpgrade(ctx context.Context, toEmail, tierName string) error
	SendTierExpired(ctx context.Context, toEmail string) error
	// Admin digest
	SendAdminPendingDigest(ctx context.Context, adminEmail string, pendingWithdrawals, pendingTopups, pendingKYC int) error
}

type SMTPMailer struct {
	cfg         config.SMTPConfig
	frontendURL string
}

func New(cfg config.SMTPConfig, frontendURL string) *SMTPMailer {
	return &SMTPMailer{cfg: cfg, frontendURL: frontendURL}
}

func (m *SMTPMailer) send(toEmail, subject, body string) error {
	if m.cfg.Host == "" {
		log.Warn().Str("to", toEmail).Str("subject", subject).Msg("SMTP not configured, skipping email")
		return nil
	}

	html := fmt.Sprintf(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="text-align:center;padding:20px 0;border-bottom:2px solid #2563EB">
<h1 style="color:#2563EB;margin:0;font-size:24px">YourPage</h1>
</div>
<div style="padding:24px 0">%s</div>
<div style="border-top:1px solid #eee;padding:16px 0;text-align:center;color:#999;font-size:12px">
<p>© 2026 YourPage — urpage.online</p>
<p>Email ini dikirim otomatis, jangan balas email ini.</p>
</div>
</body></html>`, body)

	msg := strings.Join([]string{
		"From: " + m.cfg.From,
		"To: " + toEmail,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=UTF-8",
		"",
		html,
	}, "\r\n")

	fromAddr := m.cfg.From
	if parsed, err := mail.ParseAddress(m.cfg.From); err == nil {
		fromAddr = parsed.Address
	}

	addr := fmt.Sprintf("%s:%d", m.cfg.Host, m.cfg.Port)
	var auth smtp.Auth
	if m.cfg.User != "" {
		auth = smtp.PlainAuth("", m.cfg.User, m.cfg.Pass, m.cfg.Host)
	}

	if err := smtp.SendMail(addr, auth, fromAddr, []string{toEmail}, []byte(msg)); err != nil {
		log.Error().Err(err).Str("to", toEmail).Str("subject", subject).Msg("failed to send email")
		return err
	}
	log.Info().Str("to", toEmail).Str("subject", subject).Msg("email sent")
	return nil
}

func (m *SMTPMailer) SendPasswordReset(_ context.Context, toEmail, token string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", m.frontendURL, token)
	return m.send(toEmail, "Reset Password — YourPage", fmt.Sprintf(
		`<h2>Reset Password</h2>
		<p>Klik tombol di bawah untuk reset password kamu (berlaku 15 menit):</p>
		<p style="text-align:center;padding:16px 0"><a href="%s" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a></p>
		<p style="color:#999;font-size:13px">Jika kamu tidak meminta reset password, abaikan email ini.</p>`, link))
}

func (m *SMTPMailer) SendEmailVerification(_ context.Context, toEmail, token string) error {
	link := fmt.Sprintf("%s/verify-email?token=%s", m.frontendURL, token)
	return m.send(toEmail, "Verifikasi Email — YourPage", fmt.Sprintf(
		`<h2>Verifikasi Email Kamu</h2>
		<p>Klik tombol di bawah untuk memverifikasi email kamu:</p>
		<p style="text-align:center;padding:16px 0"><a href="%s" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Verifikasi Email</a></p>
		<p style="color:#999;font-size:13px">Link berlaku 24 jam.</p>`, link))
}

func (m *SMTPMailer) SendWelcome(_ context.Context, toEmail, displayName string) error {
	return m.send(toEmail, "Selamat Datang di YourPage! 🎉", fmt.Sprintf(
		`<h2>Halo %s! 👋</h2>
		<p>Selamat datang di YourPage — platform monetisasi konten untuk kreator Indonesia.</p>
		<p>Berikut yang bisa kamu lakukan:</p>
		<ul>
		<li>📝 Buat post berbayar atau gratis</li>
		<li>📦 Jual produk digital (e-book, preset, template)</li>
		<li>☕ Terima donasi dari fans</li>
		<li>💬 Chat dengan supporter</li>
		</ul>
		<p style="text-align:center;padding:16px 0"><a href="%s/dashboard" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Buka Dashboard</a></p>`, displayName, m.frontendURL))
}

func (m *SMTPMailer) SendTopupApproved(_ context.Context, toEmail string, credits int64) error {
	return m.send(toEmail, "Top-up Berhasil ✅", fmt.Sprintf(
		`<h2>Top-up Berhasil!</h2>
		<p>Top-up kamu telah disetujui. <strong>%d Credit</strong> sudah masuk ke wallet kamu.</p>
		<p style="text-align:center;padding:16px 0"><a href="%s/wallet" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Lihat Wallet</a></p>`, credits, m.frontendURL))
}

func (m *SMTPMailer) SendTopupRejected(_ context.Context, toEmail, reason string) error {
	return m.send(toEmail, "Top-up Ditolak ❌", fmt.Sprintf(
		`<h2>Top-up Ditolak</h2>
		<p>Maaf, top-up kamu ditolak.</p>
		<p><strong>Alasan:</strong> %s</p>
		<p>Silakan coba lagi atau hubungi support.</p>`, reason))
}

func (m *SMTPMailer) SendWithdrawalProcessed(_ context.Context, toEmail string, amountIDR int64, bankName string) error {
	return m.send(toEmail, "Penarikan Diproses 💰", fmt.Sprintf(
		`<h2>Penarikan Diproses!</h2>
		<p>Penarikan sebesar <strong>Rp %s</strong> sedang ditransfer ke rekening %s kamu.</p>
		<p>Dana akan masuk dalam 1-3 hari kerja.</p>`, formatRupiah(amountIDR), bankName))
}

func (m *SMTPMailer) SendWithdrawalRejected(_ context.Context, toEmail, reason string) error {
	return m.send(toEmail, "Penarikan Ditolak ❌", fmt.Sprintf(
		`<h2>Penarikan Ditolak</h2>
		<p>Maaf, penarikan kamu ditolak. Credit sudah dikembalikan ke wallet.</p>
		<p><strong>Alasan:</strong> %s</p>`, reason))
}

func (m *SMTPMailer) SendPurchaseReceipt(_ context.Context, toEmail, itemName string, credits int64) error {
	return m.send(toEmail, "Pembelian Berhasil 🛒", fmt.Sprintf(
		`<h2>Pembelian Berhasil!</h2>
		<p>Kamu berhasil membeli <strong>%s</strong> seharga <strong>%d Credit</strong>.</p>
		<p style="text-align:center;padding:16px 0"><a href="%s/s/posts" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Lihat Library</a></p>`, itemName, credits, m.frontendURL))
}

func (m *SMTPMailer) SendDonationReceived(_ context.Context, toEmail, donorName string, credits int64, message string) error {
	msgHTML := ""
	if message != "" {
		msgHTML = fmt.Sprintf(`<p style="background:#f0f9ff;padding:12px;border-radius:8px;font-style:italic">&ldquo;%s&rdquo;</p>`, message)
	}
	return m.send(toEmail, fmt.Sprintf("Donasi %d Credit dari %s ☕", credits, donorName), fmt.Sprintf(
		`<h2>Donasi Diterima! ☕</h2>
		<p><strong>%s</strong> mengirim <strong>%d Credit</strong> untukmu.</p>
		%s
		<p style="text-align:center;padding:16px 0"><a href="%s/dashboard/donations" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Lihat Donasi</a></p>`, donorName, credits, msgHTML, m.frontendURL))
}

func (m *SMTPMailer) SendKYCApproved(_ context.Context, toEmail string) error {
	return m.send(toEmail, "KYC Disetujui ✅", 
		`<h2>Verifikasi KYC Disetujui!</h2>
		<p>Identitas kamu sudah terverifikasi. Sekarang kamu bisa melakukan penarikan dana ke rekening bank.</p>
		<p style="text-align:center;padding:16px 0"><a href="`+m.frontendURL+`/dashboard/withdrawals" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Tarik Dana</a></p>`)
}

func (m *SMTPMailer) SendKYCRejected(_ context.Context, toEmail, reason string) error {
	return m.send(toEmail, "KYC Ditolak ❌", fmt.Sprintf(
		`<h2>Verifikasi KYC Ditolak</h2>
		<p>Maaf, dokumen KYC kamu ditolak.</p>
		<p><strong>Alasan:</strong> %s</p>
		<p>Silakan upload ulang dokumen yang benar.</p>`, reason))
}

func (m *SMTPMailer) SendTierUpgrade(_ context.Context, toEmail, tierName string) error {
	return m.send(toEmail, fmt.Sprintf("Upgrade ke %s Berhasil! 🚀", tierName), fmt.Sprintf(
		`<h2>Selamat! Kamu sekarang %s 🎉</h2>
		<p>Nikmati semua fitur premium yang tersedia untuk tier %s.</p>
		<p style="text-align:center;padding:16px 0"><a href="%s/dashboard" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Buka Dashboard</a></p>`, tierName, tierName, m.frontendURL))
}

func (m *SMTPMailer) SendTierExpired(_ context.Context, toEmail string) error {
	return m.send(toEmail, "Tier Kamu Sudah Expired", 
		`<h2>Tier Kamu Sudah Expired</h2>
		<p>Tier premium kamu sudah berakhir. Kamu sekarang kembali ke tier Free.</p>
		<p>Upgrade lagi untuk menikmati fitur premium.</p>
		<p style="text-align:center;padding:16px 0"><a href="`+m.frontendURL+`/dashboard/subscription" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Upgrade Sekarang</a></p>`)
}

func (m *SMTPMailer) SendAdminPendingDigest(_ context.Context, adminEmail string, pendingWithdrawals, pendingTopups, pendingKYC int) error {
	rows := ""
	if pendingWithdrawals > 0 {
		rows += fmt.Sprintf(`
		<tr>
			<td style="padding:12px 16px;border-bottom:1px solid #eee">💸 Penarikan Dana</td>
			<td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center">
				<span style="background:#FEF3C7;color:#92400E;padding:4px 12px;border-radius:20px;font-weight:bold">%d menunggu</span>
			</td>
			<td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center">
				<a href="%s/admin/withdrawals" style="color:#2563EB;text-decoration:none;font-weight:bold">Proses →</a>
			</td>
		</tr>`, pendingWithdrawals, m.frontendURL)
	}
	if pendingTopups > 0 {
		rows += fmt.Sprintf(`
		<tr>
			<td style="padding:12px 16px;border-bottom:1px solid #eee">💰 Top-up Credit</td>
			<td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center">
				<span style="background:#FEF3C7;color:#92400E;padding:4px 12px;border-radius:20px;font-weight:bold">%d menunggu</span>
			</td>
			<td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center">
				<a href="%s/admin/credit-topups" style="color:#2563EB;text-decoration:none;font-weight:bold">Verifikasi →</a>
			</td>
		</tr>`, pendingTopups, m.frontendURL)
	}
	if pendingKYC > 0 {
		rows += fmt.Sprintf(`
		<tr>
			<td style="padding:12px 16px">🪪 Verifikasi KYC</td>
			<td style="padding:12px 16px;text-align:center">
				<span style="background:#FEF3C7;color:#92400E;padding:4px 12px;border-radius:20px;font-weight:bold">%d menunggu</span>
			</td>
			<td style="padding:12px 16px;text-align:center">
				<a href="%s/admin/kyc" style="color:#2563EB;text-decoration:none;font-weight:bold">Tinjau →</a>
			</td>
		</tr>`, pendingKYC, m.frontendURL)
	}

	total := pendingWithdrawals + pendingTopups + pendingKYC
	body := fmt.Sprintf(`
		<h2>📋 Ringkasan Tugas Admin</h2>
		<p>Ada <strong>%d item</strong> yang perlu kamu tindaklanjuti sekarang:</p>
		<table style="width:100%%;border-collapse:collapse;margin:16px 0;border:1px solid #eee;border-radius:8px;overflow:hidden">
			<thead>
				<tr style="background:#F8FAFC">
					<th style="padding:10px 16px;text-align:left;font-size:12px;color:#64748B;text-transform:uppercase">Tipe</th>
					<th style="padding:10px 16px;text-align:center;font-size:12px;color:#64748B;text-transform:uppercase">Status</th>
					<th style="padding:10px 16px;text-align:center;font-size:12px;color:#64748B;text-transform:uppercase">Aksi</th>
				</tr>
			</thead>
			<tbody>%s</tbody>
		</table>
		<p style="text-align:center;padding:16px 0">
			<a href="%s/admin" style="background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Buka Admin Panel →</a>
		</p>
		<p style="color:#999;font-size:12px">Email ini dikirim otomatis setiap 5 menit jika ada item pending.</p>`,
		total, rows, m.frontendURL)

	return m.send(adminEmail, fmt.Sprintf("🔔 YourPage Admin — %d Item Menunggu Tindakan", total), body)
}

func formatRupiah(amount int64) string {
	s := fmt.Sprintf("%d", amount)
	n := len(s)
	if n <= 3 { return s }
	var result []byte
	for i, c := range s {
		if (n-i)%3 == 0 && i != 0 { result = append(result, '.') }
		result = append(result, byte(c))
	}
	return string(result)
}

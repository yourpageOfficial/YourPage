package handler

import (
	"fmt"
	"io"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/pkg/realtime"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/repository"
)

type OverlayHandler struct {
	userRepo repository.UserRepository
	broker   realtime.Broker
	validate *validator.Validator
}

func NewOverlayHandler(userRepo repository.UserRepository, broker realtime.Broker) *OverlayHandler {
	return &OverlayHandler{userRepo: userRepo, broker: broker, validate: validator.New()}
}

// overlayConfig is everything an overlay needs to render, in one request.
type overlayConfig struct {
	Tiers            []entity.OverlayTier `json:"tiers"`
	Style            string               `json:"overlay_style"`
	TextTemplate     string               `json:"overlay_text_template"`
	AccentColor      string               `json:"overlay_accent_color"`
	TextColor        string               `json:"overlay_text_color"`
	Font             string               `json:"overlay_font"`
	DurationMS       int                  `json:"overlay_duration_ms"`
	Position         string               `json:"overlay_position"`
	SoundVolume      int                  `json:"overlay_sound_volume"`
	TTSEnabled       bool                 `json:"overlay_tts_enabled"`
	TTSMinCredits    int                  `json:"overlay_tts_min_credits"`
	GoalTitle        string               `json:"donation_goal_title,omitempty"`
	GoalAmountIDR    int64                `json:"donation_goal_amount"`
	GoalCurrentIDR   int64                `json:"donation_goal_current"`
}

// GetConfig returns the render settings for a creator's overlay.
// Public: an OBS browser source cannot carry credentials, and nothing here is
// sensitive.
func (h *OverlayHandler) GetConfig(c *gin.Context) {
	cid, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	tiers, _ := h.userRepo.ListOverlayTiers(c.Request.Context(), cid)
	if tiers == nil {
		tiers = []entity.OverlayTier{}
	}

	cfg := overlayConfig{
		Tiers:         tiers,
		Style:         "bounce",
		TextTemplate:  "{donor} donated {amount} Credit!",
		AccentColor:   "#EC4899",
		TextColor:     "#0F0D1A",
		Font:          "Outfit",
		DurationMS:    8000,
		Position:      "center",
		SoundVolume:   80,
		TTSEnabled:    true,
		TTSMinCredits: 1,
	}

	if p, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), cid); err == nil {
		if p.OverlayStyle != "" { cfg.Style = p.OverlayStyle }
		if p.OverlayTextTemplate != "" { cfg.TextTemplate = p.OverlayTextTemplate }
		if p.OverlayAccentColor != "" { cfg.AccentColor = p.OverlayAccentColor }
		if p.OverlayTextColor != "" { cfg.TextColor = p.OverlayTextColor }
		if p.OverlayFont != "" { cfg.Font = p.OverlayFont }
		if p.OverlayDurationMS > 0 { cfg.DurationMS = p.OverlayDurationMS }
		if p.OverlayPosition != "" { cfg.Position = p.OverlayPosition }
		cfg.SoundVolume = p.OverlaySoundVolume
		cfg.TTSEnabled = p.OverlayTTSEnabled
		if p.OverlayTTSMinCredits > 0 { cfg.TTSMinCredits = p.OverlayTTSMinCredits }
		if p.DonationGoalTitle != nil { cfg.GoalTitle = *p.DonationGoalTitle }
		cfg.GoalAmountIDR = p.DonationGoalAmount
		cfg.GoalCurrentIDR = p.DonationGoalCurrent
	}

	response.OK(c, cfg)
}

// Stream pushes alerts to an OBS browser source over Server-Sent Events.
func (h *OverlayHandler) Stream(c *gin.Context) {
	cid, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	alerts, err := h.broker.Subscribe(c.Request.Context(), cid)
	if err != nil {
		response.InternalError(c)
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	// Proxies buffer by default, which would hold alerts back until the
	// connection closes — exactly the opposite of what a live alert needs.
	c.Header("X-Accel-Buffering", "no")

	// Flush a frame immediately. A proxy may hold response headers until the
	// first byte of the body, which would leave the browser's EventSource
	// stuck "connecting" until the first real alert — the overlay would look
	// dead and could not tell whether it was actually subscribed.
	c.SSEvent("connected", time.Now().Unix())
	c.Writer.Flush()

	// Heartbeat keeps idle connections alive through proxy read timeouts.
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	c.Stream(func(w io.Writer) bool {
		select {
		case alert, ok := <-alerts:
			if !ok {
				return false
			}
			c.SSEvent("alert", alert)
			return true
		case <-ticker.C:
			c.SSEvent("ping", time.Now().Unix())
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

// Overlay settings are rendered into CSS on a page that streamers embed in
// OBS, so every value is constrained to a known-safe set rather than trusted
// as free text.
var (
	allowedOverlayStyles = map[string]bool{
		"bounce": true, "slide": true, "fade": true, "spin": true, "drop": true, "pop": true,
	}
	allowedOverlayPositions = map[string]bool{
		"center": true, "top": true, "bottom": true,
		"top-left": true, "top-right": true, "bottom-left": true, "bottom-right": true,
	}
	allowedOverlayFonts = map[string]bool{
		"Outfit": true, "Rubik": true, "Inter": true, "Poppins": true,
		"Montserrat": true, "Bebas Neue": true, "Fredoka": true,
	}
	hexColorRe = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
)

type updateOverlaySettingsRequest struct {
	Style         *string `json:"overlay_style"`
	TextTemplate  *string `json:"overlay_text_template"`
	AccentColor   *string `json:"overlay_accent_color"`
	TextColor     *string `json:"overlay_text_color"`
	Font          *string `json:"overlay_font"`
	DurationMS    *int    `json:"overlay_duration_ms"`
	Position      *string `json:"overlay_position"`
	SoundVolume   *int    `json:"overlay_sound_volume"`
	TTSEnabled    *bool   `json:"overlay_tts_enabled"`
	TTSMinCredits *int    `json:"overlay_tts_min_credits"`
}

// UpdateSettings saves a creator's overlay appearance.
func (h *OverlayHandler) UpdateSettings(c *gin.Context) {
	var req updateOverlaySettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}

	p, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), getUserID(c))
	if err != nil {
		response.NotFound(c, "Profil creator tidak ditemukan")
		return
	}

	if req.Style != nil {
		if !allowedOverlayStyles[*req.Style] {
			response.UnprocessableEntity(c, "Animasi tidak dikenal")
			return
		}
		p.OverlayStyle = *req.Style
	}
	if req.TextTemplate != nil {
		t := strings.TrimSpace(*req.TextTemplate)
		if len(t) > 120 {
			response.UnprocessableEntity(c, "Template teks maksimal 120 karakter")
			return
		}
		if t != "" {
			p.OverlayTextTemplate = t
		}
	}
	if req.AccentColor != nil {
		if !hexColorRe.MatchString(*req.AccentColor) {
			response.UnprocessableEntity(c, "Warna aksen harus format hex, contoh #EC4899")
			return
		}
		p.OverlayAccentColor = *req.AccentColor
	}
	if req.TextColor != nil {
		if !hexColorRe.MatchString(*req.TextColor) {
			response.UnprocessableEntity(c, "Warna teks harus format hex, contoh #0F0D1A")
			return
		}
		p.OverlayTextColor = *req.TextColor
	}
	if req.Font != nil {
		if !allowedOverlayFonts[*req.Font] {
			response.UnprocessableEntity(c, "Font tidak tersedia")
			return
		}
		p.OverlayFont = *req.Font
	}
	if req.DurationMS != nil {
		if *req.DurationMS < 2000 || *req.DurationMS > 30000 {
			response.UnprocessableEntity(c, "Durasi alert harus antara 2-30 detik")
			return
		}
		p.OverlayDurationMS = *req.DurationMS
	}
	if req.Position != nil {
		if !allowedOverlayPositions[*req.Position] {
			response.UnprocessableEntity(c, "Posisi tidak dikenal")
			return
		}
		p.OverlayPosition = *req.Position
	}
	if req.SoundVolume != nil {
		if *req.SoundVolume < 0 || *req.SoundVolume > 100 {
			response.UnprocessableEntity(c, "Volume harus antara 0-100")
			return
		}
		p.OverlaySoundVolume = *req.SoundVolume
	}
	if req.TTSEnabled != nil {
		p.OverlayTTSEnabled = *req.TTSEnabled
	}
	if req.TTSMinCredits != nil {
		if *req.TTSMinCredits < 1 {
			response.UnprocessableEntity(c, "Minimal credit untuk TTS minimal 1")
			return
		}
		p.OverlayTTSMinCredits = *req.TTSMinCredits
	}

	p.Tier = nil
	if err := h.userRepo.UpdateCreatorProfile(c.Request.Context(), p); err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, p)
}

// TestAlert lets a creator fire a sample alert into their own overlay so they
// can position and style it without waiting for a real donation.
func (h *OverlayHandler) TestAlert(c *gin.Context) {
	uid := getUserID(c)
	var body struct {
		Credits int64  `json:"credits"`
		Message string `json:"message"`
	}
	_ = c.ShouldBindJSON(&body)
	if body.Credits <= 0 { body.Credits = 50 }
	if body.Message == "" { body.Message = "Semangat terus kontennya!" }

	alert := realtime.Alert{
		Type:      realtime.EventTest,
		ID:        uuid.NewString(),
		DonorName: "Test Supporter",
		Credits:   body.Credits,
		AmountIDR: body.Credits * 1000,
		Message:   body.Message,
	}
	if err := h.broker.Publish(c.Request.Context(), uid, alert); err != nil {
		response.InternalError(c)
		return
	}
	response.OKMessage(c, "test alert sent")
}

type createOverlayTierRequest struct {
	MinCredits int     `json:"min_credits" validate:"required,min=1"`
	ImageURL   string  `json:"image_url" validate:"required,url"`
	SoundURL   *string `json:"sound_url" validate:"omitempty,url"`
	Label      *string `json:"label" validate:"omitempty,max=100"`
}

func (h *OverlayHandler) ListTiers(c *gin.Context) {
	cid, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	tiers, _ := h.userRepo.ListOverlayTiers(c.Request.Context(), cid)
	overlayStyle := "bounce"
	overlayTextTemplate := "{donor} donated {amount} Credit!"
	if profile, err := h.userRepo.FindCreatorByUserID(c.Request.Context(), cid); err == nil {
		if profile.OverlayStyle != "" {
			overlayStyle = profile.OverlayStyle
		}
		if profile.OverlayTextTemplate != "" {
			overlayTextTemplate = profile.OverlayTextTemplate
		}
	}
	c.JSON(200, gin.H{"success": true, "data": tiers, "overlay_style": overlayStyle, "overlay_text_template": overlayTextTemplate})
}

func (h *OverlayHandler) CreateTier(c *gin.Context) {
	var req createOverlayTierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	uid := getUserID(c)
	existing, _ := h.userRepo.ListOverlayTiers(c.Request.Context(), uid)
	cp, _ := h.userRepo.FindCreatorByUserID(c.Request.Context(), uid)
	maxTiers := 3
	if cp != nil && cp.Tier != nil {
		maxTiers = cp.Tier.MaxOverlayTiers
	}
	if maxTiers > 0 && len(existing) >= maxTiers {
		response.UnprocessableEntity(c, fmt.Sprintf("Batas overlay tier untuk tier kamu adalah %d. Upgrade untuk menambah.", maxTiers))
		return
	}
	t := &entity.OverlayTier{ID: uuid.New(), CreatorID: uid, MinCredits: req.MinCredits, ImageURL: req.ImageURL, SoundURL: req.SoundURL, Label: req.Label}
	if err := h.userRepo.CreateOverlayTier(c.Request.Context(), t); err != nil {
		response.InternalError(c)
		return
	}
	response.Created(c, t)
}

func (h *OverlayHandler) DeleteTier(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	if err := h.userRepo.DeleteOverlayTier(c.Request.Context(), id, getUserID(c)); err != nil {
		response.NotFound(c, "Tier tidak ditemukan")
		return
	}
	response.OKMessage(c, "deleted")
}

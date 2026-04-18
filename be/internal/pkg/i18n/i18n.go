package i18n

import (
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/yourpage/be/internal/pkg/i18n/locale"
)

type Translator interface {
	Tr(key string, params ...string) string
	Locale() string
}

type I18n struct {
	mu       sync.RWMutex
	messages map[string]map[string]string
	defaults string
}

var (
	defaultI18n *I18n
	once        sync.Once
)

func Init(localesPath string) *I18n {
	once.Do(func() {
		defaultI18n = New(localesPath)
	})
	return defaultI18n
}

func New(localesPath string) *I18n {
	i := &I18n{
		messages: make(map[string]map[string]string),
		defaults: "id",
	}

	i.loadLocales(localesPath)

	return i
}

func (i *I18n) loadLocales(path string) {
	i.messages["id"] = mergeMaps(
		locale.IndonesianAuth,
		locale.IndonesianCommon,
		locale.IndonesianValidation,
		locale.IndonesianErrors,
		locale.IndonesianPosts,
		locale.IndonesianProducts,
		locale.IndonesianDonations,
		locale.IndonesianWallet,
		locale.IndonesianFollow,
		locale.IndonesianChat,
		locale.IndonesianMembership,
		locale.IndonesianOverlay,
		locale.IndonesianReferral,
		locale.IndonesianBroadcast,
		locale.IndonesianKYC,
		locale.IndonesianAdmin,
		locale.IndonesianNotifications,
		locale.IndonesianTime,
		locale.IndonesianCurrency,
	)

	i.messages["en"] = mergeMaps(
		locale.EnglishAuth,
		locale.EnglishCommon,
		locale.EnglishValidation,
		locale.EnglishErrors,
		locale.EnglishPosts,
		locale.EnglishProducts,
		locale.EnglishDonations,
		locale.EnglishWallet,
		locale.EnglishFollow,
		locale.EnglishChat,
		locale.EnglishMembership,
		locale.EnglishOverlay,
		locale.EnglishReferral,
		locale.EnglishBroadcast,
		locale.EnglishKYC,
		locale.EnglishAdmin,
		locale.EnglishNotifications,
		locale.EnglishTime,
		locale.EnglishCurrency,
	)
}

func mergeMaps(maps ...map[string]string) map[string]string {
	result := make(map[string]string)
	for _, m := range maps {
		for k, v := range m {
			result[k] = v
		}
	}
	return result
}

func (i *I18n) Tr(localeCode, key string, params ...string) string {
	i.mu.RLock()
	defer i.mu.RUnlock()

	if localeCode == "" {
		localeCode = i.defaults
	}

	lang, ok := i.messages[localeCode]
	if !ok {
		lang = i.messages[i.defaults]
	}

	value, found := lang[key]
	if !found {
		return key
	}

	for _, param := range params {
		value = strings.Replace(value, "%s", param, 1)
	}

	return value
}

func (i *I18n) GetLocale(c *gin.Context) string {
	header := c.GetHeader("Accept-Language")
	if header != "" {
		parts := strings.Split(header, ",")
		if len(parts) > 0 {
			lang := strings.TrimSpace(strings.Split(parts[0], ";")[0])
			lang = strings.ToLower(lang)
			if lang == "en" || lang == "en-us" {
				return "en"
			}
		}
	}

	query := c.Query("lang")
	if query != "" {
		query = strings.ToLower(query)
		if query == "en" || query == "id" {
			return query
		}
	}

	user, exists := c.Get("user")
	if exists {
		if u, ok := user.(*Claims); ok {
			if u.Locale != "" {
				return u.Locale
			}
		}
	}

	return "id"
}

func GetLocale(c *gin.Context) string {
	if defaultI18n == nil {
		return "id"
	}
	return defaultI18n.GetLocale(c)
}

func Tr(c *gin.Context, key string, params ...string) string {
	if defaultI18n == nil {
		return key
	}
	localeCode := GetLocale(c)
	return defaultI18n.Tr(localeCode, key, params...)
}

func TrFor(localeCode string, key string, params ...string) string {
	if defaultI18n == nil {
		return key
	}
	return defaultI18n.Tr(localeCode, key, params...)
}

func (i *I18n) SetDefault(localeCode string) {
	i.defaults = localeCode
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Locale   string `json:"locale,omitempty"`
	Exp      int64  `json:"exp"`
}

func DetectLanguage(c *gin.Context) string {
	if defaultI18n == nil {
		return "id"
	}
	return defaultI18n.GetLocale(c)
}

func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		localeCode := DetectLanguage(c)
		c.Set("locale", localeCode)
		c.Next()
	}
}

func AcceptLanguageMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.Request.Header.Get("Accept-Language")
		localeCode := "id"

		if header != "" {
			parts := strings.Split(header, ",")
			if len(parts) > 0 {
				lang := strings.TrimSpace(strings.Split(parts[0], ";")[0])
				lang = strings.ToLower(lang)
				if strings.HasPrefix(lang, "en") {
					localeCode = "en"
				}
			}
		}

		c.Set("Accept-Language", localeCode)
		c.Header("Content-Language", localeCode)
		c.Next()
	}
}

func LanguageNotFoundHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotAcceptable, gin.H{
			"success": false,
			"error":   "language_not_supported",
			"message": "Language not supported. Supported: en, id",
		})
		c.Abort()
	}
}
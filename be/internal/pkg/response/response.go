package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourpage/be/internal/pkg/i18n"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data"`
	NextCursor *string     `json:"next_cursor"`
	Total      *int64      `json:"total,omitempty"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{Success: true, Data: data})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{Success: true, Data: data})
}

func OKMessage(c *gin.Context, message string) {
	c.JSON(http.StatusOK, Response{Success: true, Message: message})
}

func Paginated(c *gin.Context, data interface{}, nextCursor *string) {
	c.JSON(http.StatusOK, PaginatedResponse{
		Success:    true,
		Data:       data,
		NextCursor: nextCursor,
	})
}

func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, Response{Success: false, Error: message})
}

func Unauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, Response{Success: false, Error: "Sesi tidak valid. Silakan login kembali."})
}

func Forbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, Response{Success: false, Error: "Kamu tidak memiliki akses untuk ini."})
}

func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, Response{Success: false, Error: message})
}

func Conflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, Response{Success: false, Error: message})
}

func InternalError(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, Response{Success: false, Error: "Terjadi kesalahan. Silakan coba lagi nanti."})
}

func UnprocessableEntity(c *gin.Context, message string) {
	c.JSON(http.StatusUnprocessableEntity, Response{Success: false, Error: message})
}

func LocalizedBadRequest(c *gin.Context, key string, params ...string) {
	msg := i18n.Tr(c, key, params...)
	c.JSON(http.StatusBadRequest, Response{Success: false, Error: msg})
}

func LocalizedUnauthorized(c *gin.Context, key string, params ...string) {
	msg := i18n.Tr(c, key, params...)
	c.JSON(http.StatusUnauthorized, Response{Success: false, Error: msg})
}

func LocalizedForbidden(c *gin.Context, key string, params ...string) {
	msg := i18n.Tr(c, key, params...)
	c.JSON(http.StatusForbidden, Response{Success: false, Error: msg})
}

func LocalizedNotFound(c *gin.Context, key string, params ...string) {
	msg := i18n.Tr(c, key, params...)
	c.JSON(http.StatusNotFound, Response{Success: false, Error: msg})
}

func LocalizedConflict(c *gin.Context, key string, params ...string) {
	msg := i18n.Tr(c, key, params...)
	c.JSON(http.StatusConflict, Response{Success: false, Error: msg})
}

func LocalizedInternalError(c *gin.Context, key string, params ...string) {
	msg := i18n.Tr(c, key, params...)
	c.JSON(http.StatusInternalServerError, Response{Success: false, Error: msg})
}

package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/service"
)

type ChatHandler struct {
	svc service.ChatService
}

func NewChatHandler(svc service.ChatService) *ChatHandler {
	return &ChatHandler{svc: svc}
}

func (h *ChatHandler) ListConversations(c *gin.Context) {
	convs, err := h.svc.ListConversations(c.Request.Context(), getUserID(c))
	if err != nil { handleServiceError(c, err); return }
	response.OK(c, convs)
}

func (h *ChatHandler) GetMessages(c *gin.Context) {
	convID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid conversation id"); return }
	limit := 50
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 && l <= 100 { limit = l }
	msgs, err := h.svc.GetMessages(c.Request.Context(), getUserID(c), convID, limit)
	if err != nil { handleServiceError(c, err); return }
	response.OK(c, msgs)
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	var req service.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, "content required"); return }
	msg, err := h.svc.SendMessage(c.Request.Context(), getUserID(c), req)
	if err != nil { handleServiceError(c, err); return }
	response.Created(c, msg)
}

func (h *ChatHandler) MarkRead(c *gin.Context) {
	convID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid conversation id"); return }
	if err := h.svc.MarkRead(c.Request.Context(), getUserID(c), convID); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "marked as read")
}

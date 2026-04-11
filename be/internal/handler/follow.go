package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/service"
)

type FollowHandler struct {
	svc service.FollowService
}

func NewFollowHandler(svc service.FollowService) *FollowHandler {
	return &FollowHandler{svc: svc}
}

func (h *FollowHandler) Follow(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}
	if err := h.svc.Follow(c.Request.Context(), getUserID(c), creatorID); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "followed")
}

func (h *FollowHandler) Unfollow(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}
	if err := h.svc.Unfollow(c.Request.Context(), getUserID(c), creatorID); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "unfollowed")
}

func (h *FollowHandler) IsFollowing(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}
	following, err := h.svc.IsFollowing(c.Request.Context(), getUserID(c), creatorID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, gin.H{"is_following": following})
}

func (h *FollowHandler) ListNotifications(c *gin.Context) {
	cursor, limit := parsePagination(c)
	notifs, next, err := h.svc.ListNotifications(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, notifs, uuidToString(next))
}

func (h *FollowHandler) CountUnread(c *gin.Context) {
	count, err := h.svc.CountUnread(c.Request.Context(), getUserID(c))
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, gin.H{"unread_count": count})
}

func (h *FollowHandler) MarkRead(c *gin.Context) {
	notifID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid notification id")
		return
	}
	if err := h.svc.MarkRead(c.Request.Context(), notifID, getUserID(c)); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "marked as read")
}

func (h *FollowHandler) MarkAllRead(c *gin.Context) {
	if err := h.svc.MarkAllRead(c.Request.Context(), getUserID(c)); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "all marked as read")
}

func (h *FollowHandler) DeleteNotification(c *gin.Context) {
	notifID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid notification id"); return }
	if err := h.svc.DeleteNotification(c.Request.Context(), notifID, getUserID(c)); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "notification deleted")
}

func (h *FollowHandler) DeleteReadNotifications(c *gin.Context) {
	if err := h.svc.DeleteReadNotifications(c.Request.Context(), getUserID(c)); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "read notifications deleted")
}

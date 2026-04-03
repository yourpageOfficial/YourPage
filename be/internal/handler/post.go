package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/handler/middleware"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/pkg/validator"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/entity"
)

type PostHandler struct {
	svc      service.PostService
	validate *validator.Validator
}

func NewPostHandler(svc service.PostService) *PostHandler {
	return &PostHandler{svc: svc, validate: validator.New()}
}

func (h *PostHandler) Create(c *gin.Context) {
	var req service.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if errs := h.validate.Validate(req); errs != nil {
		response.BadRequest(c, formatValidationErrors(errs))
		return
	}
	post, err := h.svc.Create(c.Request.Context(), getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, post)
}

func (h *PostHandler) GetByID(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid post id")
		return
	}
	viewerID := optionalUserID(c)
	post, err := h.svc.GetByID(c.Request.Context(), postID, viewerID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	_ = h.svc.IncrementView(c.Request.Context(), postID)
	response.OK(c, post)
}

func (h *PostHandler) Update(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid post id")
		return
	}
	var req service.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	post, err := h.svc.Update(c.Request.Context(), postID, getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.OK(c, post)
}

func (h *PostHandler) Delete(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid post id")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), postID, getUserID(c)); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "post deleted")
}

func (h *PostHandler) ListByCreator(c *gin.Context) {
	creatorID, err := uuid.Parse(c.Param("creatorId"))
	if err != nil {
		response.BadRequest(c, "invalid creator id")
		return
	}
	cursor, limit := parsePagination(c)
	status := c.Query("status")
	viewerID := optionalUserID(c)
	posts, nextCursor, err := h.svc.List(c.Request.Context(), creatorID, status, cursor, limit, viewerID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, posts, uuidToString(nextCursor))
}

func (h *PostHandler) Feed(c *gin.Context) {
	cursor, limit := parsePagination(c)
	posts, nextCursor, err := h.svc.Feed(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, posts, uuidToString(nextCursor))
}

func (h *PostHandler) AddMedia(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid post id")
		return
	}
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "file is required")
		return
	}
	defer file.Close()

	mediaType := entity.MediaType(c.PostForm("media_type"))
	switch mediaType {
	case entity.MediaTypeImage, entity.MediaTypeVideo, entity.MediaTypeAudio, entity.MediaTypeDocument:
	default:
		response.BadRequest(c, "invalid media_type")
		return
	}
	sortOrder, _ := strconv.Atoi(c.PostForm("sort_order"))

	req := service.AddMediaRequest{
		File:        file,
		FileName:    header.Filename,
		FileSize:    header.Size,
		ContentType: header.Header.Get("Content-Type"),
		MediaType:   mediaType,
		SortOrder:   sortOrder,
	}

	media, err := h.svc.AddMedia(c.Request.Context(), postID, getUserID(c), req)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Created(c, media)
}

func (h *PostHandler) DeleteMedia(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid post id")
		return
	}
	mediaID, err := uuid.Parse(c.Param("mediaId"))
	if err != nil {
		response.BadRequest(c, "invalid media id")
		return
	}
	if err := h.svc.DeleteMedia(c.Request.Context(), mediaID, postID, getUserID(c)); err != nil {
		handleServiceError(c, err)
		return
	}
	response.OKMessage(c, "media deleted")
}

func (h *PostHandler) LikePost(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid post id"); return }
	if err := h.svc.LikePost(c.Request.Context(), postID, getUserID(c)); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "liked")
}

func (h *PostHandler) UnlikePost(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid post id"); return }
	if err := h.svc.UnlikePost(c.Request.Context(), postID, getUserID(c)); err != nil {
		handleServiceError(c, err); return
	}
	response.OKMessage(c, "unliked")
}

func (h *PostHandler) CreateComment(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid post id"); return }
	var body struct { Content string `json:"content" validate:"required,max=1000"` }
	if err := c.ShouldBindJSON(&body); err != nil { response.BadRequest(c, "content is required"); return }
	comment, err := h.svc.CreateComment(c.Request.Context(), postID, getUserID(c), body.Content)
	if err != nil { handleServiceError(c, err); return }
	response.Created(c, comment)
}

func (h *PostHandler) ListComments(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid post id"); return }
	cursor, limit := parsePagination(c)
	comments, next, err := h.svc.ListComments(c.Request.Context(), postID, cursor, limit)
	if err != nil { handleServiceError(c, err); return }
	response.Paginated(c, comments, uuidToString(next))
}

func (h *PostHandler) ListPurchased(c *gin.Context) {
	cursor, limit := parsePagination(c)
	posts, next, err := h.svc.ListPurchased(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	response.Paginated(c, posts, uuidToString(next))
}

// ------------------------------------------------------------------ helpers

func optionalUserID(c *gin.Context) *uuid.UUID {
	val, exists := c.Get(middleware.ContextKeyUserID)
	if !exists {
		return nil
	}
	id := val.(uuid.UUID)
	return &id
}

func parsePagination(c *gin.Context) (*uuid.UUID, int) {
	var cursor *uuid.UUID
	if cursorStr := c.Query("cursor"); cursorStr != "" {
		if id, err := uuid.Parse(cursorStr); err == nil {
			cursor = &id
		}
	}
	limit := 20
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	return cursor, limit
}

func uuidToString(id *uuid.UUID) *string {
	if id == nil {
		return nil
	}
	s := id.String()
	return &s
}

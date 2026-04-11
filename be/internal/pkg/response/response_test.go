package response_test

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yourpage/be/internal/pkg/response"
)

func init() { gin.SetMode(gin.TestMode) }

func TestOK(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	response.OK(c, gin.H{"key": "value"})
	if w.Code != 200 { t.Errorf("got %d, want 200", w.Code) }
	var r response.Response
	json.Unmarshal(w.Body.Bytes(), &r)
	if !r.Success { t.Error("expected success=true") }
}

func TestBadRequest(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	response.BadRequest(c, "invalid")
	if w.Code != 400 { t.Errorf("got %d, want 400", w.Code) }
}

func TestNotFound(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	response.NotFound(c, "not found")
	if w.Code != 404 { t.Errorf("got %d, want 404", w.Code) }
}

func TestPaginated(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	cursor := "abc"
	response.Paginated(c, []string{"a", "b"}, &cursor)
	if w.Code != 200 { t.Errorf("got %d, want 200", w.Code) }
	var r response.PaginatedResponse
	json.Unmarshal(w.Body.Bytes(), &r)
	if !r.Success { t.Error("expected success=true") }
	if r.NextCursor == nil || *r.NextCursor != "abc" { t.Error("expected cursor=abc") }
}

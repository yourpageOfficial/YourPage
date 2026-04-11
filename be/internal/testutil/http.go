package testutil

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
)

func init() { gin.SetMode(gin.TestMode) }

// JSONRequest creates an HTTP request with JSON body.
func JSONRequest(method, path string, body interface{}) *http.Request {
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(method, path, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	return req
}

// AuthRequest creates an HTTP request with Authorization header.
func AuthRequest(method, path, token string, body interface{}) *http.Request {
	req := JSONRequest(method, path, body)
	req.Header.Set("Authorization", "Bearer "+token)
	return req
}

// ParseResponse unmarshals the response body into dest.
func ParseResponse(w *httptest.ResponseRecorder, dest interface{}) error {
	return json.Unmarshal(w.Body.Bytes(), dest)
}

package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/entity"
	"github.com/yourpage/be/internal/handler"
	"github.com/yourpage/be/internal/handler/middleware"
	"github.com/yourpage/be/internal/service"
	"github.com/yourpage/be/internal/testutil"
)

func init() { gin.SetMode(gin.TestMode) }

// setupPaymentRouter creates a minimal router with checkout endpoints for testing
func setupPaymentRouter() (*gin.Engine, *testutil.MockWalletRepo, *testutil.MockPostRepo) {
	walletRepo := testutil.NewMockWalletRepo()
	postRepo := testutil.NewMockPostRepo()
	productRepo := testutil.NewMockProductRepo()
	donationRepo := testutil.NewMockDonationRepo()
	paymentRepo := testutil.NewMockPaymentRepo()
	userRepo := testutil.NewMockUserRepo()
	followRepo := testutil.NewMockFollowRepo()
	platformRepo := testutil.NewMockPlatformRepo()

	paymentSvc := service.NewPaymentService(
		paymentRepo, postRepo, productRepo, donationRepo,
		walletRepo, userRepo, followRepo, platformRepo,
		testutil.MockMailer{},
	)

	paymentHandler := handler.NewPaymentHandler(paymentSvc, userRepo)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		// Inject auth context for tests
		if uid := c.GetHeader("X-Test-UserID"); uid != "" {
			id, _ := uuid.Parse(uid)
			c.Set(middleware.ContextKeyUserID, id)
			c.Set(middleware.ContextKeyRole, entity.UserRole("supporter"))
		}
		c.Next()
	})

	api := r.Group("/api/v1")
	checkout := api.Group("/checkout")
	{
		checkout.POST("/post", paymentHandler.CheckoutPost)
		checkout.POST("/product", paymentHandler.CheckoutProduct)
		checkout.POST("/donation", paymentHandler.CheckoutDonation)
	}

	return r, walletRepo, postRepo
}

func TestCheckoutPostHandler_InvalidBody(t *testing.T) {
	r, _, _ := setupPaymentRouter()

	w := httptest.NewRecorder()
	req := testutil.JSONRequest("POST", "/api/v1/checkout/post", map[string]string{"invalid": "body"})
	req.Header.Set("X-Test-UserID", uuid.New().String())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("got %d, want 400", w.Code)
	}
}

func TestCheckoutPostHandler_PostNotFound(t *testing.T) {
	r, _, _ := setupPaymentRouter()

	w := httptest.NewRecorder()
	req := testutil.JSONRequest("POST", "/api/v1/checkout/post", map[string]interface{}{
		"post_id": uuid.New().String(),
	})
	req.Header.Set("X-Test-UserID", uuid.New().String())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("got %d, want 404", w.Code)
	}
}

func TestCheckoutPostHandler_Success(t *testing.T) {
	r, walletRepo, postRepo := setupPaymentRouter()

	creatorID := uuid.New()
	buyerID := uuid.New()
	price := int64(5000)
	postID := uuid.New()

	postRepo.Posts[postID] = &entity.Post{
		ID: postID, CreatorID: creatorID, AccessType: entity.PostAccessPaid,
		Price: &price, Status: entity.PostStatusPublished,
	}
	walletRepo.Wallets[buyerID] = 100

	w := httptest.NewRecorder()
	req := testutil.JSONRequest("POST", "/api/v1/checkout/post", map[string]interface{}{
		"post_id": postID.String(),
	})
	req.Header.Set("X-Test-UserID", buyerID.String())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("got %d, want 201. body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["success"] != true {
		t.Error("expected success=true")
	}
}

func TestCheckoutPostHandler_InsufficientCredits(t *testing.T) {
	r, walletRepo, postRepo := setupPaymentRouter()

	creatorID := uuid.New()
	buyerID := uuid.New()
	price := int64(50000)
	postID := uuid.New()

	postRepo.Posts[postID] = &entity.Post{
		ID: postID, CreatorID: creatorID, AccessType: entity.PostAccessPaid,
		Price: &price, Status: entity.PostStatusPublished,
	}
	walletRepo.Wallets[buyerID] = 5 // only 5 credits, need 50

	w := httptest.NewRecorder()
	req := testutil.JSONRequest("POST", "/api/v1/checkout/post", map[string]interface{}{
		"post_id": postID.String(),
	})
	req.Header.Set("X-Test-UserID", buyerID.String())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("got %d, want 422", w.Code)
	}
}

func TestCheckoutDonationHandler_SelfDonation(t *testing.T) {
	r, walletRepo, _ := setupPaymentRouter()

	userID := uuid.New()
	walletRepo.Wallets[userID] = 100

	w := httptest.NewRecorder()
	req := testutil.JSONRequest("POST", "/api/v1/checkout/donation", map[string]interface{}{
		"creator_id": userID.String(),
		"amount_idr": 5000,
		"donor_name": "Test",
	})
	req.Header.Set("X-Test-UserID", userID.String())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("got %d, want 403", w.Code)
	}
}

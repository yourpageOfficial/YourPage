package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourpage/be/internal/pkg/response"
	"github.com/yourpage/be/internal/service"
)

type WalletHandler struct {
	svc service.WalletService
}

func NewWalletHandler(svc service.WalletService) *WalletHandler {
	return &WalletHandler{svc: svc}
}

func (h *WalletHandler) GetBalance(c *gin.Context) {
	wallet, err := h.svc.GetBalance(c.Request.Context(), getUserID(c))
	if err != nil { handleServiceError(c, err); return }
	response.OK(c, wallet)
}

func (h *WalletHandler) ListTransactions(c *gin.Context) {
	cursor, limit := parsePagination(c)
	txs, next, err := h.svc.ListTransactions(c.Request.Context(), getUserID(c), cursor, limit)
	if err != nil { handleServiceError(c, err); return }
	response.Paginated(c, txs, uuidToString(next))
}

// Step 1: Create topup → returns unique code + amount
func (h *WalletHandler) CreateTopup(c *gin.Context) {
	amountStr := c.PostForm("amount_idr")
	if amountStr == "" {
		var body struct {
			AmountIDR interface{} `json:"amount_idr"`
		}
		if err := c.ShouldBindJSON(&body); err == nil && body.AmountIDR != nil {
			amountStr = fmt.Sprintf("%v", body.AmountIDR)
		}
	}
	if amountStr == "" { response.BadRequest(c, "amount_idr is required"); return }

	topup, err := h.svc.CreateTopupRequest(c.Request.Context(), getUserID(c), amountStr)
	if err != nil { handleServiceError(c, err); return }
	response.Created(c, topup)
}

// Step 2: Upload proof for existing topup
func (h *WalletHandler) UploadTopupProof(c *gin.Context) {
	topupID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.BadRequest(c, "invalid topup id"); return }

	donorName := c.PostForm("donor_name")
	if donorName == "" { response.BadRequest(c, "donor_name is required"); return }

	file, header, err := c.Request.FormFile("proof")
	if err != nil { response.BadRequest(c, "proof image is required"); return }
	defer file.Close()

	topup, err := h.svc.UploadTopupProof(c.Request.Context(), getUserID(c), topupID, donorName, file, header.Size, header.Header.Get("Content-Type"))
	if err != nil { handleServiceError(c, err); return }
	response.OK(c, topup)
}

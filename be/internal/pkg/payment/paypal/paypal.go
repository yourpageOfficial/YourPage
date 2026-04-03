package paypal

import (
	"context"
	"fmt"

	pp "github.com/plutov/paypal/v4"
	"github.com/yourpage/be/internal/config"
)

type Client struct {
	client *pp.Client
}

func New(cfg config.PayPalConfig) (*Client, error) {
	apiBase := pp.APIBaseSandBox
	if cfg.Mode == "live" {
		apiBase = pp.APIBaseLive
	}
	c, err := pp.NewClient(cfg.ClientID, cfg.ClientSecret, apiBase)
	if err != nil {
		return nil, fmt.Errorf("paypal: init: %w", err)
	}
	_, err = c.GetAccessToken(context.Background())
	if err != nil {
		return nil, fmt.Errorf("paypal: get token: %w", err)
	}
	return &Client{client: c}, nil
}

func (c *Client) CreateOrder(ctx context.Context, amountIDR int64, description, returnURL, cancelURL string) (orderID, approveURL string, err error) {
	order, err := c.client.CreateOrder(ctx, pp.OrderIntentCapture, []pp.PurchaseUnitRequest{
		{
			Amount:      &pp.PurchaseUnitAmount{Currency: "IDR", Value: fmt.Sprintf("%d", amountIDR)},
			Description: description,
		},
	}, nil, &pp.ApplicationContext{ReturnURL: returnURL, CancelURL: cancelURL})
	if err != nil {
		return "", "", fmt.Errorf("paypal: create order: %w", err)
	}
	for _, link := range order.Links {
		if link.Rel == "approve" {
			approveURL = link.Href
		}
	}
	return order.ID, approveURL, nil
}

func (c *Client) CaptureOrder(ctx context.Context, orderID string) error {
	_, err := c.client.CaptureOrder(ctx, orderID, pp.CaptureOrderRequest{})
	if err != nil {
		return fmt.Errorf("paypal: capture: %w", err)
	}
	return nil
}

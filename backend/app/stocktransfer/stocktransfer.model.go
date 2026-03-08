package stocktransfer

import (
	"hris_backend/entity"
	"time"
)

type StockTransferItemResponse struct {
	ID          string `json:"id"`
	ProductID   string `json:"productId"`
	ProductName string `json:"productName"`
	Qty         int    `json:"qty"`
}

type StockTransferResponse struct {
	ID                 string                      `json:"id"`
	TransferNumber     string                      `json:"transferNumber"`
	SourceLocationID   string                      `json:"sourceLocationId"`
	SourceLocationName string                      `json:"sourceLocationName"`
	DestLocationID     string                      `json:"destLocationId"`
	DestLocationName   string                      `json:"destLocationName"`
	Status             entity.StockTransferStatus  `json:"status"`
	Note               *string                     `json:"note"`
	CreatedByID        string                      `json:"createdById"`
	CreatedByName      string                      `json:"createdByName"`
	Items              []StockTransferItemResponse `json:"items"`
	CreatedAt          time.Time                   `json:"createdAt"`
}

type CreateTransferItemRequest struct {
	ProductID string `json:"productId" validate:"required"`
	Qty       int    `json:"qty" validate:"required,min=1"`
}

type CreateTransferRequest struct {
	SourceLocationID string                      `json:"sourceLocationId" validate:"required"`
	DestLocationID   string                      `json:"destLocationId" validate:"required"`
	Note             *string                     `json:"note"`
	Items            []CreateTransferItemRequest `json:"items" validate:"required,min=1,dive"`
}

type UpdateTransferStatusRequest struct {
	Status entity.StockTransferStatus `json:"status" validate:"required,oneof=PENDING COMPLETED CANCELLED"`
}

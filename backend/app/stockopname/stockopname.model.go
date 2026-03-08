package stockopname

import (
	"hris_backend/entity"
	"time"
)

type StockOpnameItemResponse struct {
	ID          string `json:"id"`
	ProductID   string `json:"productId"`
	ProductName string `json:"productName"`
	QtySystem   int    `json:"qtySystem"`
	QtyActual   int    `json:"qtyActual"`
	QtyDelta    int    `json:"qtyDelta"`
}

type StockOpnameResponse struct {
	ID            string                    `json:"id"`
	OpnameNumber  string                    `json:"opnameNumber"`
	LocationID    string                    `json:"locationId"`
	LocationName  string                    `json:"locationName"`
	Status        entity.StockOpnameStatus  `json:"status"`
	Note          *string                   `json:"note"`
	CreatedByID   string                    `json:"createdById"`
	CreatedByName string                    `json:"createdByName"`
	Items         []StockOpnameItemResponse `json:"items"`
	CreatedAt     time.Time                 `json:"createdAt"`
}

type CreateOpnameItemRequest struct {
	ProductID string `json:"productId" validate:"required"`
	QtySystem int    `json:"qtySystem" validate:"required"`
	QtyActual int    `json:"qtyActual" validate:"required"`
}

type CreateOpnameRequest struct {
	LocationID string                    `json:"locationId" validate:"required"`
	Note       *string                   `json:"note"`
	Items      []CreateOpnameItemRequest `json:"items" validate:"required,min=1,dive"`
}

type UpdateOpnameStatusRequest struct {
	Status entity.StockOpnameStatus `json:"status" validate:"required,oneof=DRAFT COMPLETED CANCELLED"`
}

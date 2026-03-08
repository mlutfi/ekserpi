package purchaseorder

import (
	"hris_backend/entity"
	"time"
)

type PurchaseOrderItemResponse struct {
	ID          string `json:"id"`
	ProductID   string `json:"productId"`
	ProductName string `json:"productName"`
	QtyOrdered  int    `json:"qtyOrdered"`
	QtyReceived int    `json:"qtyReceived"`
	CostPerUnit int    `json:"costPerUnit"`
	Subtotal    int    `json:"subtotal"`
}

type PurchaseOrderResponse struct {
	ID            string                      `json:"id"`
	PONumber      string                      `json:"poNumber"`
	SupplierID    string                      `json:"supplierId"`
	SupplierName  string                      `json:"supplierName"`
	LocationID    string                      `json:"locationId"`
	LocationName  string                      `json:"locationName"`
	Status        entity.POStatus             `json:"status"`
	TotalAmount   int                         `json:"totalAmount"`
	Note          *string                     `json:"note"`
	OrderDate     time.Time                   `json:"orderDate"`
	CreatedByID   string                      `json:"createdById"`
	CreatedByName string                      `json:"createdByName"`
	Items         []PurchaseOrderItemResponse `json:"items"`
	CreatedAt     time.Time                   `json:"createdAt"`
}

type CreatePOItemRequest struct {
	ProductID   string `json:"productId" validate:"required"`
	QtyOrdered  int    `json:"qtyOrdered" validate:"required,min=1"`
	CostPerUnit int    `json:"costPerUnit" validate:"required,min=0"`
}

type CreatePORequest struct {
	SupplierID string                `json:"supplierId" validate:"required"`
	LocationID string                `json:"locationId" validate:"required"`
	OrderDate  time.Time             `json:"orderDate" validate:"required"`
	Note       *string               `json:"note"`
	Items      []CreatePOItemRequest `json:"items" validate:"required,min=1,dive"`
}

type UpdatePOStatusRequest struct {
	Status entity.POStatus `json:"status" validate:"required,oneof=DRAFT PENDING COMPLETED CANCELLED"`
}

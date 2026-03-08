package stock

import (
	"hris_backend/entity"
	"time"
)

type StockInRequest struct {
	ProductID       string  `json:"productId" validate:"required"`
	LocationID      string  `json:"locationId" validate:"required"`
	SupplierID      *string `json:"supplierId"`
	PurchaseOrderID *string `json:"purchaseOrderId"`
	Qty             int     `json:"qty" validate:"required,gt=0"`
	CostPerUnit     int     `json:"costPerUnit" validate:"required,min=0"`
	Note            string  `json:"note"`
	ExpiryDate      *string `json:"expiryDate"`
	BatchNumber     *string `json:"batchNumber"`
}

type StockInResponse struct {
	ID                  string     `json:"id"`
	ProductID           string     `json:"productId"`
	ProductName         string     `json:"productName"`
	LocationID          string     `json:"locationId"`
	LocationName        string     `json:"locationName"`
	SupplierID          *string    `json:"supplierId"`
	SupplierName        *string    `json:"supplierName"`
	PurchaseOrderID     *string    `json:"purchaseOrderId"`
	PurchaseOrderNumber *string    `json:"purchaseOrderNumber"`
	Qty                 int        `json:"qty"`
	CostPerUnit         int        `json:"costPerUnit"`
	Note                string     `json:"note"`
	ExpiryDate          *time.Time `json:"expiryDate"`
	BatchNumber         *string    `json:"batchNumber"`
	CreatedBy           string     `json:"createdBy"`
	CreatedAt           string     `json:"createdAt"`
}

type StockOutRequest struct {
	ProductID  string `json:"productId" validate:"required"`
	LocationID string `json:"locationId" validate:"required"`
	Qty        int    `json:"qty" validate:"required,gt=0"`
	Reason     string `json:"reason" validate:"required,oneof=REFUND EXPIRED DAMAGED OTHER"`
	Note       string `json:"note"`
}

type StockOutResponse struct {
	ID           string `json:"id"`
	ProductID    string `json:"productId"`
	ProductName  string `json:"productName"`
	LocationID   string `json:"locationId"`
	LocationName string `json:"locationName"`
	Qty          int    `json:"qty"`
	Reason       string `json:"reason"`
	Note         string `json:"note"`
	CreatedBy    string `json:"createdBy"`
	CreatedAt    string `json:"createdAt"`
}

type InventoryResponse struct {
	ProductID    string  `json:"productId"`
	ProductName  string  `json:"productName"`
	Category     string  `json:"category"`
	SKU          string  `json:"sku"`
	LocationID   string  `json:"locationId"`
	LocationName string  `json:"locationName"`
	QtyOnHand    int     `json:"qtyOnHand"`
	AvgCost      int     `json:"avgCost"`
	ExpiryDate   *string `json:"expiryDate"`
	BatchNumber  *string `json:"batchNumber"`
}

// ToStockInResponse mapper
func ToStockInResponse(s *entity.StockIn) *StockInResponse {
	productName := ""
	if s.Product != nil {
		productName = s.Product.Name
	}
	locationName := ""
	if s.Location != nil {
		locationName = s.Location.Name
	}
	var supplierName *string
	if s.Supplier != nil {
		supplierName = &s.Supplier.Name
	}
	var poNumber *string
	if s.PurchaseOrder != nil {
		poNumber = &s.PurchaseOrder.PONumber
	}
	createdBy := ""
	if s.CreatedBy != nil {
		createdBy = s.CreatedBy.Name
	}
	note := ""
	if s.Note != nil {
		note = *s.Note
	}
	var expiryDate *time.Time
	if s.ExpiryDate != nil {
		expiryDate = s.ExpiryDate
	}
	var batchNumber *string
	if s.BatchNumber != nil {
		batchNumber = s.BatchNumber
	}
	return &StockInResponse{
		ID:                  s.ID,
		ProductID:           s.ProductID,
		ProductName:         productName,
		LocationID:          s.LocationID,
		LocationName:        locationName,
		SupplierID:          s.SupplierID,
		SupplierName:        supplierName,
		PurchaseOrderID:     s.PurchaseOrderID,
		PurchaseOrderNumber: poNumber,
		Qty:                 s.Qty,
		CostPerUnit:         s.CostPerUnit,
		Note:                note,
		ExpiryDate:          expiryDate,
		BatchNumber:         batchNumber,
		CreatedBy:           createdBy,
		CreatedAt:           s.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

// ToStockOutResponse mapper
func ToStockOutResponse(s *entity.StockOut) *StockOutResponse {
	productName := ""
	if s.Product != nil {
		productName = s.Product.Name
	}
	locationName := ""
	if s.Location != nil {
		locationName = s.Location.Name
	}
	createdBy := ""
	if s.CreatedBy != nil {
		createdBy = s.CreatedBy.Name
	}
	note := ""
	if s.Note != nil {
		note = *s.Note
	}
	return &StockOutResponse{
		ID:           s.ID,
		ProductID:    s.ProductID,
		ProductName:  productName,
		LocationID:   s.LocationID,
		LocationName: locationName,
		Qty:          s.Qty,
		Reason:       string(s.Reason),
		Note:         note,
		CreatedBy:    createdBy,
		CreatedAt:    s.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

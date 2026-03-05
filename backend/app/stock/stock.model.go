package stock

import "hris_backend/entity"

type StockInRequest struct {
	ProductID   string `json:"productId" validate:"required"`
	Qty         int    `json:"qty" validate:"required,gt=0"`
	CostPerUnit int    `json:"costPerUnit" validate:"required,min=0"`
	Note        string `json:"note"`
}

type StockInResponse struct {
	ID          string `json:"id"`
	ProductID   string `json:"productId"`
	ProductName string `json:"productName"`
	Qty         int    `json:"qty"`
	CostPerUnit int    `json:"costPerUnit"`
	Note        string `json:"note"`
	CreatedBy   string `json:"createdBy"`
	CreatedAt   string `json:"createdAt"`
}

type StockOutRequest struct {
	ProductID string `json:"productId" validate:"required"`
	Qty       int    `json:"qty" validate:"required,gt=0"`
	Reason    string `json:"reason" validate:"required,oneof=REFUND EXPIRED DAMAGED OTHER"`
	Note      string `json:"note"`
}

type StockOutResponse struct {
	ID          string `json:"id"`
	ProductID   string `json:"productId"`
	ProductName string `json:"productName"`
	Qty         int    `json:"qty"`
	Reason      string `json:"reason"`
	Note        string `json:"note"`
	CreatedBy   string `json:"createdBy"`
	CreatedAt   string `json:"createdAt"`
}

type InventoryResponse struct {
	ProductID   string `json:"productId"`
	ProductName string `json:"productName"`
	Category    string `json:"category"`
	SKU         string `json:"sku"`
	QtyOnHand   int    `json:"qtyOnHand"`
}

// ToStockInResponse mapper
func ToStockInResponse(s *entity.StockIn) *StockInResponse {
	productName := ""
	if s.Product != nil {
		productName = s.Product.Name
	}
	createdBy := ""
	if s.CreatedBy != nil {
		createdBy = s.CreatedBy.Name
	}
	note := ""
	if s.Note != nil {
		note = *s.Note
	}
	return &StockInResponse{
		ID:          s.ID,
		ProductID:   s.ProductID,
		ProductName: productName,
		Qty:         s.Qty,
		CostPerUnit: s.CostPerUnit,
		Note:        note,
		CreatedBy:   createdBy,
		CreatedAt:   s.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

// ToStockOutResponse mapper
func ToStockOutResponse(s *entity.StockOut) *StockOutResponse {
	productName := ""
	if s.Product != nil {
		productName = s.Product.Name
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
		ID:          s.ID,
		ProductID:   s.ProductID,
		ProductName: productName,
		Qty:         s.Qty,
		Reason:      string(s.Reason),
		Note:        note,
		CreatedBy:   createdBy,
		CreatedAt:   s.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

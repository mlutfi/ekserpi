package entity

import (
	"time"
)

type StockMovementType string

const (
	StockMovementTypeSale       StockMovementType = "SALE"
	StockMovementTypeAdjustment StockMovementType = "ADJUSTMENT"
	StockMovementTypeRestock    StockMovementType = "RESTOCK"
	StockMovementTypeRefund     StockMovementType = "REFUND"
)

func (StockMovementType) GormDataType() string {
	return "varchar(20)"
}

type StockMovement struct {
	ID        string            `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	ProductID string            `gorm:"column:product_id;type:varchar(255);not null;index:idx_stock_movements_product_created" json:"productId"`
	Type      StockMovementType `gorm:"column:type;type:varchar(20);not null;index:idx_stock_movements_type_created" json:"type"`
	QtyDelta  int               `gorm:"column:qty_delta;not null" json:"qtyDelta"`
	RefSaleID *string           `gorm:"column:ref_sale_id;type:varchar(255);index" json:"refSaleId"`
	Note      *string           `gorm:"column:note;type:text" json:"note"`
	CreatedAt time.Time         `gorm:"column:created_at;autoCreateTime;index:idx_stock_movements_product_created;index:idx_stock_movements_type_created" json:"createdAt"`

	// Relations
	Product *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:Restrict" json:"product,omitempty"`
}

func (StockMovement) TableName() string {
	return "stock_movements"
}

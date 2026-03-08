package entity

import (
	"time"
)

type StockMovementType string

const (
	StockMovementTypeSale        StockMovementType = "SALE"
	StockMovementTypeAdjustment  StockMovementType = "ADJUSTMENT" // Manual Adjustment / Opname
	StockMovementTypeRestock     StockMovementType = "RESTOCK"
	StockMovementTypeRefund      StockMovementType = "REFUND"
	StockMovementTypeTransferIn  StockMovementType = "TRANSFER_IN"
	StockMovementTypeTransferOut StockMovementType = "TRANSFER_OUT"
)

func (StockMovementType) GormDataType() string {
	return "varchar(20)"
}

type StockMovement struct {
	ID            string            `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	ProductID     string            `gorm:"column:product_id;type:varchar(255);not null;index:idx_stock_movements_product_created;index:idx_stock_movements_loc_prod" json:"productId"`
	LocationID    string            `gorm:"column:location_id;type:varchar(255);not null;index:idx_stock_movements_loc_prod" json:"locationId"`
	Type          StockMovementType `gorm:"column:type;type:varchar(20);not null;index:idx_stock_movements_type_created" json:"type"`
	QtyDelta      int               `gorm:"column:qty_delta;not null" json:"qtyDelta"`
	RefSaleID     *string           `gorm:"column:ref_sale_id;type:varchar(255);index" json:"refSaleId"`
	RefPOID       *string           `gorm:"column:ref_po_id;type:varchar(255);index" json:"refPoId"`
	RefTransferID *string           `gorm:"column:ref_transfer_id;type:varchar(255);index" json:"refTransferId"`
	RefOpnameID   *string           `gorm:"column:ref_opname_id;type:varchar(255);index" json:"refOpnameId"`
	Note          *string           `gorm:"column:note;type:text" json:"note"`
	CreatedAt     time.Time         `gorm:"column:created_at;autoCreateTime;index:idx_stock_movements_product_created;index:idx_stock_movements_type_created" json:"createdAt"`

	// Relations
	Product  *Product  `gorm:"foreignKey:ProductID;constraint:OnDelete:Restrict" json:"product,omitempty"`
	Location *Location `gorm:"foreignKey:LocationID;constraint:OnDelete:Restrict" json:"location,omitempty"`
}

func (StockMovement) TableName() string {
	return "stock_movements"
}

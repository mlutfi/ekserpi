package entity

import (
	"time"

	"gorm.io/gorm"
)

type StockIn struct {
	ID              string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	ProductID       string         `gorm:"column:product_id;type:varchar(255);not null;index" json:"productId"`
	LocationID      string         `gorm:"column:location_id;type:varchar(255);not null;index" json:"locationId"`
	SupplierID      *string        `gorm:"column:supplier_id;type:varchar(255);index" json:"supplierId"`
	PurchaseOrderID *string        `gorm:"column:purchase_order_id;type:varchar(255);index" json:"purchaseOrderId"`
	Qty             int            `gorm:"column:qty;not null;default:0" json:"qty"`
	CostPerUnit     int            `gorm:"column:cost_per_unit;not null;default:0" json:"costPerUnit"`
	Note            *string        `gorm:"column:note;type:text" json:"note"`
	ExpiryDate      *time.Time     `gorm:"column:expiry_date;index" json:"expiryDate"`
	BatchNumber     *string        `gorm:"column:batch_number;type:varchar(100);index" json:"batchNumber"`
	CreatedByID     string         `gorm:"column:created_by_id;type:varchar(255);not null;index" json:"createdById"`
	CreatedAt       time.Time      `gorm:"column:created_at;autoCreateTime;index" json:"createdAt"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Product       *Product       `gorm:"foreignKey:ProductID;constraint:OnDelete:Restrict" json:"product,omitempty"`
	Location      *Location      `gorm:"foreignKey:LocationID;constraint:OnDelete:Restrict" json:"location,omitempty"`
	Supplier      *Supplier      `gorm:"foreignKey:SupplierID;constraint:OnDelete:SET NULL" json:"supplier,omitempty"`
	PurchaseOrder *PurchaseOrder `gorm:"foreignKey:PurchaseOrderID;constraint:OnDelete:SET NULL" json:"purchaseOrder,omitempty"`
	CreatedBy     *User          `gorm:"foreignKey:CreatedByID;constraint:OnDelete:Restrict" json:"createdBy,omitempty"`
}

func (StockIn) TableName() string {
	return "stock_ins"
}

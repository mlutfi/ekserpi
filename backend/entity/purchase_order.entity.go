package entity

import (
	"time"

	"gorm.io/gorm"
)

type POStatus string

const (
	POStatusDraft     POStatus = "DRAFT"
	POStatusSent      POStatus = "SENT"
	POStatusCompleted POStatus = "COMPLETED"
	POStatusCancelled POStatus = "CANCELLED"
)

func (POStatus) GormDataType() string {
	return "varchar(20)"
}

type PurchaseOrder struct {
	ID          string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	PONumber    string         `gorm:"column:po_number;type:varchar(100);uniqueIndex;not null" json:"poNumber"`
	SupplierID  string         `gorm:"column:supplier_id;type:varchar(255);not null;index" json:"supplierId"`
	LocationID  string         `gorm:"column:location_id;type:varchar(255);not null;index" json:"locationId"`
	Status      POStatus       `gorm:"column:status;type:varchar(20);not null;default:'DRAFT';index" json:"status"`
	TotalAmount int            `gorm:"column:total_amount;not null;default:0" json:"totalAmount"`
	Note        *string        `gorm:"column:note;type:text" json:"note"`
	OrderDate   time.Time      `gorm:"column:order_date;not null;index" json:"orderDate"`
	CreatedByID string         `gorm:"column:created_by_id;type:varchar(255);not null" json:"createdById"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Supplier  *Supplier           `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Location  *Location           `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	CreatedBy *User               `gorm:"foreignKey:CreatedByID" json:"createdBy,omitempty"`
	Items     []PurchaseOrderItem `gorm:"foreignKey:PurchaseOrderID;constraint:OnDelete:Cascade" json:"items,omitempty"`
}

func (PurchaseOrder) TableName() string {
	return "purchase_orders"
}

type PurchaseOrderItem struct {
	ID              string `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	PurchaseOrderID string `gorm:"column:purchase_order_id;type:varchar(255);not null;index" json:"purchaseOrderId"`
	ProductID       string `gorm:"column:product_id;type:varchar(255);not null;index" json:"productId"`
	QtyOrdered      int    `gorm:"column:qty_ordered;not null" json:"qtyOrdered"`
	QtyReceived     int    `gorm:"column:qty_received;not null;default:0" json:"qtyReceived"`
	CostPerUnit     int    `gorm:"column:cost_per_unit;not null" json:"costPerUnit"`
	Subtotal        int    `gorm:"column:subtotal;not null" json:"subtotal"`

	// Relations
	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (PurchaseOrderItem) TableName() string {
	return "purchase_order_items"
}

package entity

import (
	"time"

	"gorm.io/gorm"
)

type SaleStatus string

const (
	SaleStatusPending   SaleStatus = "PENDING"
	SaleStatusPaid      SaleStatus = "PAID"
	SaleStatusCancelled SaleStatus = "CANCELLED"
)

func (SaleStatus) GormDataType() string {
	return "varchar(20)"
}

type Sale struct {
	ID           string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	CashierID    string         `gorm:"column:cashier_id;type:varchar(255);not null;index:idx_sales_cashier_created" json:"cashierId"`
	CustomerName *string        `gorm:"column:customer_name;type:varchar(255)" json:"customerName"`
	Status       SaleStatus     `gorm:"column:status;type:varchar(20);default:'PENDING';index:idx_sales_status_created" json:"status"`
	Total        int            `gorm:"column:total;default:0" json:"total"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime;index;index:idx_sales_cashier_created;index:idx_sales_status_created" json:"createdAt"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Cashier  *User      `gorm:"foreignKey:CashierID;constraint:OnDelete:Restrict" json:"cashier,omitempty"`
	Items    []SaleItem `gorm:"foreignKey:SaleID;constraint:OnDelete:Cascade" json:"items,omitempty"`
	Payments []Payment  `gorm:"foreignKey:SaleID;constraint:OnDelete:Cascade" json:"payments,omitempty"`
}

func (Sale) TableName() string {
	return "sales"
}

type SaleItem struct {
	ID        string `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	SaleID    string `gorm:"column:sale_id;type:varchar(255);not null;index;index:idx_sale_items_sale_product" json:"saleId"`
	ProductID string `gorm:"column:product_id;type:varchar(255);not null;index;index:idx_sale_items_sale_product" json:"productId"`
	Qty       int    `gorm:"column:qty;not null" json:"qty"`
	Price     int    `gorm:"column:price;not null" json:"price"`
	Subtotal  int    `gorm:"column:subtotal;not null" json:"subtotal"`

	// Relations
	Sale    *Sale    `gorm:"foreignKey:SaleID;constraint:OnDelete:Cascade" json:"sale,omitempty"`
	Product *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:Restrict" json:"product,omitempty"`
}

func (SaleItem) TableName() string {
	return "sale_items"
}

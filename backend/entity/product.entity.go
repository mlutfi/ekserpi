package entity

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID         string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	CategoryID *string        `gorm:"column:category_id;type:varchar(255);index" json:"categoryId"`
	SKU        *string        `gorm:"column:sku;type:varchar(255);uniqueIndex" json:"sku"`
	Barcode    *string        `gorm:"column:barcode;type:varchar(255);uniqueIndex" json:"barcode"`
	Name       string         `gorm:"column:name;type:varchar(255);not null;index" json:"name"`
	Price      int            `gorm:"column:price;not null" json:"price"`
	Cost       *int           `gorm:"column:cost" json:"cost"`
	ImageURL   *string        `gorm:"column:image_url;type:varchar(500)" json:"imageUrl"`
	IsActive   bool           `gorm:"column:is_active;default:true" json:"isActive"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime;index" json:"createdAt"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Category  *Category       `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"category,omitempty"`
	Inventory *Inventory      `gorm:"foreignKey:ProductID;constraint:OnDelete:Cascade" json:"inventory,omitempty"`
	SaleItems []SaleItem      `gorm:"foreignKey:ProductID;constraint:OnDelete:Restrict" json:"saleItems,omitempty"`
	Movements []StockMovement `gorm:"foreignKey:ProductID;constraint:OnDelete:Restrict" json:"movements,omitempty"`
}

func (Product) TableName() string {
	return "products"
}

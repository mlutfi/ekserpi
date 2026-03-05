package entity

import (
	"time"
)

type Inventory struct {
	ProductID string    `gorm:"column:product_id;primaryKey;type:varchar(255)" json:"productId"`
	QtyOnHand int       `gorm:"column:qty_on_hand;default:0;index" json:"qtyOnHand"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Product *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:Cascade" json:"product,omitempty"`
}

func (Inventory) TableName() string {
	return "inventories"
}

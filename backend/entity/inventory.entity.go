package entity

import (
	"time"
)

type Inventory struct {
	ProductID   string     `gorm:"column:product_id;primaryKey;type:varchar(255)" json:"productId"`
	LocationID  string     `gorm:"column:location_id;primaryKey;type:varchar(255)" json:"locationId"`
	QtyOnHand   int        `gorm:"column:qty_on_hand;default:0;index" json:"qtyOnHand"`
	ExpiryDate  *time.Time `gorm:"column:expiry_date;index" json:"expiryDate"`
	BatchNumber *string    `gorm:"column:batch_number;type:varchar(100);index" json:"batchNumber"`
	TotalCost   int        `gorm:"column:total_cost;default:0" json:"totalCost"`
	AvgCost     int        `gorm:"column:avg_cost;default:0" json:"avgCost"`
	UpdatedAt   time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Product  *Product  `gorm:"foreignKey:ProductID;constraint:OnDelete:Cascade" json:"product,omitempty"`
	Location *Location `gorm:"foreignKey:LocationID;constraint:OnDelete:Cascade" json:"location,omitempty"`
}

func (Inventory) TableName() string {
	return "inventories"
}

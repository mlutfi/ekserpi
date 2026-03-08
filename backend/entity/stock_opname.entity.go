package entity

import (
	"time"

	"gorm.io/gorm"
)

type StockOpnameStatus string

const (
	StockOpnameStatusDraft     StockOpnameStatus = "DRAFT"
	StockOpnameStatusCompleted StockOpnameStatus = "COMPLETED"
	StockOpnameStatusCancelled StockOpnameStatus = "CANCELLED"
)

func (StockOpnameStatus) GormDataType() string {
	return "varchar(20)"
}

type StockOpname struct {
	ID           string            `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	OpnameNumber string            `gorm:"column:opname_number;type:varchar(100);uniqueIndex;not null" json:"opnameNumber"`
	LocationID   string            `gorm:"column:location_id;type:varchar(255);not null;index" json:"locationId"`
	Status       StockOpnameStatus `gorm:"column:status;type:varchar(20);not null;default:'DRAFT';index" json:"status"`
	Note         *string           `gorm:"column:note;type:text" json:"note"`
	CreatedByID  string            `gorm:"column:created_by_id;type:varchar(255);not null" json:"createdById"`
	CreatedAt    time.Time         `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time         `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt    gorm.DeletedAt    `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Location  *Location         `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	CreatedBy *User             `gorm:"foreignKey:CreatedByID" json:"createdBy,omitempty"`
	Items     []StockOpnameItem `gorm:"foreignKey:StockOpnameID;constraint:OnDelete:Cascade" json:"items,omitempty"`
}

func (StockOpname) TableName() string {
	return "stock_opnames"
}

type StockOpnameItem struct {
	ID            string `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	StockOpnameID string `gorm:"column:stock_opname_id;type:varchar(255);not null;index" json:"stockOpnameId"`
	ProductID     string `gorm:"column:product_id;type:varchar(255);not null;index" json:"productId"`
	QtySystem     int    `gorm:"column:qty_system;not null" json:"qtySystem"`
	QtyActual     int    `gorm:"column:qty_actual;not null" json:"qtyActual"`
	QtyDelta      int    `gorm:"column:qty_delta;not null" json:"qtyDelta"`

	// Relations
	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (StockOpnameItem) TableName() string {
	return "stock_opname_items"
}

package entity

import (
	"time"

	"gorm.io/gorm"
)

type StockTransferStatus string

const (
	StockTransferStatusPending   StockTransferStatus = "PENDING"
	StockTransferStatusCompleted StockTransferStatus = "COMPLETED"
	StockTransferStatusCancelled StockTransferStatus = "CANCELLED"
)

func (StockTransferStatus) GormDataType() string {
	return "varchar(20)"
}

type StockTransfer struct {
	ID               string              `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	TransferNumber   string              `gorm:"column:transfer_number;type:varchar(100);uniqueIndex;not null" json:"transferNumber"`
	SourceLocationID string              `gorm:"column:source_location_id;type:varchar(255);not null;index" json:"sourceLocationId"`
	DestLocationID   string              `gorm:"column:dest_location_id;type:varchar(255);not null;index" json:"destLocationId"`
	Status           StockTransferStatus `gorm:"column:status;type:varchar(20);not null;default:'PENDING';index" json:"status"`
	Note             *string             `gorm:"column:note;type:text" json:"note"`
	CreatedByID      string              `gorm:"column:created_by_id;type:varchar(255);not null" json:"createdById"`
	CreatedAt        time.Time           `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt        time.Time           `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt        gorm.DeletedAt      `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	SourceLocation *Location           `gorm:"foreignKey:SourceLocationID" json:"sourceLocation,omitempty"`
	DestLocation   *Location           `gorm:"foreignKey:DestLocationID" json:"destLocation,omitempty"`
	CreatedBy      *User               `gorm:"foreignKey:CreatedByID" json:"createdBy,omitempty"`
	Items          []StockTransferItem `gorm:"foreignKey:StockTransferID;constraint:OnDelete:Cascade" json:"items,omitempty"`
}

func (StockTransfer) TableName() string {
	return "stock_transfers"
}

type StockTransferItem struct {
	ID              string `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	StockTransferID string `gorm:"column:stock_transfer_id;type:varchar(255);not null;index" json:"stockTransferId"`
	ProductID       string `gorm:"column:product_id;type:varchar(255);not null;index" json:"productId"`
	Qty             int    `gorm:"column:qty;not null" json:"qty"`

	// Relations
	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (StockTransferItem) TableName() string {
	return "stock_transfer_items"
}

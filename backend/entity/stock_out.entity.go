package entity

import (
	"time"

	"gorm.io/gorm"
)

type StockOutReason string

const (
	StockOutReasonRefund  StockOutReason = "REFUND"
	StockOutReasonExpired StockOutReason = "EXPIRED"
	StockOutReasonDamaged StockOutReason = "DAMAGED"
	StockOutReasonOther   StockOutReason = "OTHER"
)

func (StockOutReason) GormDataType() string {
	return "varchar(20)"
}

type StockOut struct {
	ID          string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	ProductID   string         `gorm:"column:product_id;type:varchar(255);not null;index" json:"productId"`
	Qty         int            `gorm:"column:qty;not null;default:0" json:"qty"`
	Reason      StockOutReason `gorm:"column:reason;type:varchar(20);not null;index" json:"reason"`
	Note        *string        `gorm:"column:note;type:text" json:"note"`
	CreatedByID string         `gorm:"column:created_by_id;type:varchar(255);not null;index" json:"createdById"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime;index" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Product   *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:Restrict" json:"product,omitempty"`
	CreatedBy *User    `gorm:"foreignKey:CreatedByID;constraint:OnDelete:Restrict" json:"createdBy,omitempty"`
}

func (StockOut) TableName() string {
	return "stock_outs"
}

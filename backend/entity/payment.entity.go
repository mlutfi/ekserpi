package entity

import (
	"encoding/json"
	"time"
)

type PaymentMethod string

const (
	PaymentMethodCash PaymentMethod = "CASH"
	PaymentMethodQRIS PaymentMethod = "QRIS"
)

func (PaymentMethod) GormDataType() string {
	return "varchar(20)"
}

type PaymentProvider string

const (
	PaymentProviderNone     PaymentProvider = "NONE"
	PaymentProviderMidtrans PaymentProvider = "MIDTRANS"
)

func (PaymentProvider) GormDataType() string {
	return "varchar(20)"
}

type PaymentStatus string

const (
	PaymentStatusPending PaymentStatus = "PENDING"
	PaymentStatusPaid    PaymentStatus = "PAID"
	PaymentStatusExpired PaymentStatus = "EXPIRED"
	PaymentStatusFailed  PaymentStatus = "FAILED"
)

func (PaymentStatus) GormDataType() string {
	return "varchar(20)"
}

type Payment struct {
	ID              string           `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	SaleID          string           `gorm:"column:sale_id;type:varchar(255);not null;index;index:idx_payments_sale_created" json:"saleId"`
	Method          PaymentMethod    `gorm:"column:method;type:varchar(20);not null" json:"method"`
	Provider        PaymentProvider  `gorm:"column:provider;type:varchar(20);default:'NONE'" json:"provider"`
	ProviderRef     *string          `gorm:"column:provider_ref;type:varchar(255);index:idx_payments_provider_ref" json:"providerRef"`
	QRISUrl         *string          `gorm:"column:qris_url;type:varchar(500)" json:"qrisUrl"`
	Amount          int              `gorm:"column:amount;not null" json:"amount"`
	Status          PaymentStatus    `gorm:"column:status;type:varchar(20);default:'PENDING';index:idx_payments_status_created" json:"status"`
	RawNotification *json.RawMessage `gorm:"column:raw_notification;type:jsonb" json:"rawNotification"`
	CreatedAt       time.Time        `gorm:"column:created_at;autoCreateTime;index:idx_payments_sale_created;index:idx_payments_status_created" json:"createdAt"`
	UpdatedAt       time.Time        `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Sale *Sale `gorm:"foreignKey:SaleID;constraint:OnDelete:Cascade" json:"sale,omitempty"`
}

func (Payment) TableName() string {
	return "payments"
}

package entity

import (
	"time"
)

type ReceiptTemplate struct {
	ID           string    `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	StoreName    *string   `gorm:"column:store_name;type:varchar(255)" json:"storeName"`
	StoreAddress *string   `gorm:"column:store_address;type:text" json:"storeAddress"`
	StorePhone   *string   `gorm:"column:store_phone;type:varchar(50)" json:"storePhone"`
	FooterText   *string   `gorm:"column:footer_text;type:text" json:"footerText"`
	LogoUrl      *string   `gorm:"column:logo_url;type:varchar(500)" json:"logoUrl"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}

func (ReceiptTemplate) TableName() string {
	return "receipt_templates"
}

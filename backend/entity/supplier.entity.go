package entity

import (
	"time"

	"gorm.io/gorm"
)

type Supplier struct {
	ID          string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"column:name;type:varchar(255);not null;index" json:"name"`
	ContactName *string        `gorm:"column:contact_name;type:varchar(255)" json:"contactName"`
	Phone       *string        `gorm:"column:phone;type:varchar(50)" json:"phone"`
	Email       *string        `gorm:"column:email;type:varchar(255)" json:"email"`
	Address     *string        `gorm:"column:address;type:text" json:"address"`
	IsActive    bool           `gorm:"column:is_active;default:true" json:"isActive"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`
}

func (Supplier) TableName() string {
	return "suppliers"
}

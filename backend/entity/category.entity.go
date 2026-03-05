package entity

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID        string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Name      string         `gorm:"column:name;type:varchar(255);uniqueIndex;not null" json:"name"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Products []Product `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"products,omitempty"`
}

func (Category) TableName() string {
	return "categories"
}

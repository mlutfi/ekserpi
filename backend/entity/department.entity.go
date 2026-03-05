package entity

import (
	"time"

	"gorm.io/gorm"
)

type Department struct {
	ID          string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description string         `gorm:"column:description;type:text" json:"description"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Employees []User `gorm:"foreignKey:DepartmentID;constraint:OnDelete:Restrict" json:"employees,omitempty"`
}

func (Department) TableName() string {
	return "departments"
}

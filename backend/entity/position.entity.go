package entity

import (
	"time"

	"gorm.io/gorm"
)

type Position struct {
	ID        string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Name      string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Level     int            `gorm:"column:level;type:integer;default:1" json:"level"` // 1=Junior, 2=Mid, 3=Senior, 4=Lead, 5=Manager
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Employees []User `gorm:"foreignKey:PositionID;constraint:OnDelete:Restrict" json:"employees,omitempty"`
}

func (Position) TableName() string {
	return "positions"
}

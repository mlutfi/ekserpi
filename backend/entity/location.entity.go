package entity

import (
	"time"

	"gorm.io/gorm"
)

type LocationType string

const (
	LocationTypeWarehouse LocationType = "WAREHOUSE"
	LocationTypeOutlet    LocationType = "OUTLET"
)

func (LocationType) GormDataType() string {
	return "varchar(20)"
}

type Location struct {
	ID        string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Name      string         `gorm:"column:name;type:varchar(255);not null;index" json:"name"`
	Type      LocationType   `gorm:"column:type;type:varchar(20);not null;default:'OUTLET'" json:"type"`
	Address   *string        `gorm:"column:address;type:text" json:"address"`
	IsActive  bool           `gorm:"column:is_active;default:true" json:"isActive"`
	IsDefault bool           `gorm:"column:is_default;default:false" json:"isDefault"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`
}

func (Location) TableName() string {
	return "locations"
}

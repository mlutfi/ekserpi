package entity

import (
	"time"

	"gorm.io/gorm"
)

type Setting struct {
	ID        string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Key       string         `gorm:"column:key;type:varchar(255);uniqueIndex;not null" json:"key"`
	Value     string         `gorm:"column:value;type:text;not null" json:"value"` // Stored as JSON string
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`
}

func (Setting) TableName() string {
	return "settings"
}

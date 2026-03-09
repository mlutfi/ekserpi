package entity

import (
	"time"

	"gorm.io/gorm"
)

type AssetDepreciationStatus string

const (
	AssetDepreciationStatusDraft  AssetDepreciationStatus = "DRAFT"
	AssetDepreciationStatusPosted AssetDepreciationStatus = "POSTED"
)

func (AssetDepreciationStatus) GormDataType() string {
	return "varchar(20)"
}

type AssetDepreciation struct {
	ID                string                  `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	AssetID           string                  `gorm:"column:asset_id;type:varchar(255);not null;uniqueIndex:idx_asset_period" json:"assetId"`
	Period            string                  `gorm:"column:period;type:varchar(7);not null;uniqueIndex:idx_asset_period;index" json:"period"`
	OpeningBookValue  int                     `gorm:"column:opening_book_value;not null;default:0" json:"openingBookValue"`
	DepreciationValue int                     `gorm:"column:depreciation_value;not null;default:0" json:"depreciationValue"`
	ClosingBookValue  int                     `gorm:"column:closing_book_value;not null;default:0" json:"closingBookValue"`
	Status            AssetDepreciationStatus `gorm:"column:status;type:varchar(20);not null;default:'DRAFT';index" json:"status"`
	PostedAt          *time.Time              `gorm:"column:posted_at;index" json:"postedAt"`
	CreatedByID       string                  `gorm:"column:created_by_id;type:varchar(255);not null;index" json:"createdById"`
	CreatedAt         time.Time               `gorm:"column:created_at;autoCreateTime;index" json:"createdAt"`
	UpdatedAt         time.Time               `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt         gorm.DeletedAt          `gorm:"column:deleted_at;index" json:"-"`

	Asset     *Asset `gorm:"foreignKey:AssetID;constraint:OnDelete:Cascade" json:"asset,omitempty"`
	CreatedBy *User  `gorm:"foreignKey:CreatedByID;constraint:OnDelete:Restrict" json:"createdBy,omitempty"`
}

func (AssetDepreciation) TableName() string {
	return "asset_depreciations"
}

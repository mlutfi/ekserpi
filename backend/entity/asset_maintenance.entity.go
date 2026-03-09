package entity

import (
	"time"

	"gorm.io/gorm"
)

type AssetMaintenanceType string

const (
	AssetMaintenanceTypePreventive AssetMaintenanceType = "PREVENTIVE"
	AssetMaintenanceTypeCorrective AssetMaintenanceType = "CORRECTIVE"
	AssetMaintenanceTypeInspection AssetMaintenanceType = "INSPECTION"
)

func (AssetMaintenanceType) GormDataType() string {
	return "varchar(20)"
}

type AssetMaintenanceStatus string

const (
	AssetMaintenanceStatusScheduled  AssetMaintenanceStatus = "SCHEDULED"
	AssetMaintenanceStatusInProgress AssetMaintenanceStatus = "IN_PROGRESS"
	AssetMaintenanceStatusCompleted  AssetMaintenanceStatus = "COMPLETED"
)

func (AssetMaintenanceStatus) GormDataType() string {
	return "varchar(20)"
}

type AssetMaintenance struct {
	ID              string                 `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	AssetID         string                 `gorm:"column:asset_id;type:varchar(255);not null;index" json:"assetId"`
	MaintenanceDate time.Time              `gorm:"column:maintenance_date;not null;index" json:"maintenanceDate"`
	Type            AssetMaintenanceType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Vendor          *string                `gorm:"column:vendor;type:varchar(255)" json:"vendor"`
	Cost            int                    `gorm:"column:cost;not null;default:0" json:"cost"`
	Description     *string                `gorm:"column:description;type:text" json:"description"`
	Status          AssetMaintenanceStatus `gorm:"column:status;type:varchar(20);not null;default:'SCHEDULED';index" json:"status"`
	CompletedAt     *time.Time             `gorm:"column:completed_at;index" json:"completedAt"`
	CreatedByID     string                 `gorm:"column:created_by_id;type:varchar(255);not null;index" json:"createdById"`
	CreatedAt       time.Time              `gorm:"column:created_at;autoCreateTime;index" json:"createdAt"`
	UpdatedAt       time.Time              `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt       gorm.DeletedAt         `gorm:"column:deleted_at;index" json:"-"`

	Asset     *Asset `gorm:"foreignKey:AssetID;constraint:OnDelete:Cascade" json:"asset,omitempty"`
	CreatedBy *User  `gorm:"foreignKey:CreatedByID;constraint:OnDelete:Restrict" json:"createdBy,omitempty"`
}

func (AssetMaintenance) TableName() string {
	return "asset_maintenances"
}

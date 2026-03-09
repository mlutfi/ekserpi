package entity

import (
	"time"

	"gorm.io/gorm"
)

type AssetStatus string

const (
	AssetStatusAvailable   AssetStatus = "AVAILABLE"
	AssetStatusAssigned    AssetStatus = "ASSIGNED"
	AssetStatusMaintenance AssetStatus = "MAINTENANCE"
	AssetStatusDisposed    AssetStatus = "DISPOSED"
)

func (AssetStatus) GormDataType() string {
	return "varchar(20)"
}

type DepreciationMethod string

const (
	DepreciationMethodStraightLine DepreciationMethod = "STRAIGHT_LINE"
)

func (DepreciationMethod) GormDataType() string {
	return "varchar(30)"
}

type Asset struct {
	ID                 string             `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	AssetCode          string             `gorm:"column:asset_code;type:varchar(100);not null;uniqueIndex" json:"assetCode"`
	Name               string             `gorm:"column:name;type:varchar(255);not null;index" json:"name"`
	Category           string             `gorm:"column:category;type:varchar(120);not null;index" json:"category"`
	PurchaseDate       time.Time          `gorm:"column:purchase_date;not null;index" json:"purchaseDate"`
	AcquisitionCost    int                `gorm:"column:acquisition_cost;not null;default:0" json:"acquisitionCost"`
	ResidualValue      int                `gorm:"column:residual_value;not null;default:0" json:"residualValue"`
	UsefulLifeMonths   int                `gorm:"column:useful_life_months;not null;default:0" json:"usefulLifeMonths"`
	DepreciationMethod DepreciationMethod `gorm:"column:depreciation_method;type:varchar(30);not null;default:'STRAIGHT_LINE'" json:"depreciationMethod"`
	Status             AssetStatus        `gorm:"column:status;type:varchar(20);not null;default:'AVAILABLE';index" json:"status"`
	LocationID         *string            `gorm:"column:location_id;type:varchar(255);index" json:"locationId"`
	Note               *string            `gorm:"column:note;type:text" json:"note"`
	CreatedByID        string             `gorm:"column:created_by_id;type:varchar(255);not null;index" json:"createdById"`
	CreatedAt          time.Time          `gorm:"column:created_at;autoCreateTime;index" json:"createdAt"`
	UpdatedAt          time.Time          `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt          gorm.DeletedAt     `gorm:"column:deleted_at;index" json:"-"`

	Location     *Location           `gorm:"foreignKey:LocationID;constraint:OnDelete:SET NULL" json:"location,omitempty"`
	CreatedBy    *User               `gorm:"foreignKey:CreatedByID;constraint:OnDelete:Restrict" json:"createdBy,omitempty"`
	Assignments  []AssetAssignment   `gorm:"foreignKey:AssetID;constraint:OnDelete:Cascade" json:"assignments,omitempty"`
	Maintenances []AssetMaintenance  `gorm:"foreignKey:AssetID;constraint:OnDelete:Cascade" json:"maintenances,omitempty"`
	Depreciations []AssetDepreciation `gorm:"foreignKey:AssetID;constraint:OnDelete:Cascade" json:"depreciations,omitempty"`
}

func (Asset) TableName() string {
	return "assets"
}

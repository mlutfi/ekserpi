package entity

import (
	"time"

	"gorm.io/gorm"
)

type AssetAssigneeType string

const (
	AssetAssigneeTypeUser       AssetAssigneeType = "USER"
	AssetAssigneeTypeDepartment AssetAssigneeType = "DEPARTMENT"
	AssetAssigneeTypeLocation   AssetAssigneeType = "LOCATION"
	AssetAssigneeTypeOther      AssetAssigneeType = "OTHER"
)

func (AssetAssigneeType) GormDataType() string {
	return "varchar(20)"
}

type AssetAssignmentStatus string

const (
	AssetAssignmentStatusActive   AssetAssignmentStatus = "ACTIVE"
	AssetAssignmentStatusReturned AssetAssignmentStatus = "RETURNED"
)

func (AssetAssignmentStatus) GormDataType() string {
	return "varchar(20)"
}

type AssetAssignment struct {
	ID           string                `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	AssetID      string                `gorm:"column:asset_id;type:varchar(255);not null;index" json:"assetId"`
	AssigneeType AssetAssigneeType     `gorm:"column:assignee_type;type:varchar(20);not null;index" json:"assigneeType"`
	AssigneeRef  *string               `gorm:"column:assignee_ref;type:varchar(255);index" json:"assigneeRef"`
	AssigneeName string                `gorm:"column:assignee_name;type:varchar(255);not null;index" json:"assigneeName"`
	AssignedAt   time.Time             `gorm:"column:assigned_at;not null;index" json:"assignedAt"`
	ReturnedAt   *time.Time            `gorm:"column:returned_at;index" json:"returnedAt"`
	ConditionOut *string               `gorm:"column:condition_out;type:text" json:"conditionOut"`
	ConditionIn  *string               `gorm:"column:condition_in;type:text" json:"conditionIn"`
	Note         *string               `gorm:"column:note;type:text" json:"note"`
	Status       AssetAssignmentStatus `gorm:"column:status;type:varchar(20);not null;default:'ACTIVE';index" json:"status"`
	CreatedByID  string                `gorm:"column:created_by_id;type:varchar(255);not null;index" json:"createdById"`
	CreatedAt    time.Time             `gorm:"column:created_at;autoCreateTime;index" json:"createdAt"`
	UpdatedAt    time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt    gorm.DeletedAt        `gorm:"column:deleted_at;index" json:"-"`

	Asset     *Asset `gorm:"foreignKey:AssetID;constraint:OnDelete:Cascade" json:"asset,omitempty"`
	CreatedBy *User  `gorm:"foreignKey:CreatedByID;constraint:OnDelete:Restrict" json:"createdBy,omitempty"`
}

func (AssetAssignment) TableName() string {
	return "asset_assignments"
}

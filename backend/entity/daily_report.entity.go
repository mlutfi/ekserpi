package entity

import (
	"time"

	"gorm.io/gorm"
)

type DailyReportStatus string

const (
	DailyReportStatusPending  DailyReportStatus = "PENDING"
	DailyReportStatusApproved DailyReportStatus = "APPROVED"
	DailyReportStatusRejected DailyReportStatus = "REJECTED"
)

func (DailyReportStatus) GormDataType() string {
	return "varchar(20)"
}

type DailyReport struct {
	ID         string            `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	EmployeeID string            `gorm:"column:employee_id;type:varchar(255);index;not null" json:"employeeId"`
	Date       time.Time         `gorm:"column:date;type:date;index" json:"date"`
	Notes      string            `gorm:"column:notes;type:text" json:"notes"`
	Status     DailyReportStatus `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"`
	ApprovedBy *string           `gorm:"column:approved_by;type:varchar(255)" json:"approvedBy"`
	ApprovedAt *time.Time        `gorm:"column:approved_at;type:timestamp" json:"approvedAt"`
	CreatedAt  time.Time         `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time         `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt  gorm.DeletedAt    `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Employee User              `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	Items    []DailyReportItem `gorm:"foreignKey:ReportID" json:"items,omitempty"`
}

func (DailyReport) TableName() string {
	return "daily_reports"
}

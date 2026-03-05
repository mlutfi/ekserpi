package entity

import (
	"time"

	"gorm.io/gorm"
)

type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "PENDING"
	TaskStatusOnProgress TaskStatus = "ON_PROGRESS"
	TaskStatusCompleted  TaskStatus = "COMPLETED"
	TaskStatusCancelled  TaskStatus = "CANCELLED"
)

func (TaskStatus) GormDataType() string {
	return "varchar(20)"
}

type DailyReportItem struct {
	ID          string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	ReportID    string         `gorm:"column:report_id;type:varchar(255);index;not null" json:"reportId"`
	Title       string         `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Description string         `gorm:"column:description;type:text" json:"description"`
	Progress    int            `gorm:"column:progress;type:integer;default:0" json:"progress"` // 0-100
	Status      TaskStatus     `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Report DailyReport `gorm:"foreignKey:ReportID" json:"report,omitempty"`
}

func (DailyReportItem) TableName() string {
	return "daily_report_items"
}

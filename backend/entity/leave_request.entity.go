package entity

import (
	"time"

	"gorm.io/gorm"
)

type LeaveType string

const (
	LeaveTypeAnnual    LeaveType = "ANNUAL"    // Cuti Tahunan
	LeaveTypeSick      LeaveType = "SICK"      // Sakit
	LeaveTypePersonal  LeaveType = "PERSONAL"  // Izin Pribadi
	LeaveTypeMaternity LeaveType = "MATERNITY" // Cuti Melahirkan
	LeaveTypePaternity LeaveType = "PATERNITY" // Cuti Ayah
	LeaveTypeUnpaid    LeaveType = "UNPAID"    // Cuti Tanpa Gaji
)

func (LeaveType) GormDataType() string {
	return "varchar(20)"
}

type LeaveStatus string

const (
	LeaveStatusPending   LeaveStatus = "PENDING"
	LeaveStatusApproved  LeaveStatus = "APPROVED"
	LeaveStatusRejected  LeaveStatus = "REJECTED"
	LeaveStatusCancelled LeaveStatus = "CANCELLED"
)

func (LeaveStatus) GormDataType() string {
	return "varchar(20)"
}

type LeaveRequest struct {
	ID         string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	EmployeeID string         `gorm:"column:employee_id;type:varchar(255);index;not null" json:"employeeId"`
	LeaveType  LeaveType      `gorm:"column:leave_type;type:varchar(20);not null" json:"leaveType"`
	StartDate  time.Time      `gorm:"column:start_date;type:date;not null" json:"startDate"`
	EndDate    time.Time      `gorm:"column:end_date;type:date;not null" json:"endDate"`
	Reason     string         `gorm:"column:reason;type:text" json:"reason"`
	Status     LeaveStatus    `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"`
	ApprovedBy *string        `gorm:"column:approved_by;type:varchar(255)" json:"approvedBy"`
	ApprovedAt *time.Time     `gorm:"column:approved_at;type:timestamp" json:"approvedAt"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Employee User  `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	Approver *User `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
}

func (LeaveRequest) TableName() string {
	return "leave_requests"
}

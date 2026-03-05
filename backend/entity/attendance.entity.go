package entity

import (
	"time"

	"gorm.io/gorm"
)

type WorkType string

const (
	WorkTypeWFO WorkType = "WFO" // Work From Office
	WorkTypeWFH WorkType = "WFH" // Work From Home
	WorkTypeWFA WorkType = "WFA" // Work From Anywhere
)

func (WorkType) GormDataType() string {
	return "varchar(10)"
}

type AttendanceStatus string

const (
	AttendanceStatusPresent  AttendanceStatus = "PRESENT"
	AttendanceStatusLate     AttendanceStatus = "LATE"
	AttendanceStatusOutside  AttendanceStatus = "OUTSIDE_RADIUS"
	AttendanceStatusAbsent   AttendanceStatus = "ABSENT"
	AttendanceStatusOnLeave  AttendanceStatus = "ON_LEAVE"
	AttendanceStatusPending  AttendanceStatus = "PENDING_APPROVAL" // For WFH/WFA requests
	AttendanceStatusApproved AttendanceStatus = "APPROVED"
	AttendanceStatusRejected AttendanceStatus = "REJECTED"
)

func (AttendanceStatus) GormDataType() string {
	return "varchar(20)"
}

type Attendance struct {
	ID         string    `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	EmployeeID string    `gorm:"column:employee_id;type:varchar(255);index;not null" json:"employeeId"`
	Date       time.Time `gorm:"column:date;type:date;index" json:"date"`

	// Check In
	CheckInTime   *time.Time `gorm:"column:checkin_time;type:time" json:"checkinTime"`
	CheckInPhoto  string     `gorm:"column:checkin_photo;type:varchar(500)" json:"checkinPhoto"`
	CheckInLat    *float64   `gorm:"column:checkin_lat;type:decimal(10,8)" json:"checkinLat"`
	CheckInLong   *float64   `gorm:"column:checkin_long;type:decimal(11,8)" json:"checkinLong"`
	CheckInRadius float64    `gorm:"column:checkin_radius;type:decimal(10,2);default:0" json:"checkinRadius"` // Distance from office in meters

	// Check Out
	CheckOutTime  *time.Time `gorm:"column:checkout_time;type:time" json:"checkoutTime"`
	CheckOutPhoto string     `gorm:"column:checkout_photo;type:varchar(500)" json:"checkoutPhoto"`
	CheckOutLat   *float64   `gorm:"column:checkout_lat;type:decimal(10,8)" json:"checkoutLat"`
	CheckOutLong  *float64   `gorm:"column:checkout_long;type:decimal(11,8)" json:"checkoutLong"`

	// Work Type
	WorkType WorkType         `gorm:"column:work_type;type:varchar(10);default:'WFO'" json:"workType"`
	Status   AttendanceStatus `gorm:"column:status;type:varchar(20);default:'PRESENT'" json:"status"`

	// WFH/WFA Reason (required when work type is WFH or WFA)
	Reason string `gorm:"column:reason;type:text" json:"reason"`

	// Approval Workflow
	ApprovedBy *string    `gorm:"column:approved_by;type:varchar(255)" json:"approvedBy"`
	ApprovedAt *time.Time `gorm:"column:approved_at;type:timestamp" json:"approvedAt"`

	// Notes
	Notes string `gorm:"column:notes;type:text" json:"notes"`

	// Timestamps
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Employee User `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
}

func (Attendance) TableName() string {
	return "attendance"
}

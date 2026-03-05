package attendance

type AttendanceResponse struct {
	ID            string   `json:"id"`
	EmployeeID    string   `json:"employeeId"`
	EmployeeName  string   `json:"employeeName"`
	Date          string   `json:"date"`
	CheckInTime   string   `json:"checkinTime"`
	CheckInPhoto  string   `json:"checkinPhoto"`
	CheckInLat    *float64 `json:"checkinLat"`
	CheckInLong   *float64 `json:"checkinLong"`
	CheckInRadius float64  `json:"checkinRadius"`
	CheckOutTime  string   `json:"checkoutTime"`
	CheckOutPhoto string   `json:"checkoutPhoto"`
	CheckOutLat   *float64 `json:"checkoutLat"`
	CheckOutLong  *float64 `json:"checkoutLong"`
	WorkType      string   `json:"workType"`
	Status        string   `json:"status"`
	Reason        string   `json:"reason"` // Reason for WFH/WFA
	ApprovedBy    *string  `json:"approvedBy"`
	ApprovedAt    *string  `json:"approvedAt"`
	Notes         string   `json:"notes"`
}

type CheckInRequest struct {
	EmployeeID   string  `json:"employeeId" validate:"required"`
	WorkType     string  `json:"workType" validate:"required,oneof=WFO WFH WFA"`
	Reason       string  `json:"reason"` // Required for WFH/WFA
	Photo        string  `json:"photo" validate:"required"`
	Latitude     float64 `json:"latitude" validate:"required"`
	Longitude    float64 `json:"longitude" validate:"required"`
	OfficeLat    float64 `json:"officeLat"`
	OfficeLong   float64 `json:"officeLong"`
	OfficeRadius float64 `json:"officeRadius"`
}

type CheckOutRequest struct {
	EmployeeID string  `json:"employeeId" validate:"required"`
	Photo      string  `json:"photo" validate:"required"`
	Latitude   float64 `json:"latitude" validate:"required"`
	Longitude  float64 `json:"longitude" validate:"required"`
}

type ApproveAttendanceRequest struct {
	AttendanceID string `json:"attendanceId" validate:"required"`
	ApprovedBy   string `json:"approvedBy" validate:"required"`
}

type AttendanceListResponse struct {
	Attendances []AttendanceResponse `json:"attendances"`
	Total       int64                `json:"total"`
}

type AttendanceStatsResponse struct {
	TotalEmployees int `json:"totalEmployees"`
	WFOCount       int `json:"wfoCount"`
	WFHCount       int `json:"wfhCount"`
	WFACount       int `json:"wfaCount"`
	NotCheckedIn   int `json:"notCheckedIn"`
}

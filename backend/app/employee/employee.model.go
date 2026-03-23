package employee

import (
	"hris_backend/entity"
	"time"
)

type EmployeeResponse struct {
	ID             string  `json:"id"`
	NIP            string  `json:"nip"`
	Name           string  `json:"name"`
	Email          string  `json:"email"`
	Phone          string  `json:"phone"`
	Address        string  `json:"address"`
	DepartmentID   *string            `json:"departmentId"`
	DepartmentName string             `json:"departmentName"`
	Department     *entity.Department `json:"department"`
	PositionID     *string            `json:"positionId"`
	PositionName   string             `json:"positionName"`
	Position       *entity.Position   `json:"position"`
	JoinDate       string             `json:"joinDate"`
	EmployeeType   string             `json:"employeeType"`
	Status         string             `json:"status"`
	Photo          string             `json:"photo"`
	KTPPhoto       string             `json:"ktpPhoto"`
	ManagerID      *string            `json:"managerId"`
	ManagerName    string             `json:"managerName"`
	Manager        *entity.User       `json:"manager"`
	TeamLeaderID   *string            `json:"teamLeaderId"`
	TeamLeaderName string             `json:"teamLeaderName"`
	TeamLeader     *entity.User       `json:"teamLeader"`
	BasicSalary    float64 `json:"basicSalary"`
	Allowance      float64 `json:"allowance"`
	DailyRate      float64 `json:"dailyRate"`
	Salary         float64 `json:"salary"` // Combined salary (BasicSalary + Allowance)
}

type CreateEmployeeRequest struct {
	NIP          string  `json:"nip" validate:"required"`
	Name         string  `json:"name" validate:"required"`
	Email        string  `json:"email" validate:"required,email"`
	Phone        string  `json:"phone"`
	Address      string  `json:"address"`
	DepartmentID *string `json:"departmentId"`
	PositionID   *string `json:"positionId"`
	JoinDate     string  `json:"joinDate" validate:"required"`
	EmployeeType string  `json:"employeeType"`
	Photo        string  `json:"photo"`
	KTPPhoto     string  `json:"ktpPhoto"`
	ManagerID    *string `json:"managerId"`
	TeamLeaderID *string `json:"teamLeaderId"`
	BasicSalary  float64 `json:"basicSalary"`
	Allowance    float64 `json:"allowance"`
	DailyRate    float64 `json:"dailyRate"`
	Salary       float64 `json:"salary"` // Combined salary for HR_ADMIN/OWNER to set
}

type UpdateEmployeeRequest struct {
	Name         *string  `json:"name,omitempty"`
	Email        *string  `json:"email,omitempty"`
	Phone        *string  `json:"phone,omitempty"`
	Address      *string  `json:"address,omitempty"`
	DepartmentID *string  `json:"departmentId,omitempty"`
	PositionID   *string  `json:"positionId,omitempty"`
	EmployeeType *string  `json:"employeeType,omitempty"`
	Status       *string  `json:"status,omitempty"`
	Photo        *string  `json:"photo,omitempty"`
	KTPPhoto     *string  `json:"ktpPhoto,omitempty"`
	ManagerID    *string  `json:"managerId,omitempty"`
	TeamLeaderID *string  `json:"teamLeaderId,omitempty"`
	BasicSalary  *float64 `json:"basicSalary,omitempty"`
	Allowance    *float64 `json:"allowance,omitempty"`
	DailyRate    *float64 `json:"dailyRate,omitempty"`
	Salary       *float64 `json:"salary,omitempty"` // Combined salary for HR_ADMIN/OWNER to set
}

type EmployeeListResponse struct {
	Employees []EmployeeResponse `json:"employees"`
	Total     int64              `json:"total"`
}

type DashboardStatsResponse struct {
	Employee        *EmployeeResponse    `json:"employee"`
	TodayAttendance *AttendanceResponse  `json:"todayAttendance"`
	TodayReport     *DailyReportResponse `json:"todayReport"`
	RemainingLeave  int                  `json:"remainingLeave"`
	RecentPayroll   *PayrollResponse     `json:"recentPayroll"`
}

type AttendanceResponse struct {
	ID         string  `json:"id"`
	EmployeeID string  `json:"employeeId"`
	CheckIn    string  `json:"checkIn"`
	CheckOut   *string `json:"checkOut"`
	Date       string  `json:"date"`
	Status     string  `json:"status"`
}

type DailyReportResponse struct {
	ID         string `json:"id"`
	EmployeeID string `json:"employeeId"`
	Date       string `json:"date"`
	Tasks      string `json:"tasks"`
	Status     string `json:"status"`
}

type PayrollResponse struct {
	ID          string  `json:"id"`
	EmployeeID  string  `json:"employeeId"`
	Month       string  `json:"month"`
	Year        int     `json:"year"`
	BasicSalary float64 `json:"basicSalary"`
	Allowance   float64 `json:"allowance"`
	TotalPay    float64 `json:"totalPay"`
	Status      string  `json:"status"`
}

type HRStatsResponse struct {
	TotalEmployees   int `json:"totalEmployees"`
	TotalDepartments int `json:"totalDepartments"`
	ActiveEmployees  int `json:"activeEmployees"`
	OnLeaveEmployees int `json:"onLeaveEmployees"`
}

type ManagerStatsResponse struct {
	TeamAttendance []AttendanceResponse  `json:"teamAttendance"`
	TeamLeaves     []LeaveStatsResponse  `json:"teamLeaves"`
	TeamReports    []DailyReportResponse `json:"teamReports"`
}

type LeaveStatsResponse struct {
	ID           string `json:"id"`
	EmployeeID   string `json:"employeeId"`
	EmployeeName string `json:"employeeName"`
	LeaveType    string `json:"leaveType"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
	Status       string `json:"status"`
}

func (EmployeeResponse) TableName() string {
	return "employees"
}

func ParseDate(dateStr string) (time.Time, error) {
	if dateStr == "" {
		return time.Now(), nil
	}
	return time.Parse("2006-01-02", dateStr)
}

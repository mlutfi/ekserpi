package entity

import (
	"time"

	"gorm.io/gorm"
)

type Payroll struct {
	ID         string `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	EmployeeID string `gorm:"column:employee_id;type:varchar(255);index;not null" json:"employeeId"`
	Period     string `gorm:"column:period;type:varchar(7);index;not null" json:"period"` // Format: YYYY-MM
	// Keep employee type at payroll time for audit/snapshot in payslip.
	EmployeeType string `gorm:"column:employee_type;type:varchar(30);default:'KARYAWAN_TETAP'" json:"employeeType"`

	// Pendapatan / Income
	BasicSalary float64 `gorm:"column:basic_salary;type:decimal(15,2);default:0" json:"basicSalary"`
	Allowance   float64 `gorm:"column:allowance;type:decimal(15,2);default:0" json:"allowance"`   // Tunjangan
	Bonus       float64 `gorm:"column:bonus;type:decimal(15,2);default:0" json:"bonus"`           // Bonus
	Commission  float64 `gorm:"column:commission;type:decimal(15,2);default:0" json:"commission"` // Komisi
	Overtime    float64 `gorm:"column:overtime;type:decimal(15,2);default:0" json:"overtime"`     // Lembur

	// Potongan / Deductions
	LateDeduction   float64 `gorm:"column:late_deduction;type:decimal(15,2);default:0" json:"lateDeduction"`     // Potongan Terlambat
	AbsentDeduction float64 `gorm:"column:absent_deduction;type:decimal(15,2);default:0" json:"absentDeduction"` // Potongan Absen
	BPJS            float64 `gorm:"column:bpjs;type:decimal(15,2);default:0" json:"bpjs"`                        // BPJS Kesehatan
	THT             float64 `gorm:"column:tht;type:decimal(15,2);default:0" json:"tht"`                          // BPJS TK
	Tax             float64 `gorm:"column:tax;type:decimal(15,2);default:0" json:"tax"`                          // PPH 21
	OtherDeduction  float64 `gorm:"column:other_deduction;type:decimal(15,2);default:0" json:"otherDeduction"`   // Potongan Lain

	// Calculated
	TotalIncome    float64 `gorm:"column:total_income;type:decimal(15,2);default:0" json:"totalIncome"`
	TotalDeduction float64 `gorm:"column:total_deduction;type:decimal(15,2);default:0" json:"totalDeduction"`
	NetSalary      float64 `gorm:"column:net_salary;type:decimal(15,2);default:0" json:"netSalary"`

	// Attendance Summary
	WorkDays    int `gorm:"column:work_days;type:integer;default:0" json:"workDays"`
	PresentDays int `gorm:"column:present_days;type:integer;default:0" json:"presentDays"`
	LateDays    int `gorm:"column:late_days;type:integer;default:0" json:"lateDays"`
	AbsentDays  int `gorm:"column:absent_days;type:integer;default:0" json:"absentDays"`
	LeaveDays   int `gorm:"column:leave_days;type:integer;default:0" json:"leaveDays"`

	// Status
	IsPaid bool       `gorm:"column:is_paid;default:false" json:"isPaid"`
	PaidAt *time.Time `gorm:"column:paid_at;type:timestamp" json:"paidAt"`

	// Notes
	Notes string `gorm:"column:notes;type:text" json:"notes"`

	// Timestamps
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// Relations
	Employee User `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
}

func (Payroll) TableName() string {
	return "payroll"
}

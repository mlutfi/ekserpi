package entity

import (
	"strings"
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleOwner   Role = "OWNER"
	RoleOps     Role = "OPS"
	RoleCashier Role = "CASHIER"
	// HRIS Roles
	RoleHRAdmin    Role = "HR_ADMIN"
	RoleManager    Role = "MANAGER"
	RoleTeamLeader Role = "TEAM_LEADER"
	RoleEmployee   Role = "EMPLOYEE"
	RoleStaff      Role = "STAFF"
	// Technical Roles
	RoleBackend  Role = "BACKEND"
	RoleFrontend Role = "FRONTEND"
)

var roleLabels = map[Role]string{
	RoleOwner:      "Owner",
	RoleOps:        "Operations",
	RoleCashier:    "Cashier",
	RoleHRAdmin:    "HR Admin",
	RoleManager:    "Manager",
	RoleTeamLeader: "Team Leader",
	RoleEmployee:   "Employee",
	RoleStaff:      "Staff",
	RoleBackend:    "Backend Developer",
	RoleFrontend:   "Frontend Developer",
}

func (Role) GormDataType() string {
	return "varchar(20)"
}

type EmployeeStatus string

const (
	EmployeeStatusActive   EmployeeStatus = "ACTIVE"
	EmployeeStatusInactive EmployeeStatus = "INACTIVE"
	EmployeeStatusResigned EmployeeStatus = "RESIGNED"
)

type EmployeeType string

const (
	// Canonical employee types used by payroll and employee profile.
	EmployeeTypePermanent EmployeeType = "KARYAWAN_TETAP"
	EmployeeTypePKWT      EmployeeType = "PKWT"
	EmployeeTypeFreelance EmployeeType = "FREELANCE_BURUH"

	// Legacy aliases for backward compatibility with old seeded data.
	EmployeeTypePKWTT     EmployeeType = EmployeeTypePermanent
	EmployeeTypeProbation EmployeeType = EmployeeTypePermanent
	EmployeeTypeHarian    EmployeeType = EmployeeTypeFreelance
)

func (EmployeeStatus) GormDataType() string {
	return "varchar(20)"
}

func (EmployeeType) GormDataType() string {
	return "varchar(20)"
}

type User struct {
	ID                 string         `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Name               string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Email              string         `gorm:"column:email;type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash       *string        `gorm:"column:password_hash;type:varchar(255)" json:"-"`
	Role               Role           `gorm:"column:role;type:varchar(20);default:'CASHIER'" json:"role"`
	MustChangePassword bool           `gorm:"column:must_change_password;default:false" json:"mustChangePassword"`
	TeamLeaderID       *string        `gorm:"column:team_leader_id;type:varchar(255)" json:"teamLeaderId"`
	CreatedAt          time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt          time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt          gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	// HRIS Employee Fields
	NIP              *string        `gorm:"column:nip;type:varchar(50);uniqueIndex" json:"nip"`
	Phone            string         `gorm:"column:phone;type:varchar(20)" json:"phone"`
	Address          string         `gorm:"column:address;type:text" json:"address"`
	DepartmentID     *string        `gorm:"column:department_id;type:varchar(255)" json:"departmentId"`
	PositionID       *string        `gorm:"column:position_id;type:varchar(255)" json:"positionId"`
	JoinDate         *time.Time     `gorm:"column:join_date;type:date" json:"joinDate"`
	EmployeeType     EmployeeType   `gorm:"column:employee_type;type:varchar(20);default:'KARYAWAN_TETAP'" json:"employeeType"`
	Status           EmployeeStatus `gorm:"column:status;type:varchar(20);default:'ACTIVE'" json:"status"`
	Photo            string         `gorm:"column:photo;type:varchar(500)" json:"photo"`
	ManagerID        *string        `gorm:"column:manager_id;type:varchar(255)" json:"managerId"`
	BasicSalary      float64        `gorm:"column:basic_salary;type:decimal(15,2);default:0" json:"basicSalary"`
	Allowance        float64        `gorm:"column:allowance;type:decimal(15,2);default:0" json:"allowance"`
	DailyRate        float64        `gorm:"column:daily_rate;type:decimal(15,2);default:0" json:"dailyRate"`
	TwoFactorSecret  string         `gorm:"column:two_factor_secret;type:varchar(255)" json:"-"`
	TwoFactorEnabled bool           `gorm:"column:two_factor_enabled;default:false" json:"twoFactorEnabled"`

	// Relations
	Sales      []Sale      `gorm:"foreignKey:CashierID;constraint:OnDelete:Restrict" json:"sales,omitempty"`
	TeamLeader *User       `gorm:"foreignKey:TeamLeaderID" json:"teamLeader,omitempty"`
	Department *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	Position   *Position   `gorm:"foreignKey:PositionID" json:"position,omitempty"`
	Manager    *User       `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
}

func (User) TableName() string {
	return "users"
}

func AllRoles() []Role {
	return []Role{
		RoleOwner,
		RoleOps,
		RoleCashier,
		RoleHRAdmin,
		RoleManager,
		RoleTeamLeader,
		RoleEmployee,
		RoleStaff,
		RoleBackend,
		RoleFrontend,
	}
}

func IsValidRole(raw string) bool {
	normalized := strings.ToUpper(strings.TrimSpace(raw))
	for _, role := range AllRoles() {
		if string(role) == normalized {
			return true
		}
	}
	return false
}

func NormalizeRole(raw string) Role {
	return Role(strings.ToUpper(strings.TrimSpace(raw)))
}

func RoleLabel(role Role) string {
	label, ok := roleLabels[role]
	if !ok {
		return string(role)
	}
	return label
}

func NormalizeEmployeeType(raw string) EmployeeType {
	normalized := strings.ToUpper(strings.TrimSpace(raw))

	switch normalized {
	case "", "PKWTT", "KARYAWAN_TETAP", "PERMANENT", "TETAP":
		return EmployeeTypePermanent
	case "PKWT", "KONTRAK":
		return EmployeeTypePKWT
	case "FREELANCE", "BURUH", "FREELANCE_BURUH", "HARIAN_LEPAS":
		return EmployeeTypeFreelance
	default:
		return EmployeeType(normalized)
	}
}

func IsFreelanceEmployeeType(employeeType EmployeeType) bool {
	return NormalizeEmployeeType(string(employeeType)) == EmployeeTypeFreelance
}

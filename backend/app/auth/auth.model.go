package auth

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token             string            `json:"token,omitempty"`
	TwoFactorRequired bool              `json:"twoFactorRequired"`
	TwoFactorToken    string            `json:"twoFactorToken,omitempty"`
	User              UserResponse      `json:"user"`
	Employee          *EmployeeResponse `json:"employee,omitempty"` // nil if not HRIS role
}

type UserResponse struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	Email              string   `json:"email"`
	Role               string   `json:"role"`
	Permissions        []string `json:"permissions,omitempty"`
	MustChangePassword bool     `json:"mustChangePassword"`
	TwoFactorEnabled   bool     `json:"twoFactorEnabled"`
}

type Setup2FAResponse struct {
	Secret string `json:"secret"`
	QRURL  string `json:"qrUrl"`
}

type Verify2FARequest struct {
	Code string `json:"code" validate:"required,len=6"`
}

type Verify2FALoginRequest struct {
	Code           string `json:"code" validate:"required,len=6"`
	TwoFactorToken string `json:"twoFactorToken" validate:"required"`
}

// EmployeeResponse - simplified employee data for auth response
type EmployeeResponse struct {
	ID           string `json:"id"`
	NIP          string `json:"nip"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	DepartmentID string `json:"departmentId,omitempty"`
	PositionID   string `json:"positionId,omitempty"`
	JoinDate     string `json:"joinDate"`
	EmployeeType string `json:"employeeType"`
	Status       string `json:"status"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword" validate:"required,min=6"`
}

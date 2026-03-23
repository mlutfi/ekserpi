package employee

import (
	"context"
	"errors"

	"hris_backend/entity"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type EmployeeUseCase interface {
	GetAll(ctx context.Context, page, limit int) (*EmployeeListResponse, error)
	GetByID(ctx context.Context, id string) (*EmployeeResponse, error)
	GetByUserID(ctx context.Context, userID string) (*EmployeeResponse, error)
	GetByDepartment(ctx context.Context, deptID string) ([]EmployeeResponse, error)
	GetTeam(ctx context.Context, managerID string) ([]EmployeeResponse, error)
	GetByTeamLeader(ctx context.Context, teamLeaderID string) ([]EmployeeResponse, error)
	GetByRole(ctx context.Context, role string) ([]EmployeeResponse, error)
	Create(ctx context.Context, request *CreateEmployeeRequest) (*EmployeeResponse, error)
	Update(ctx context.Context, id string, request *UpdateEmployeeRequest) (*EmployeeResponse, error)
	Delete(ctx context.Context, id string) error
	GetDashboardStats(ctx context.Context, userID string) (*DashboardStatsResponse, error)
	GetHRStats(ctx context.Context) (*HRStatsResponse, error)
	GetManagerStats(ctx context.Context, userID string) (*ManagerStatsResponse, error)
	GetTeamLeaderOptions(ctx context.Context) ([]EmployeeResponse, error)
}

type employeeUseCase struct {
	DB         *gorm.DB
	Repository EmployeeRepository
}

func NewEmployeeUseCase(db *gorm.DB, repository EmployeeRepository) EmployeeUseCase {
	return &employeeUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *employeeUseCase) GetAll(ctx context.Context, page, limit int) (*EmployeeListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	employees, total, err := u.Repository.GetAll(ctx, page, limit)
	if err != nil {
		return nil, err
	}

	var responses []EmployeeResponse
	for _, emp := range employees {
		responses = append(responses, *u.toResponse(&emp))
	}

	return &EmployeeListResponse{
		Employees: responses,
		Total:     total,
	}, nil
}

func (u *employeeUseCase) GetByID(ctx context.Context, id string) (*EmployeeResponse, error) {
	employee, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.toResponse(employee), nil
}

func (u *employeeUseCase) GetByUserID(ctx context.Context, userID string) (*EmployeeResponse, error) {
	employee, err := u.Repository.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return u.toResponse(employee), nil
}

func (u *employeeUseCase) GetByDepartment(ctx context.Context, deptID string) ([]EmployeeResponse, error) {
	employees, err := u.Repository.GetByDepartment(ctx, deptID)
	if err != nil {
		return nil, err
	}

	var responses []EmployeeResponse
	for _, emp := range employees {
		responses = append(responses, *u.toResponse(&emp))
	}
	return responses, nil
}

func (u *employeeUseCase) GetTeam(ctx context.Context, managerID string) ([]EmployeeResponse, error) {
	employees, err := u.Repository.GetByManager(ctx, managerID)
	if err != nil {
		return nil, err
	}

	var responses []EmployeeResponse
	for _, emp := range employees {
		responses = append(responses, *u.toResponse(&emp))
	}
	return responses, nil
}

func (u *employeeUseCase) GetByTeamLeader(ctx context.Context, teamLeaderID string) ([]EmployeeResponse, error) {
	employees, err := u.Repository.GetByTeamLeader(ctx, teamLeaderID)
	if err != nil {
		return nil, err
	}

	var responses []EmployeeResponse
	for _, emp := range employees {
		responses = append(responses, *u.toResponse(&emp))
	}
	return responses, nil
}

func (u *employeeUseCase) GetByRole(ctx context.Context, role string) ([]EmployeeResponse, error) {
	employees, err := u.Repository.GetByRole(ctx, role)
	if err != nil {
		return nil, err
	}

	var responses []EmployeeResponse
	for _, emp := range employees {
		responses = append(responses, *u.toResponse(&emp))
	}
	return responses, nil
}

func (u *employeeUseCase) GetTeamLeaderOptions(ctx context.Context) ([]EmployeeResponse, error) {
	var responses []EmployeeResponse

	teamLeaders, err := u.Repository.GetByRole(ctx, "TEAM_LEADER")
	if err != nil {
		return nil, err
	}
	for _, emp := range teamLeaders {
		responses = append(responses, *u.toResponse(&emp))
	}

	return responses, nil
}

func (u *employeeUseCase) Create(ctx context.Context, request *CreateEmployeeRequest) (*EmployeeResponse, error) {
	// Check if NIP already exists
	existing, _ := u.Repository.GetByNIP(ctx, request.NIP)
	if existing != nil {
		return nil, errors.New("NIP already exists")
	}

	joinDate, err := ParseDate(request.JoinDate)
	if err != nil {
		return nil, errors.New("invalid join date format")
	}

	employeeType := entity.NormalizeEmployeeType(request.EmployeeType)
	if !isSupportedEmployeeType(employeeType) {
		return nil, errors.New("employee type must be FREELANCE_BURUH, PKWT, or KARYAWAN_TETAP")
	}

	basicSalary := request.BasicSalary
	allowance := request.Allowance
	dailyRate := request.DailyRate

	if entity.IsFreelanceEmployeeType(employeeType) {
		if dailyRate <= 0 && basicSalary > 0 {
			dailyRate = basicSalary
		}
		basicSalary = 0
		allowance = 0
	} else {
		dailyRate = 0
	}

	salary := basicSalary + allowance
	if entity.IsFreelanceEmployeeType(employeeType) {
		salary = dailyRate
	}
	if request.Salary > 0 {
		salary = request.Salary
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}
	hashedStr := string(hashedPassword)

	nipCopy := request.NIP
	employee := &entity.User{
		Name:               request.Name,
		Email:              request.Email,
		PasswordHash:       &hashedStr,
		Role:               entity.RoleEmployee, // Default role
		MustChangePassword: true,
		NIP:                &nipCopy,
		Phone:              request.Phone,
		Address:            request.Address,
		DepartmentID:       request.DepartmentID,
		PositionID:         request.PositionID,
		JoinDate:           &joinDate,
		EmployeeType:       employeeType,
		Status:             entity.EmployeeStatusActive,
		Photo:              request.Photo,
		KTPPhoto:           request.KTPPhoto,
		ManagerID:          request.ManagerID,
		TeamLeaderID:       request.TeamLeaderID,
		BasicSalary:        basicSalary,
		Allowance:          allowance,
		DailyRate:          dailyRate,
	}

	err = u.Repository.Create(ctx, employee)
	if err != nil {
		return nil, err
	}

	employee, err = u.Repository.GetByID(ctx, employee.ID)
	if err != nil {
		return nil, err
	}

	resp := u.toResponse(employee)
	resp.Salary = salary
	return resp, nil
}

func (u *employeeUseCase) Update(ctx context.Context, id string, request *UpdateEmployeeRequest) (*EmployeeResponse, error) {
	employee, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if request.Name != nil {
		employee.Name = *request.Name
	}
	if request.Email != nil {
		employee.Email = *request.Email
	}
	if request.Phone != nil {
		employee.Phone = *request.Phone
	}
	if request.Address != nil {
		employee.Address = *request.Address
	}
	if request.DepartmentID != nil {
		employee.DepartmentID = request.DepartmentID
	}
	if request.PositionID != nil {
		employee.PositionID = request.PositionID
	}
	if request.EmployeeType != nil {
		normalizedType := entity.NormalizeEmployeeType(*request.EmployeeType)
		if !isSupportedEmployeeType(normalizedType) {
			return nil, errors.New("employee type must be FREELANCE_BURUH, PKWT, or KARYAWAN_TETAP")
		}
		employee.EmployeeType = normalizedType
	}
	if request.Status != nil {
		employee.Status = entity.EmployeeStatus(*request.Status)
	}
	if request.Photo != nil {
		employee.Photo = *request.Photo
	}
	if request.KTPPhoto != nil {
		employee.KTPPhoto = *request.KTPPhoto
	}
	if request.ManagerID != nil {
		employee.ManagerID = request.ManagerID
	}
	if request.TeamLeaderID != nil {
		employee.TeamLeaderID = request.TeamLeaderID
	}
	if request.BasicSalary != nil {
		employee.BasicSalary = *request.BasicSalary
	}
	if request.Allowance != nil {
		employee.Allowance = *request.Allowance
	}
	if request.DailyRate != nil {
		employee.DailyRate = *request.DailyRate
	}

	if entity.IsFreelanceEmployeeType(employee.EmployeeType) {
		if employee.DailyRate <= 0 && request.BasicSalary != nil && *request.BasicSalary > 0 {
			employee.DailyRate = *request.BasicSalary
		}
		employee.BasicSalary = 0
		employee.Allowance = 0
	} else {
		employee.DailyRate = 0
	}

	err = u.Repository.Update(ctx, employee)
	if err != nil {
		return nil, err
	}

	employee, err = u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	resp := u.toResponse(employee)
	if request.BasicSalary != nil || request.Allowance != nil || request.DailyRate != nil || request.EmployeeType != nil {
		resp.Salary = calculateEmployeeSalary(employee)
	}
	return resp, nil
}

func (u *employeeUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return u.Repository.Delete(ctx, id)
}

func (u *employeeUseCase) GetDashboardStats(ctx context.Context, userID string) (*DashboardStatsResponse, error) {
	employee, err := u.Repository.GetByUserID(ctx, userID)
	if err != nil {
		return &DashboardStatsResponse{
			Employee:        nil,
			TodayAttendance: nil,
			TodayReport:     nil,
			RemainingLeave:  0,
			RecentPayroll:   nil,
		}, nil
	}

	response := &DashboardStatsResponse{
		Employee:        u.toResponse(employee),
		TodayAttendance: nil,
		TodayReport:     nil,
		RemainingLeave:  12,
		RecentPayroll:   nil,
	}

	return response, nil
}

func (u *employeeUseCase) GetHRStats(ctx context.Context) (*HRStatsResponse, error) {
	response := &HRStatsResponse{
		TotalEmployees:   0,
		TotalDepartments: 0,
		ActiveEmployees:  0,
		OnLeaveEmployees: 0,
	}
	return response, nil
}

func (u *employeeUseCase) GetManagerStats(ctx context.Context, userID string) (*ManagerStatsResponse, error) {
	response := &ManagerStatsResponse{
		TeamAttendance: []AttendanceResponse{},
		TeamLeaves:     []LeaveStatsResponse{},
		TeamReports:    []DailyReportResponse{},
	}
	return response, nil
}

func (u *employeeUseCase) toResponse(employee *entity.User) *EmployeeResponse {
	nipStr := ""
	if employee.NIP != nil {
		nipStr = *employee.NIP
	}
	joinDateStr := ""
	if employee.JoinDate != nil {
		joinDateStr = employee.JoinDate.Format("2006-01-02")
	}

	resp := &EmployeeResponse{
		ID:           employee.ID,
		NIP:          nipStr,
		Name:         employee.Name,
		Email:        employee.Email,
		Phone:        employee.Phone,
		Address:      employee.Address,
		JoinDate:     joinDateStr,
		EmployeeType: string(entity.NormalizeEmployeeType(string(employee.EmployeeType))),
		Status:       string(employee.Status),
		Photo:        employee.Photo,
		KTPPhoto:     employee.KTPPhoto,
		BasicSalary:  employee.BasicSalary,
		Allowance:    employee.Allowance,
		DailyRate:    employee.DailyRate,
		Salary:       calculateEmployeeSalary(employee),
	}

	if employee.DepartmentID != nil {
		resp.DepartmentID = employee.DepartmentID
		if employee.Department != nil {
			resp.DepartmentName = employee.Department.Name
			resp.Department = employee.Department
		}
	}

	if employee.PositionID != nil {
		resp.PositionID = employee.PositionID
		if employee.Position != nil {
			resp.PositionName = employee.Position.Name
			resp.Position = employee.Position
		}
	}

	if employee.ManagerID != nil {
		resp.ManagerID = employee.ManagerID
		if employee.Manager != nil {
			resp.ManagerName = employee.Manager.Name
			resp.Manager = employee.Manager
		}
	}

	if employee.TeamLeaderID != nil {
		resp.TeamLeaderID = employee.TeamLeaderID
		if employee.TeamLeader != nil {
			resp.TeamLeaderName = employee.TeamLeader.Name
			resp.TeamLeader = employee.TeamLeader
		}
	}

	return resp
}

func isSupportedEmployeeType(employeeType entity.EmployeeType) bool {
	switch entity.NormalizeEmployeeType(string(employeeType)) {
	case entity.EmployeeTypePermanent, entity.EmployeeTypePKWT, entity.EmployeeTypeFreelance:
		return true
	default:
		return false
	}
}

func calculateEmployeeSalary(employee *entity.User) float64 {
	if entity.IsFreelanceEmployeeType(employee.EmployeeType) {
		return employee.DailyRate
	}
	return employee.BasicSalary + employee.Allowance
}

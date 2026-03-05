package payroll

import (
	"context"
	"errors"
	"time"

	"hris_backend/entity"
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type PayrollResponse struct {
	ID              string  `json:"id"`
	EmployeeID      string  `json:"employeeId"`
	EmployeeName    string  `json:"employeeName"`
	Period          string  `json:"period"`
	BasicSalary     float64 `json:"basicSalary"`
	Allowance       float64 `json:"allowance"`
	Bonus           float64 `json:"bonus"`
	Overtime        float64 `json:"overtime"`
	LateDeduction   float64 `json:"lateDeduction"`
	AbsentDeduction float64 `json:"absentDeduction"`
	BPJS            float64 `json:"bpjs"`
	THT             float64 `json:"tht"`
	Tax             float64 `json:"tax"`
	OtherDeduction  float64 `json:"otherDeduction"`
	TotalIncome     float64 `json:"totalIncome"`
	TotalDeduction  float64 `json:"totalDeduction"`
	NetSalary       float64 `json:"netSalary"`
	WorkDays        int     `json:"workDays"`
	PresentDays     int     `json:"presentDays"`
	LateDays        int     `json:"lateDays"`
	AbsentDays      int     `json:"absentDays"`
	LeaveDays       int     `json:"leaveDays"`
	IsPaid          bool    `json:"isPaid"`
	PaidAt          *string `json:"paidAt"`
	Status          string  `json:"status"`
	CreatedAt       string  `json:"createdAt"`
}

type CreatePayrollRequest struct {
	EmployeeID      string  `json:"employeeId" validate:"required"`
	Period          string  `json:"period" validate:"required"`
	Bonus           float64 `json:"bonus"`
	Overtime        float64 `json:"overtime"`
	LateDeduction   float64 `json:"lateDeduction"`
	AbsentDeduction float64 `json:"absentDeduction"`
	BPJS            float64 `json:"bpjs"`
	THT             float64 `json:"tht"`
	Tax             float64 `json:"tax"`
	OtherDeduction  float64 `json:"otherDeduction"`
	Notes           string  `json:"notes"`
}

type PayrollRepository interface {
	GetByID(ctx context.Context, id string) (*entity.Payroll, error)
	GetByEmployeeAndPeriod(ctx context.Context, employeeID, period string) (*entity.Payroll, error)
	GetByEmployee(ctx context.Context, employeeID string) ([]entity.Payroll, error)
	GetAll(ctx context.Context, period string) ([]entity.Payroll, error)
	Create(ctx context.Context, payroll *entity.Payroll) error
	Update(ctx context.Context, payroll *entity.Payroll) error
	Delete(ctx context.Context, id string) error
	MarkAsPaid(ctx context.Context, id string) error
}

type payrollRepository struct {
	DB *gorm.DB
}

func NewPayrollRepository(db *gorm.DB) PayrollRepository {
	return &payrollRepository{DB: db}
}

func (r *payrollRepository) GetByID(ctx context.Context, id string) (*entity.Payroll, error) {
	payroll := new(entity.Payroll)
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		First(payroll, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("payroll not found")
		}
		return nil, err
	}
	return payroll, nil
}

func (r *payrollRepository) GetByEmployeeAndPeriod(ctx context.Context, employeeID, period string) (*entity.Payroll, error) {
	payroll := new(entity.Payroll)
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("employee_id = ? AND period = ?", employeeID, period).
		First(payroll).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("payroll not found")
		}
		return nil, err
	}
	return payroll, nil
}

func (r *payrollRepository) GetByEmployee(ctx context.Context, employeeID string) ([]entity.Payroll, error) {
	var payrolls []entity.Payroll
	err := r.DB.WithContext(ctx).
		Where("employee_id = ?", employeeID).
		Order("period DESC").
		Find(&payrolls).Error
	return payrolls, err
}

func (r *payrollRepository) GetAll(ctx context.Context, period string) ([]entity.Payroll, error) {
	var payrolls []entity.Payroll
	query := r.DB.WithContext(ctx).Preload("Employee")
	if period != "" {
		query = query.Where("period = ?", period)
	}
	err := query.Order("period DESC, employee_id").Find(&payrolls).Error
	return payrolls, err
}

func (r *payrollRepository) Create(ctx context.Context, payroll *entity.Payroll) error {
	return r.DB.WithContext(ctx).Create(payroll).Error
}

func (r *payrollRepository) Update(ctx context.Context, payroll *entity.Payroll) error {
	return r.DB.WithContext(ctx).Save(payroll).Error
}

func (r *payrollRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Payroll{}, "id = ?", id).Error
}

func (r *payrollRepository) MarkAsPaid(ctx context.Context, id string) error {
	now := time.Now()
	return r.DB.WithContext(ctx).Model(&entity.Payroll{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_paid": true,
			"paid_at": now,
		}).Error
}

type PayrollUseCase interface {
	GetByID(ctx context.Context, id string) (*PayrollResponse, error)
	GetByEmployeeAndPeriod(ctx context.Context, employeeID, period string) (*PayrollResponse, error)
	GetMyPayrolls(ctx context.Context, employeeID string) ([]PayrollResponse, error)
	GetAll(ctx context.Context, period string) ([]PayrollResponse, error)
	Create(ctx context.Context, request *CreatePayrollRequest) (*PayrollResponse, error)
	CalculatePayroll(ctx context.Context, employeeID, period string) (*PayrollResponse, error)
	CalculateAllPayroll(ctx context.Context, period string) ([]PayrollResponse, error)
	MarkAsPaid(ctx context.Context, id string) error
}

type payrollUseCase struct {
	DB         *gorm.DB
	Repository PayrollRepository
}

func NewPayrollUseCase(db *gorm.DB, repository PayrollRepository) PayrollUseCase {
	return &payrollUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *payrollUseCase) GetByID(ctx context.Context, id string) (*PayrollResponse, error) {
	payroll, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.toResponse(payroll), nil
}

func (u *payrollUseCase) GetByEmployeeAndPeriod(ctx context.Context, employeeID, period string) (*PayrollResponse, error) {
	payroll, err := u.Repository.GetByEmployeeAndPeriod(ctx, employeeID, period)
	if err != nil {
		return nil, err
	}
	return u.toResponse(payroll), nil
}

func (u *payrollUseCase) GetMyPayrolls(ctx context.Context, employeeID string) ([]PayrollResponse, error) {
	payrolls, err := u.Repository.GetByEmployee(ctx, employeeID)
	if err != nil {
		return nil, err
	}

	var responses []PayrollResponse
	for _, p := range payrolls {
		responses = append(responses, *u.toResponse(&p))
	}
	return responses, nil
}

func (u *payrollUseCase) GetAll(ctx context.Context, period string) ([]PayrollResponse, error) {
	payrolls, err := u.Repository.GetAll(ctx, period)
	if err != nil {
		return nil, err
	}

	var responses []PayrollResponse
	for _, p := range payrolls {
		responses = append(responses, *u.toResponse(&p))
	}
	return responses, nil
}

func (u *payrollUseCase) Create(ctx context.Context, request *CreatePayrollRequest) (*PayrollResponse, error) {
	var employee entity.User
	err := u.DB.WithContext(ctx).First(&employee, "id = ?", request.EmployeeID).Error
	if err != nil {
		return nil, errors.New("employee not found")
	}

	totalIncome := employee.BasicSalary + employee.Allowance + request.Bonus + request.Overtime
	totalDeduction := request.LateDeduction + request.AbsentDeduction + request.BPJS + request.THT + request.Tax + request.OtherDeduction
	netSalary := totalIncome - totalDeduction

	payroll := &entity.Payroll{
		EmployeeID:      request.EmployeeID,
		Period:          request.Period,
		BasicSalary:     employee.BasicSalary,
		Allowance:       employee.Allowance,
		Bonus:           request.Bonus,
		Overtime:        request.Overtime,
		LateDeduction:   request.LateDeduction,
		AbsentDeduction: request.AbsentDeduction,
		BPJS:            request.BPJS,
		THT:             request.THT,
		Tax:             request.Tax,
		OtherDeduction:  request.OtherDeduction,
		TotalIncome:     totalIncome,
		TotalDeduction:  totalDeduction,
		NetSalary:       netSalary,
		WorkDays:        22,
		PresentDays:     20,
		Notes:           request.Notes,
	}

	err = u.Repository.Create(ctx, payroll)
	if err != nil {
		return nil, err
	}

	payroll, _ = u.Repository.GetByID(ctx, payroll.ID)
	return u.toResponse(payroll), nil
}

func (u *payrollUseCase) CalculatePayroll(ctx context.Context, employeeID, period string) (*PayrollResponse, error) {
	existing, _ := u.Repository.GetByEmployeeAndPeriod(ctx, employeeID, period)
	if existing != nil {
		return u.toResponse(existing), nil
	}

	var employee entity.User
	err := u.DB.WithContext(ctx).First(&employee, "id = ?", employeeID).Error
	if err != nil {
		return nil, errors.New("employee not found")
	}

	totalIncome := employee.BasicSalary + employee.Allowance
	totalDeduction := 500000.0
	netSalary := totalIncome - totalDeduction

	payroll := &entity.Payroll{
		EmployeeID:      employeeID,
		Period:          period,
		BasicSalary:     employee.BasicSalary,
		Allowance:       employee.Allowance,
		Bonus:           0,
		Overtime:        0,
		LateDeduction:   0,
		AbsentDeduction: 0,
		BPJS:            300000,
		THT:             200000,
		Tax:             0,
		OtherDeduction:  0,
		TotalIncome:     totalIncome,
		TotalDeduction:  totalDeduction,
		NetSalary:       netSalary,
		WorkDays:        22,
		PresentDays:     22,
		LateDays:        0,
		AbsentDays:      0,
		LeaveDays:       0,
	}

	err = u.Repository.Create(ctx, payroll)
	if err != nil {
		return nil, err
	}

	payroll, _ = u.Repository.GetByID(ctx, payroll.ID)
	return u.toResponse(payroll), nil
}

func (u *payrollUseCase) MarkAsPaid(ctx context.Context, id string) error {
	return u.Repository.MarkAsPaid(ctx, id)
}

func (u *payrollUseCase) CalculateAllPayroll(ctx context.Context, period string) ([]PayrollResponse, error) {
	if period == "" {
		period = time.Now().Format("2006-01")
	}

	// Get all employees
	var employees []entity.User
	err := u.DB.WithContext(ctx).Where("status = ?", "ACTIVE").Find(&employees).Error
	if err != nil {
		return nil, err
	}

	var results []PayrollResponse
	for _, emp := range employees {
		payroll, err := u.CalculatePayroll(ctx, emp.ID, period)
		if err != nil {
			continue // Skip failed calculations
		}
		results = append(results, *payroll)
	}

	return results, nil
}

func (u *payrollUseCase) toResponse(payroll *entity.Payroll) *PayrollResponse {
	resp := &PayrollResponse{
		ID:              payroll.ID,
		EmployeeID:      payroll.EmployeeID,
		Period:          payroll.Period,
		BasicSalary:     payroll.BasicSalary,
		Allowance:       payroll.Allowance,
		Bonus:           payroll.Bonus,
		Overtime:        payroll.Overtime,
		LateDeduction:   payroll.LateDeduction,
		AbsentDeduction: payroll.AbsentDeduction,
		BPJS:            payroll.BPJS,
		THT:             payroll.THT,
		Tax:             payroll.Tax,
		OtherDeduction:  payroll.OtherDeduction,
		TotalIncome:     payroll.TotalIncome,
		TotalDeduction:  payroll.TotalDeduction,
		NetSalary:       payroll.NetSalary,
		WorkDays:        payroll.WorkDays,
		PresentDays:     payroll.PresentDays,
		LateDays:        payroll.LateDays,
		AbsentDays:      payroll.AbsentDays,
		LeaveDays:       payroll.LeaveDays,
		IsPaid:          payroll.IsPaid,
		CreatedAt:       payroll.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	if payroll.IsPaid {
		resp.Status = "paid"
	} else {
		resp.Status = "calculated"
	}

	if payroll.Employee.Name != "" {
		resp.EmployeeName = payroll.Employee.Name
	}
	if payroll.PaidAt != nil {
		paidAt := payroll.PaidAt.Format("2006-01-02 15:04:05")
		resp.PaidAt = &paidAt
	}

	return resp
}

type PayrollHandler interface {
	GetByID(ctx *fiber.Ctx) error
	GetMyPayrolls(ctx *fiber.Ctx) error
	GetMyOwnPayrolls(ctx *fiber.Ctx) error
	GetAll(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Calculate(ctx *fiber.Ctx) error
	CalculateAll(ctx *fiber.Ctx) error
	MarkAsPaid(ctx *fiber.Ctx) error
}

type payrollHandler struct {
	UseCase PayrollUseCase
	DB      *gorm.DB
}

func NewPayrollHandler(useCase PayrollUseCase, db *gorm.DB) PayrollHandler {
	return &payrollHandler{UseCase: useCase, DB: db}
}

func (h *payrollHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	payroll, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Payroll not found")
	}
	return helper.SuccessResponse(ctx, payroll)
}

func (h *payrollHandler) GetMyPayrolls(ctx *fiber.Ctx) error {
	employeeID := ctx.Params("employeeId")
	payrolls, err := h.UseCase.GetMyPayrolls(ctx.Context(), employeeID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, payrolls)
}

func (h *payrollHandler) GetMyOwnPayrolls(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}

	var employee entity.User
	err := h.DB.WithContext(ctx.Context()).First(&employee, "user_id = ?", userID.(string)).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return helper.BadRequestResponse(ctx, "Employee record not found for this user")
		}
		return helper.InternalServerErrorResponse(ctx, "Failed to lookup employee record")
	}

	payrolls, err := h.UseCase.GetMyPayrolls(ctx.Context(), employee.ID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, payrolls)
}

func (h *payrollHandler) GetAll(ctx *fiber.Ctx) error {
	period := ctx.Query("period")
	payrolls, err := h.UseCase.GetAll(ctx.Context(), period)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, payrolls)
}

func (h *payrollHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreatePayrollRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	payroll, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, payroll)
}

func (h *payrollHandler) Calculate(ctx *fiber.Ctx) error {
	employeeID := ctx.Params("employeeId")
	period := ctx.Query("period")

	if period == "" {
		period = time.Now().Format("2006-01")
	}

	payroll, err := h.UseCase.CalculatePayroll(ctx.Context(), employeeID, period)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, payroll)
}

func (h *payrollHandler) CalculateAll(ctx *fiber.Ctx) error {
	period := ctx.Query("period")

	if period == "" {
		period = time.Now().Format("2006-01")
	}

	payrolls, err := h.UseCase.CalculateAllPayroll(ctx.Context(), period)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, payrolls)
}

func (h *payrollHandler) MarkAsPaid(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.MarkAsPaid(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Marked as paid", nil)
}

package payroll

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"hris_backend/entity"
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

const (
	defaultMonthlyWorkDays = 22
	bpjsHealthSalaryCap    = 12000000.0
	annualPTKPDefault      = 54000000.0
)

type PayrollResponse struct {
	ID              string  `json:"id"`
	EmployeeID      string  `json:"employeeId"`
	EmployeeName    string  `json:"employeeName"`
	EmployeeType    string  `json:"employeeType"`
	Period          string  `json:"period"`
	BasicSalary     float64 `json:"basicSalary"`
	Allowance       float64 `json:"allowance"`
	Bonus           float64 `json:"bonus"`
	Commission      float64 `json:"commission"`
	Overtime        float64 `json:"overtime"`
	LateDeduction   float64 `json:"lateDeduction"`
	AbsentDeduction float64 `json:"absentDeduction"`
	BPJS            float64 `json:"bpjs"`
	BPJSEmployee    float64 `json:"bpjsEmployee"`
	BPJSEmployer    float64 `json:"bpjsEmployer"`
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
	IsProrated      bool    `json:"isProrated"`
	ProrateDays     int     `json:"prorateDays"`
	PeriodDays      int     `json:"periodDays"`
	ProrateFactor   float64 `json:"prorateFactor"`
	IsPaid          bool    `json:"isPaid"`
	PaidAt          *string `json:"paidAt"`
	Status          string  `json:"status"`
	CreatedAt       string  `json:"createdAt"`
}

type CreatePayrollRequest struct {
	EmployeeID      string  `json:"employeeId" validate:"required"`
	Period          string  `json:"period" validate:"required"`
	WorkDays        int     `json:"workDays"`
	Bonus           float64 `json:"bonus"`
	Commission      float64 `json:"commission"`
	Overtime        float64 `json:"overtime"`
	LateDeduction   float64 `json:"lateDeduction"`
	AbsentDeduction float64 `json:"absentDeduction"`
	BPJS            float64 `json:"bpjs"`
	BPJSEmployer    float64 `json:"bpjsEmployer"`
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
		Preload("Employee").
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
	GenerateSlipPDF(ctx context.Context, id string) ([]byte, string, error)
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
	if err := validatePeriod(request.Period); err != nil {
		return nil, err
	}

	if request.WorkDays < 0 || request.Bonus < 0 || request.Commission < 0 || request.Overtime < 0 ||
		request.LateDeduction < 0 || request.AbsentDeduction < 0 || request.BPJS < 0 || request.BPJSEmployer < 0 ||
		request.THT < 0 || request.Tax < 0 || request.OtherDeduction < 0 {
		return nil, errors.New("all numeric payroll values must be zero or greater")
	}

	var employee entity.User
	err := u.DB.WithContext(ctx).First(&employee, "id = ?", request.EmployeeID).Error
	if err != nil {
		return nil, errors.New("employee not found")
	}

	employeeType := entity.NormalizeEmployeeType(string(employee.EmployeeType))
	workDays := request.WorkDays
	presentDays := request.WorkDays
	basicSalary := 0.0
	allowance := 0.0
	proration := prorationSummary{}

	if entity.IsFreelanceEmployeeType(employeeType) {
		if employee.DailyRate <= 0 {
			return nil, errors.New("daily rate for freelance employee is not configured")
		}
		if workDays <= 0 {
			return nil, errors.New("workDays is required for freelance employee payroll")
		}
		periodStart, periodEnd, periodErr := getPeriodRange(request.Period)
		if periodErr != nil {
			return nil, periodErr
		}
		periodDays := int(periodEnd.Sub(periodStart).Hours()/24) + 1
		basicSalary = roundCurrency(float64(workDays) * employee.DailyRate)
		allowance = 0
		presentDays = workDays
		proration = prorationSummary{
			IsProrated:    false,
			ProrateFactor: 1,
			ProrateDays:   periodDays,
			PeriodDays:    periodDays,
			WorkDays:      workDays,
		}
	} else {
		proration, err = buildProrationSummary(employee.JoinDate, request.Period)
		if err != nil {
			return nil, err
		}
		basicSalary = roundCurrency(employee.BasicSalary * proration.ProrateFactor)
		allowance = roundCurrency(employee.Allowance * proration.ProrateFactor)
		if workDays <= 0 {
			workDays = proration.WorkDays
			presentDays = proration.WorkDays
		}
	}

	bonus := roundCurrency(request.Bonus)
	commission := roundCurrency(request.Commission)
	overtime := roundCurrency(request.Overtime)
	lateDeduction := roundCurrency(request.LateDeduction)
	absentDeduction := roundCurrency(request.AbsentDeduction)
	otherDeduction := roundCurrency(request.OtherDeduction)

	totalIncome := roundCurrency(basicSalary + allowance + bonus + commission + overtime)

	autoBPJSEmployee, autoBPJSEmployer := calculateBPJSSplit(basicSalary + allowance)
	bpjsEmployee := autoBPJSEmployee
	if request.BPJS > 0 {
		bpjsEmployee = roundCurrency(request.BPJS)
	}
	bpjsEmployer := autoBPJSEmployer
	if request.BPJSEmployer > 0 {
		bpjsEmployer = roundCurrency(request.BPJSEmployer)
	}

	tht := calculateTHTEmployee(basicSalary)
	if request.THT > 0 {
		tht = roundCurrency(request.THT)
	}

	tax := calculateMonthlyPPh21(totalIncome, bpjsEmployee, tht)
	if request.Tax > 0 {
		tax = roundCurrency(request.Tax)
	}

	totalDeduction := roundCurrency(lateDeduction + absentDeduction + bpjsEmployee + tht + tax + otherDeduction)
	netSalary := roundCurrency(totalIncome - totalDeduction)

	payroll := &entity.Payroll{
		EmployeeID:      request.EmployeeID,
		Period:          request.Period,
		EmployeeType:    string(employeeType),
		BasicSalary:     basicSalary,
		Allowance:       allowance,
		Bonus:           bonus,
		Commission:      commission,
		Overtime:        overtime,
		LateDeduction:   lateDeduction,
		AbsentDeduction: absentDeduction,
		BPJS:            bpjsEmployee,
		BPJSEmployee:    bpjsEmployee,
		BPJSEmployer:    bpjsEmployer,
		THT:             tht,
		Tax:             tax,
		OtherDeduction:  otherDeduction,
		TotalIncome:     totalIncome,
		TotalDeduction:  totalDeduction,
		NetSalary:       netSalary,
		WorkDays:        workDays,
		PresentDays:     presentDays,
		IsProrated:      proration.IsProrated,
		ProrateDays:     proration.ProrateDays,
		PeriodDays:      proration.PeriodDays,
		ProrateFactor:   proration.ProrateFactor,
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
	if err := validatePeriod(period); err != nil {
		return nil, err
	}

	existing, _ := u.Repository.GetByEmployeeAndPeriod(ctx, employeeID, period)
	if existing != nil {
		return u.toResponse(existing), nil
	}

	var employee entity.User
	err := u.DB.WithContext(ctx).First(&employee, "id = ?", employeeID).Error
	if err != nil {
		return nil, errors.New("employee not found")
	}

	employeeType := entity.NormalizeEmployeeType(string(employee.EmployeeType))
	if entity.IsFreelanceEmployeeType(employeeType) {
		return nil, errors.New("freelance payroll requires manual input workDays and should be created via create payroll endpoint")
	}

	proration, err := buildProrationSummary(employee.JoinDate, period)
	if err != nil {
		return nil, err
	}

	basicSalary := roundCurrency(employee.BasicSalary * proration.ProrateFactor)
	allowance := roundCurrency(employee.Allowance * proration.ProrateFactor)
	totalIncome := roundCurrency(basicSalary + allowance)
	bpjsEmployee, bpjsEmployer := calculateBPJSSplit(basicSalary + allowance)
	tht := calculateTHTEmployee(basicSalary)
	tax := calculateMonthlyPPh21(totalIncome, bpjsEmployee, tht)
	totalDeduction := roundCurrency(bpjsEmployee + tht + tax)
	netSalary := roundCurrency(totalIncome - totalDeduction)

	payroll := &entity.Payroll{
		EmployeeID:      employeeID,
		Period:          period,
		EmployeeType:    string(employeeType),
		BasicSalary:     basicSalary,
		Allowance:       allowance,
		Bonus:           0,
		Commission:      0,
		Overtime:        0,
		LateDeduction:   0,
		AbsentDeduction: 0,
		BPJS:            bpjsEmployee,
		BPJSEmployee:    bpjsEmployee,
		BPJSEmployer:    bpjsEmployer,
		THT:             tht,
		Tax:             tax,
		OtherDeduction:  0,
		TotalIncome:     totalIncome,
		TotalDeduction:  totalDeduction,
		NetSalary:       netSalary,
		WorkDays:        proration.WorkDays,
		PresentDays:     proration.WorkDays,
		LateDays:        0,
		AbsentDays:      0,
		LeaveDays:       0,
		IsProrated:      proration.IsProrated,
		ProrateDays:     proration.ProrateDays,
		PeriodDays:      proration.PeriodDays,
		ProrateFactor:   proration.ProrateFactor,
	}

	err = u.Repository.Create(ctx, payroll)
	if err != nil {
		return nil, err
	}

	payroll, _ = u.Repository.GetByID(ctx, payroll.ID)
	return u.toResponse(payroll), nil
}

func (u *payrollUseCase) GenerateSlipPDF(ctx context.Context, id string) ([]byte, string, error) {
	payroll, err := u.GetByID(ctx, id)
	if err != nil {
		return nil, "", err
	}

	pdfBytes, filename, err := generatePayslipPDF(payroll)
	if err != nil {
		return nil, "", err
	}
	return pdfBytes, filename, nil
}

func (u *payrollUseCase) MarkAsPaid(ctx context.Context, id string) error {
	return u.Repository.MarkAsPaid(ctx, id)
}

func (u *payrollUseCase) CalculateAllPayroll(ctx context.Context, period string) ([]PayrollResponse, error) {
	if period == "" {
		period = time.Now().Format("2006-01")
	}

	if err := validatePeriod(period); err != nil {
		return nil, err
	}

	var employees []entity.User
	err := u.DB.WithContext(ctx).Where("status = ?", "ACTIVE").Find(&employees).Error
	if err != nil {
		return nil, err
	}

	var results []PayrollResponse
	for _, emp := range employees {
		payroll, err := u.CalculatePayroll(ctx, emp.ID, period)
		if err != nil {
			continue
		}
		results = append(results, *payroll)
	}

	return results, nil
}

func (u *payrollUseCase) toResponse(payroll *entity.Payroll) *PayrollResponse {
	bpjsEmployee := payroll.BPJSEmployee
	if bpjsEmployee <= 0 {
		bpjsEmployee = payroll.BPJS
	}

	resp := &PayrollResponse{
		ID:              payroll.ID,
		EmployeeID:      payroll.EmployeeID,
		EmployeeType:    "",
		Period:          payroll.Period,
		BasicSalary:     payroll.BasicSalary,
		Allowance:       payroll.Allowance,
		Bonus:           payroll.Bonus,
		Commission:      payroll.Commission,
		Overtime:        payroll.Overtime,
		LateDeduction:   payroll.LateDeduction,
		AbsentDeduction: payroll.AbsentDeduction,
		BPJS:            bpjsEmployee,
		BPJSEmployee:    bpjsEmployee,
		BPJSEmployer:    payroll.BPJSEmployer,
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
		IsProrated:      payroll.IsProrated,
		ProrateDays:     payroll.ProrateDays,
		PeriodDays:      payroll.PeriodDays,
		ProrateFactor:   payroll.ProrateFactor,
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
	if strings.TrimSpace(payroll.EmployeeType) != "" {
		resp.EmployeeType = string(entity.NormalizeEmployeeType(payroll.EmployeeType))
	} else if payroll.Employee.EmployeeType != "" {
		resp.EmployeeType = string(entity.NormalizeEmployeeType(string(payroll.Employee.EmployeeType)))
	} else {
		resp.EmployeeType = string(entity.EmployeeTypePermanent)
	}
	if payroll.PaidAt != nil {
		paidAt := payroll.PaidAt.Format("2006-01-02 15:04:05")
		resp.PaidAt = &paidAt
	}

	if resp.ProrateFactor <= 0 {
		resp.ProrateFactor = 1
	}
	if resp.PeriodDays <= 0 {
		_, periodEnd, err := getPeriodRange(resp.Period)
		if err == nil {
			resp.PeriodDays = int(periodEnd.Sub(time.Date(periodEnd.Year(), periodEnd.Month(), 1, 0, 0, 0, 0, time.UTC)).Hours()/24) + 1
		}
	}
	if resp.ProrateDays <= 0 {
		resp.ProrateDays = resp.PeriodDays
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
	DownloadSlipPDF(ctx *fiber.Ctx) error
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
	err := h.DB.WithContext(ctx.Context()).First(&employee, "id = ?", userID.(string)).Error
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

func (h *payrollHandler) DownloadSlipPDF(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	pdfBytes, filename, err := h.UseCase.GenerateSlipPDF(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	ctx.Set("Content-Type", "application/pdf")
	ctx.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	return ctx.Send(pdfBytes)
}

func (h *payrollHandler) MarkAsPaid(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.MarkAsPaid(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Marked as paid", nil)
}

type prorationSummary struct {
	IsProrated    bool
	ProrateFactor float64
	ProrateDays   int
	PeriodDays    int
	WorkDays      int
}

func validatePeriod(period string) error {
	if strings.TrimSpace(period) == "" {
		return errors.New("period is required")
	}
	if _, err := time.Parse("2006-01", period); err != nil {
		return errors.New("period must use format YYYY-MM")
	}
	return nil
}

func getPeriodRange(period string) (time.Time, time.Time, error) {
	parsed, err := time.Parse("2006-01", period)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("period must use format YYYY-MM")
	}
	start := time.Date(parsed.Year(), parsed.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, -1)
	return start, end, nil
}

func buildProrationSummary(joinDate *time.Time, period string) (prorationSummary, error) {
	start, end, err := getPeriodRange(period)
	if err != nil {
		return prorationSummary{}, err
	}

	periodDays := int(end.Sub(start).Hours()/24) + 1
	summary := prorationSummary{
		IsProrated:    false,
		ProrateFactor: 1,
		ProrateDays:   periodDays,
		PeriodDays:    periodDays,
		WorkDays:      defaultMonthlyWorkDays,
	}

	if joinDate == nil {
		return summary, nil
	}

	join := time.Date(joinDate.Year(), joinDate.Month(), joinDate.Day(), 0, 0, 0, 0, time.UTC)
	if join.After(end) {
		return summary, errors.New("employee join date is after selected payroll period")
	}

	if join.After(start) {
		prorateDays := int(end.Sub(join).Hours()/24) + 1
		prorateFactor := float64(prorateDays) / float64(periodDays)
		workDays := int(math.Round(float64(defaultMonthlyWorkDays) * prorateFactor))
		if workDays < 1 {
			workDays = 1
		}

		summary.IsProrated = true
		summary.ProrateFactor = roundTo(prorateFactor, 6)
		summary.ProrateDays = prorateDays
		summary.WorkDays = workDays
	}

	return summary, nil
}

func calculateBPJSSplit(monthlyWage float64) (float64, float64) {
	contributionBase := monthlyWage
	if contributionBase < 0 {
		contributionBase = 0
	}
	if contributionBase > bpjsHealthSalaryCap {
		contributionBase = bpjsHealthSalaryCap
	}

	employee := roundCurrency(contributionBase * 0.01)
	employer := roundCurrency(contributionBase * 0.04)
	return employee, employer
}

func calculateTHTEmployee(basicSalary float64) float64 {
	if basicSalary <= 0 {
		return 0
	}
	return roundCurrency(basicSalary * 0.02)
}

func calculateMonthlyPPh21(totalIncome, bpjsEmployee, tht float64) float64 {
	taxableMonthlyIncome := totalIncome - bpjsEmployee - tht
	if taxableMonthlyIncome <= 0 {
		return 0
	}

	annualTaxableIncome := (taxableMonthlyIncome * 12) - annualPTKPDefault
	if annualTaxableIncome <= 0 {
		return 0
	}

	annualPKP := math.Floor(annualTaxableIncome/1000) * 1000
	annualTax := calculateProgressivePPh21(annualPKP)
	return roundCurrency(annualTax / 12)
}

func calculateProgressivePPh21(annualPKP float64) float64 {
	remaining := annualPKP
	if remaining <= 0 {
		return 0
	}

	totalTax := 0.0
	consume := func(limit, rate float64) {
		if remaining <= 0 {
			return
		}
		taxable := math.Min(remaining, limit)
		totalTax += taxable * rate
		remaining -= taxable
	}

	consume(60000000, 0.05)
	consume(190000000, 0.15)
	consume(250000000, 0.25)
	consume(4500000000, 0.30)
	if remaining > 0 {
		totalTax += remaining * 0.35
	}

	return totalTax
}

func roundCurrency(value float64) float64 {
	return roundTo(value, 2)
}

func roundTo(value float64, precision int) float64 {
	factor := math.Pow(10, float64(precision))
	return math.Round(value*factor) / factor
}

package dailyreport

import (
	"context"
	"errors"
	"time"

	"hris_backend/entity"
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type DailyReportResponse struct {
	ID           string                    `json:"id"`
	EmployeeID   string                    `json:"employeeId"`
	EmployeeName string                    `json:"employeeName"`
	Date         string                    `json:"date"`
	Notes        string                    `json:"notes"`
	Status       string                    `json:"status"`
	ApprovedBy   *string                   `json:"approvedBy"`
	ApprovedAt   *string                   `json:"approvedAt"`
	CreatedAt    string                    `json:"createdAt"`
	Items        []DailyReportItemResponse `json:"items"`
}

type DailyReportItemResponse struct {
	ID          string `json:"id"`
	ReportID    string `json:"reportId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Progress    int    `json:"progress"`
	Status      string `json:"status"`
}

type CreateDailyReportRequest struct {
	EmployeeID string                    `json:"employeeId" validate:"required"`
	Date       string                    `json:"date" validate:"required"`
	Notes      string                    `json:"notes"`
	Items      []CreateReportItemRequest `json:"items"`
}

type CreateReportItemRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	Progress    int    `json:"progress"`
}

type UpdateReportItemRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Progress    *int    `json:"progress,omitempty"`
	Status      *string `json:"status,omitempty"`
}

type ApproveReportRequest struct {
	Status string `json:"status" validate:"required,oneof=APPROVED REJECTED"`
}

type DailyReportRepository interface {
	GetByID(ctx context.Context, id string) (*entity.DailyReport, error)
	GetByEmployee(ctx context.Context, employeeID string, date time.Time) (*entity.DailyReport, error)
	GetByEmployeeRange(ctx context.Context, employeeID string, startDate, endDate time.Time) ([]entity.DailyReport, error)
	GetByManager(ctx context.Context, managerID string, startDate, endDate time.Time) ([]entity.DailyReport, error)
	GetPending(ctx context.Context) ([]entity.DailyReport, error)
	Create(ctx context.Context, report *entity.DailyReport) error
	Update(ctx context.Context, report *entity.DailyReport) error
	Delete(ctx context.Context, id string) error

	// Items
	CreateItem(ctx context.Context, item *entity.DailyReportItem) error
	UpdateItem(ctx context.Context, item *entity.DailyReportItem) error
	DeleteItem(ctx context.Context, id string) error
	GetItemsByReportID(ctx context.Context, reportID string) ([]entity.DailyReportItem, error)
}

type dailyReportRepository struct {
	DB *gorm.DB
}

func NewDailyReportRepository(db *gorm.DB) DailyReportRepository {
	return &dailyReportRepository{DB: db}
}

func (r *dailyReportRepository) GetByID(ctx context.Context, id string) (*entity.DailyReport, error) {
	report := new(entity.DailyReport)
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Preload("Items").
		First(report, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("report not found")
		}
		return nil, err
	}
	return report, nil
}

func (r *dailyReportRepository) GetByEmployee(ctx context.Context, employeeID string, date time.Time) (*entity.DailyReport, error) {
	report := new(entity.DailyReport)
	err := r.DB.WithContext(ctx).
		Preload("Items").
		Where("employee_id = ? AND date = ?", employeeID, date).
		First(report).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("report not found")
		}
		return nil, err
	}
	return report, nil
}

func (r *dailyReportRepository) GetByEmployeeRange(ctx context.Context, employeeID string, startDate, endDate time.Time) ([]entity.DailyReport, error) {
	var reports []entity.DailyReport
	err := r.DB.WithContext(ctx).
		Preload("Items").
		Where("employee_id = ? AND date >= ? AND date <= ?", employeeID, startDate, endDate).
		Order("date DESC").
		Find(&reports).Error
	return reports, err
}

func (r *dailyReportRepository) GetByManager(ctx context.Context, managerID string, startDate, endDate time.Time) ([]entity.DailyReport, error) {
	var reports []entity.DailyReport
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Preload("Items").
		Joins("JOIN employees ON employees.id = daily_reports.employee_id").
		Where("employees.manager_id = ? AND daily_reports.date >= ? AND daily_reports.date <= ?", managerID, startDate, endDate).
		Order("daily_reports.date DESC").
		Find(&reports).Error
	return reports, err
}

func (r *dailyReportRepository) GetPending(ctx context.Context) ([]entity.DailyReport, error) {
	var reports []entity.DailyReport
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Preload("Items").
		Where("status = ?", entity.DailyReportStatusPending).
		Order("created_at ASC").
		Find(&reports).Error
	return reports, err
}

func (r *dailyReportRepository) Create(ctx context.Context, report *entity.DailyReport) error {
	return r.DB.WithContext(ctx).Create(report).Error
}

func (r *dailyReportRepository) Update(ctx context.Context, report *entity.DailyReport) error {
	return r.DB.WithContext(ctx).Save(report).Error
}

func (r *dailyReportRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.DailyReport{}, "id = ?", id).Error
}

func (r *dailyReportRepository) CreateItem(ctx context.Context, item *entity.DailyReportItem) error {
	return r.DB.WithContext(ctx).Create(item).Error
}

func (r *dailyReportRepository) UpdateItem(ctx context.Context, item *entity.DailyReportItem) error {
	return r.DB.WithContext(ctx).Save(item).Error
}

func (r *dailyReportRepository) DeleteItem(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.DailyReportItem{}, "id = ?", id).Error
}

func (r *dailyReportRepository) GetItemsByReportID(ctx context.Context, reportID string) ([]entity.DailyReportItem, error) {
	var items []entity.DailyReportItem
	err := r.DB.WithContext(ctx).Where("report_id = ?", reportID).Find(&items).Error
	return items, err
}

type DailyReportUseCase interface {
	GetByID(ctx context.Context, id string) (*DailyReportResponse, error)
	GetByEmployee(ctx context.Context, employeeID string, date string) (*DailyReportResponse, error)
	GetMyReports(ctx context.Context, employeeID string, startDate, endDate string) ([]DailyReportResponse, error)
	GetTeamReports(ctx context.Context, managerID string, startDate, endDate string) ([]DailyReportResponse, error)
	GetPending(ctx context.Context) ([]DailyReportResponse, error)
	Create(ctx context.Context, request *CreateDailyReportRequest) (*DailyReportResponse, error)
	Approve(ctx context.Context, id string, approvedBy string, request *ApproveReportRequest) (*DailyReportResponse, error)
}

type dailyReportUseCase struct {
	DB         *gorm.DB
	Repository DailyReportRepository
}

func NewDailyReportUseCase(db *gorm.DB, repository DailyReportRepository) DailyReportUseCase {
	return &dailyReportUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *dailyReportUseCase) GetByID(ctx context.Context, id string) (*DailyReportResponse, error) {
	report, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.toResponse(report), nil
}

func (u *dailyReportUseCase) GetByEmployee(ctx context.Context, employeeID string, date string) (*DailyReportResponse, error) {
	dateParsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, errors.New("invalid date format")
	}

	report, err := u.Repository.GetByEmployee(ctx, employeeID, dateParsed)
	if err != nil {
		return nil, err
	}
	return u.toResponse(report), nil
}

func (u *dailyReportUseCase) GetMyReports(ctx context.Context, employeeID string, startDate, endDate string) ([]DailyReportResponse, error) {
	start, _ := time.Parse("2006-01-02", startDate)
	if startDate == "" {
		start = time.Now().AddDate(0, 0, -30)
	}
	end, _ := time.Parse("2006-01-02", endDate)
	if endDate == "" {
		end = time.Now()
	}

	reports, err := u.Repository.GetByEmployeeRange(ctx, employeeID, start, end)
	if err != nil {
		return nil, err
	}

	var responses []DailyReportResponse
	for _, report := range reports {
		responses = append(responses, *u.toResponse(&report))
	}
	return responses, nil
}

func (u *dailyReportUseCase) GetTeamReports(ctx context.Context, managerID string, startDate, endDate string) ([]DailyReportResponse, error) {
	start, _ := time.Parse("2006-01-02", startDate)
	if startDate == "" {
		start = time.Now().AddDate(0, 0, -30)
	}
	end, _ := time.Parse("2006-01-02", endDate)
	if endDate == "" {
		end = time.Now()
	}

	reports, err := u.Repository.GetByManager(ctx, managerID, start, end)
	if err != nil {
		return nil, err
	}

	var responses []DailyReportResponse
	for _, report := range reports {
		responses = append(responses, *u.toResponse(&report))
	}
	return responses, nil
}

func (u *dailyReportUseCase) GetPending(ctx context.Context) ([]DailyReportResponse, error) {
	reports, err := u.Repository.GetPending(ctx)
	if err != nil {
		return nil, err
	}

	var responses []DailyReportResponse
	for _, report := range reports {
		responses = append(responses, *u.toResponse(&report))
	}
	return responses, nil
}

func (u *dailyReportUseCase) Create(ctx context.Context, request *CreateDailyReportRequest) (*DailyReportResponse, error) {
	date, err := time.Parse("2006-01-02", request.Date)
	if err != nil {
		return nil, errors.New("invalid date format")
	}

	// Check if report already exists for this date
	existing, _ := u.Repository.GetByEmployee(ctx, request.EmployeeID, date)
	if existing != nil {
		return nil, errors.New("report already exists for this date")
	}

	report := &entity.DailyReport{
		EmployeeID: request.EmployeeID,
		Date:       date,
		Notes:      request.Notes,
		Status:     entity.DailyReportStatusPending,
	}

	err = u.Repository.Create(ctx, report)
	if err != nil {
		return nil, err
	}

	// Create items
	for _, item := range request.Items {
		reportItem := &entity.DailyReportItem{
			ReportID:    report.ID,
			Title:       item.Title,
			Description: item.Description,
			Progress:    item.Progress,
			Status:      entity.TaskStatusPending,
		}
		u.Repository.CreateItem(ctx, reportItem)
	}

	report, _ = u.Repository.GetByID(ctx, report.ID)
	return u.toResponse(report), nil
}

func (u *dailyReportUseCase) Approve(ctx context.Context, id string, approvedBy string, request *ApproveReportRequest) (*DailyReportResponse, error) {
	report, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if report.Status != entity.DailyReportStatusPending {
		return nil, errors.New("report is not pending")
	}

	report.Status = entity.DailyReportStatus(request.Status)
	report.ApprovedBy = &approvedBy
	now := time.Now()
	report.ApprovedAt = &now

	err = u.Repository.Update(ctx, report)
	if err != nil {
		return nil, err
	}

	report, _ = u.Repository.GetByID(ctx, id)
	return u.toResponse(report), nil
}

func (u *dailyReportUseCase) toResponse(report *entity.DailyReport) *DailyReportResponse {
	resp := &DailyReportResponse{
		ID:         report.ID,
		EmployeeID: report.EmployeeID,
		Date:       report.Date.Format("2006-01-02"),
		Notes:      report.Notes,
		Status:     string(report.Status),
		ApprovedBy: report.ApprovedBy,
		CreatedAt:  report.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	if report.Employee.Name != "" {
		resp.EmployeeName = report.Employee.Name
	}
	if report.ApprovedAt != nil {
		approvedAt := report.ApprovedAt.Format("2006-01-02 15:04:05")
		resp.ApprovedAt = &approvedAt
	}

	var items []DailyReportItemResponse
	for _, item := range report.Items {
		items = append(items, DailyReportItemResponse{
			ID:          item.ID,
			ReportID:    item.ReportID,
			Title:       item.Title,
			Description: item.Description,
			Progress:    item.Progress,
			Status:      string(item.Status),
		})
	}
	resp.Items = items

	return resp
}

type DailyReportHandler interface {
	GetByID(ctx *fiber.Ctx) error
	GetMyOwnReports(ctx *fiber.Ctx) error
	GetMyReports(ctx *fiber.Ctx) error
	GetTeamReports(ctx *fiber.Ctx) error
	GetPending(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Approve(ctx *fiber.Ctx) error
}

type dailyReportHandler struct {
	UseCase DailyReportUseCase
	DB      *gorm.DB
}

func NewDailyReportHandler(useCase DailyReportUseCase, db *gorm.DB) DailyReportHandler {
	return &dailyReportHandler{UseCase: useCase, DB: db}
}

func (h *dailyReportHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	report, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Report not found")
	}
	return helper.SuccessResponse(ctx, report)
}

func (h *dailyReportHandler) GetMyReports(ctx *fiber.Ctx) error {
	employeeID := ctx.Params("employeeId")
	startDate := ctx.Query("startDate")
	endDate := ctx.Query("endDate")

	reports, err := h.UseCase.GetMyReports(ctx.Context(), employeeID, startDate, endDate)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, reports)
}

// GetMyOwnReports gets the current authenticated user's daily reports
func (h *dailyReportHandler) GetMyOwnReports(ctx *fiber.Ctx) error {
	// Get user ID from JWT token
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}

	// Get employee by user ID
	var employee entity.User
	err := h.DB.WithContext(ctx.Context()).First(&employee, "id = ?", userID.(string)).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// User has no linked employee record, return empty list gracefully
			return helper.SuccessResponse(ctx, []DailyReportResponse{})
		}
		return helper.InternalServerErrorResponse(ctx, "Failed to lookup employee record")
	}

	startDate := ctx.Query("startDate")
	endDate := ctx.Query("endDate")

	reports, err := h.UseCase.GetMyReports(ctx.Context(), employee.ID, startDate, endDate)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, reports)
}

func (h *dailyReportHandler) GetTeamReports(ctx *fiber.Ctx) error {
	managerID := ctx.Params("managerId")
	startDate := ctx.Query("startDate")
	endDate := ctx.Query("endDate")

	reports, err := h.UseCase.GetTeamReports(ctx.Context(), managerID, startDate, endDate)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, reports)
}

func (h *dailyReportHandler) GetPending(ctx *fiber.Ctx) error {
	reports, err := h.UseCase.GetPending(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, reports)
}

func (h *dailyReportHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateDailyReportRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	report, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, report)
}

func (h *dailyReportHandler) Approve(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	approvedBy := ctx.Params("approvedBy")
	request := new(ApproveReportRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	report, err := h.UseCase.Approve(ctx.Context(), id, approvedBy, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, report)
}

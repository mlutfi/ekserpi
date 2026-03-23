package leave

import (
	"context"
	"errors"
	"time"

	"hris_backend/entity"
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type LeaveResponse struct {
	ID             string  `json:"id"`
	EmployeeID     string  `json:"employeeId"`
	EmployeeName   string  `json:"employeeName"`
	LeaveType      string  `json:"leaveType"`
	StartDate      string  `json:"startDate"`
	EndDate        string  `json:"endDate"`
	Reason         string  `json:"reason"`
	Status         string  `json:"status"`
	ApprovedBy     *string `json:"approvedBy"`
	ApprovedByName string  `json:"approvedByName"`
	ApprovedAt     *string `json:"approvedAt"`
	CreatedAt      string  `json:"createdAt"`
}

type CreateLeaveRequest struct {
	EmployeeID string `json:"employeeId" validate:"required"`
	LeaveType  string `json:"leaveType" validate:"required,oneof=ANNUAL SICK PERSONAL MATERNITY PATERNITY UNPAID"`
	StartDate  string `json:"startDate" validate:"required"`
	EndDate    string `json:"endDate" validate:"required"`
	Reason     string `json:"reason" validate:"required"`
}

type ApproveLeaveRequest struct {
	Status string `json:"status" validate:"required,oneof=APPROVED REJECTED"`
}

type LeaveRepository interface {
	GetByID(ctx context.Context, id string) (*entity.LeaveRequest, error)
	GetByEmployee(ctx context.Context, employeeID string) ([]entity.LeaveRequest, error)
	GetPending(ctx context.Context) ([]entity.LeaveRequest, error)
	GetByManager(ctx context.Context, managerID string) ([]entity.LeaveRequest, error)
	Create(ctx context.Context, leave *entity.LeaveRequest) error
	Update(ctx context.Context, leave *entity.LeaveRequest) error
	Delete(ctx context.Context, id string) error
}

type leaveRepository struct {
	DB *gorm.DB
}

func NewLeaveRepository(db *gorm.DB) LeaveRepository {
	return &leaveRepository{DB: db}
}

func (r *leaveRepository) GetByID(ctx context.Context, id string) (*entity.LeaveRequest, error) {
	leave := new(entity.LeaveRequest)
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Preload("Approver").
		First(leave, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("leave request not found")
		}
		return nil, err
	}
	return leave, nil
}

func (r *leaveRepository) GetByEmployee(ctx context.Context, employeeID string) ([]entity.LeaveRequest, error) {
	var leaves []entity.LeaveRequest
	err := r.DB.WithContext(ctx).
		Preload("Approver").
		Where("employee_id = ?", employeeID).
		Order("created_at DESC").
		Find(&leaves).Error
	return leaves, err
}

func (r *leaveRepository) GetPending(ctx context.Context) ([]entity.LeaveRequest, error) {
	var leaves []entity.LeaveRequest
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("status = ?", entity.LeaveStatusPending).
		Order("created_at ASC").
		Find(&leaves).Error
	return leaves, err
}

func (r *leaveRepository) GetByManager(ctx context.Context, managerID string) ([]entity.LeaveRequest, error) {
	var leaves []entity.LeaveRequest
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Joins("JOIN users ON users.id = leave_requests.employee_id").
		Where("users.manager_id = ?", managerID).
		Order("leave_requests.created_at DESC").
		Find(&leaves).Error
	return leaves, err
}

func (r *leaveRepository) Create(ctx context.Context, leave *entity.LeaveRequest) error {
	return r.DB.WithContext(ctx).Create(leave).Error
}

func (r *leaveRepository) Update(ctx context.Context, leave *entity.LeaveRequest) error {
	return r.DB.WithContext(ctx).Save(leave).Error
}

func (r *leaveRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.LeaveRequest{}, "id = ?", id).Error
}

type LeaveUseCase interface {
	GetByID(ctx context.Context, id string) (*LeaveResponse, error)
	GetByEmployee(ctx context.Context, employeeID string) ([]LeaveResponse, error)
	GetPending(ctx context.Context) ([]LeaveResponse, error)
	GetTeamLeaves(ctx context.Context, managerID string) ([]LeaveResponse, error)
	Create(ctx context.Context, request *CreateLeaveRequest) (*LeaveResponse, error)
	Approve(ctx context.Context, id string, approvedBy string, request *ApproveLeaveRequest) (*LeaveResponse, error)
	Cancel(ctx context.Context, id string) error
}

type leaveUseCase struct {
	DB         *gorm.DB
	Repository LeaveRepository
}

func NewLeaveUseCase(db *gorm.DB, repository LeaveRepository) LeaveUseCase {
	return &leaveUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *leaveUseCase) GetByID(ctx context.Context, id string) (*LeaveResponse, error) {
	leave, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.toResponse(leave), nil
}

func (u *leaveUseCase) GetByEmployee(ctx context.Context, employeeID string) ([]LeaveResponse, error) {
	leaves, err := u.Repository.GetByEmployee(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	var responses []LeaveResponse
	for _, leave := range leaves {
		responses = append(responses, *u.toResponse(&leave))
	}
	return responses, nil
}

func (u *leaveUseCase) GetPending(ctx context.Context) ([]LeaveResponse, error) {
	leaves, err := u.Repository.GetPending(ctx)
	if err != nil {
		return nil, err
	}
	var responses []LeaveResponse
	for _, leave := range leaves {
		responses = append(responses, *u.toResponse(&leave))
	}
	return responses, nil
}

func (u *leaveUseCase) GetTeamLeaves(ctx context.Context, managerID string) ([]LeaveResponse, error) {
	leaves, err := u.Repository.GetByManager(ctx, managerID)
	if err != nil {
		return nil, err
	}
	var responses []LeaveResponse
	for _, leave := range leaves {
		responses = append(responses, *u.toResponse(&leave))
	}
	return responses, nil
}

func (u *leaveUseCase) Create(ctx context.Context, request *CreateLeaveRequest) (*LeaveResponse, error) {
	startDate, err := time.Parse("2006-01-02", request.StartDate)
	if err != nil {
		return nil, errors.New("invalid start date format")
	}

	endDate, err := time.Parse("2006-01-02", request.EndDate)
	if err != nil {
		return nil, errors.New("invalid end date format")
	}

	if endDate.Before(startDate) {
		return nil, errors.New("end date must be after start date")
	}

	leave := &entity.LeaveRequest{
		EmployeeID: request.EmployeeID,
		LeaveType:  entity.LeaveType(request.LeaveType),
		StartDate:  startDate,
		EndDate:    endDate,
		Reason:     request.Reason,
		Status:     entity.LeaveStatusPending,
	}

	err = u.Repository.Create(ctx, leave)
	if err != nil {
		return nil, err
	}

	leave, _ = u.Repository.GetByID(ctx, leave.ID)
	return u.toResponse(leave), nil
}

func (u *leaveUseCase) Approve(ctx context.Context, id string, approvedBy string, request *ApproveLeaveRequest) (*LeaveResponse, error) {
	leave, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if leave.Status != entity.LeaveStatusPending {
		return nil, errors.New("leave request is not pending")
	}

	leave.Status = entity.LeaveStatus(request.Status)
	leave.ApprovedBy = &approvedBy
	now := time.Now()
	leave.ApprovedAt = &now

	err = u.Repository.Update(ctx, leave)
	if err != nil {
		return nil, err
	}

	leave, _ = u.Repository.GetByID(ctx, id)
	return u.toResponse(leave), nil
}

func (u *leaveUseCase) Cancel(ctx context.Context, id string) error {
	leave, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if leave.Status == entity.LeaveStatusApproved {
		return errors.New("cannot cancel approved leave")
	}

	leave.Status = entity.LeaveStatusCancelled
	return u.Repository.Update(ctx, leave)
}

func (u *leaveUseCase) toResponse(leave *entity.LeaveRequest) *LeaveResponse {
	resp := &LeaveResponse{
		ID:         leave.ID,
		EmployeeID: leave.EmployeeID,
		LeaveType:  string(leave.LeaveType),
		StartDate:  leave.StartDate.Format("2006-01-02"),
		EndDate:    leave.EndDate.Format("2006-01-02"),
		Reason:     leave.Reason,
		Status:     string(leave.Status),
		ApprovedBy: leave.ApprovedBy,
		CreatedAt:  leave.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	if leave.Employee.Name != "" {
		resp.EmployeeName = leave.Employee.Name
	}
	if leave.ApprovedBy != nil {
		resp.ApprovedBy = leave.ApprovedBy
		if leave.Approver != nil {
			resp.ApprovedByName = leave.Approver.Name
		}
	}
	if leave.ApprovedAt != nil {
		approvedAt := leave.ApprovedAt.Format("2006-01-02 15:04:05")
		resp.ApprovedAt = &approvedAt
	}

	return resp
}

type LeaveHandler interface {
	GetByID(ctx *fiber.Ctx) error
	GetMyLeaves(ctx *fiber.Ctx) error
	GetPending(ctx *fiber.Ctx) error
	GetTeamLeaves(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Approve(ctx *fiber.Ctx) error
	Cancel(ctx *fiber.Ctx) error
}

type leaveHandler struct {
	UseCase LeaveUseCase
}

func NewLeaveHandler(useCase LeaveUseCase) LeaveHandler {
	return &leaveHandler{UseCase: useCase}
}

func (h *leaveHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	leave, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Leave request not found")
	}
	return helper.SuccessResponse(ctx, leave)
}

func (h *leaveHandler) GetMyLeaves(ctx *fiber.Ctx) error {
	employeeID := ctx.Params("employeeId")
	leaves, err := h.UseCase.GetByEmployee(ctx.Context(), employeeID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, leaves)
}

func (h *leaveHandler) GetPending(ctx *fiber.Ctx) error {
	leaves, err := h.UseCase.GetPending(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, leaves)
}

func (h *leaveHandler) GetTeamLeaves(ctx *fiber.Ctx) error {
	managerID := ctx.Params("managerId")
	leaves, err := h.UseCase.GetTeamLeaves(ctx.Context(), managerID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, leaves)
}

func (h *leaveHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateLeaveRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	leave, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, leave)
}

func (h *leaveHandler) Approve(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	approvedBy := ctx.Params("approvedBy")
	request := new(ApproveLeaveRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	leave, err := h.UseCase.Approve(ctx.Context(), id, approvedBy, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, leave)
}

func (h *leaveHandler) Cancel(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.Cancel(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Leave cancelled successfully", nil)
}

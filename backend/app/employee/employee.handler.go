package employee

import (
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type EmployeeHandler interface {
	GetAll(ctx *fiber.Ctx) error
	GetByID(ctx *fiber.Ctx) error
	GetByUserID(ctx *fiber.Ctx) error
	GetMe(ctx *fiber.Ctx) error
	GetTeam(ctx *fiber.Ctx) error
	GetTeamLeaderOptions(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
	GetDashboardStats(ctx *fiber.Ctx) error
	GetHRStats(ctx *fiber.Ctx) error
	GetManagerStats(ctx *fiber.Ctx) error
}

type employeeHandler struct {
	UseCase EmployeeUseCase
}

func NewEmployeeHandler(useCase EmployeeUseCase) EmployeeHandler {
	return &employeeHandler{UseCase: useCase}
}

func (h *employeeHandler) GetAll(ctx *fiber.Ctx) error {
	page := ctx.QueryInt("page", 1)
	limit := ctx.QueryInt("limit", 10)

	employees, err := h.UseCase.GetAll(ctx.Context(), page, limit)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, employees)
}

func (h *employeeHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	employee, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Employee not found")
	}
	return helper.SuccessResponse(ctx, employee)
}

func (h *employeeHandler) GetByUserID(ctx *fiber.Ctx) error {
	userID := ctx.Params("userId")
	employee, err := h.UseCase.GetByUserID(ctx.Context(), userID)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Employee not found")
	}
	return helper.SuccessResponse(ctx, employee)
}

// GetMe returns the employee profile of the currently authenticated user
func (h *employeeHandler) GetMe(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}
	employee, err := h.UseCase.GetByUserID(ctx.Context(), userID.(string))
	if err != nil {
		// Return a proper 404 with a clear message instead of crashing
		return helper.NotFoundResponse(ctx, "Employee profile not found. Please contact HR to create your employee profile.")
	}
	return helper.SuccessResponse(ctx, employee)
}

func (h *employeeHandler) GetTeam(ctx *fiber.Ctx) error {
	managerID := ctx.Params("managerId")
	employees, err := h.UseCase.GetTeam(ctx.Context(), managerID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, employees)
}

func (h *employeeHandler) GetTeamLeaderOptions(ctx *fiber.Ctx) error {
	employees, err := h.UseCase.GetTeamLeaderOptions(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, employees)
}

func (h *employeeHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateEmployeeRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	employee, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, employee)
}

func (h *employeeHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(UpdateEmployeeRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	employee, err := h.UseCase.Update(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, employee)
}

func (h *employeeHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.Delete(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Employee deleted successfully", nil)
}

func (h *employeeHandler) GetDashboardStats(ctx *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}

	stats, err := h.UseCase.GetDashboardStats(ctx.Context(), userID.(string))
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, stats)
}

func (h *employeeHandler) GetHRStats(ctx *fiber.Ctx) error {
	stats, err := h.UseCase.GetHRStats(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, stats)
}

func (h *employeeHandler) GetManagerStats(ctx *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}

	stats, err := h.UseCase.GetManagerStats(ctx.Context(), userID.(string))
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, stats)
}

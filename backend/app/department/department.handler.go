package department

import (
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type DepartmentHandler interface {
	GetAll(ctx *fiber.Ctx) error
	GetByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type departmentHandler struct {
	UseCase DepartmentUseCase
}

func NewDepartmentHandler(useCase DepartmentUseCase) DepartmentHandler {
	return &departmentHandler{UseCase: useCase}
}

func (h *departmentHandler) GetAll(ctx *fiber.Ctx) error {
	departments, err := h.UseCase.GetAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, departments)
}

func (h *departmentHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	department, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Department not found")
	}
	return helper.SuccessResponse(ctx, department)
}

func (h *departmentHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateDepartmentRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	department, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, department)
}

func (h *departmentHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(UpdateDepartmentRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	department, err := h.UseCase.Update(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, department)
}

func (h *departmentHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.Delete(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Department deleted successfully", nil)
}

package supplier

import (
	"hris_backend/helper"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type SupplierHandler interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type supplierHandler struct {
	UseCase SupplierUseCase
}

func NewSupplierHandler(useCase SupplierUseCase) SupplierHandler {
	return &supplierHandler{UseCase: useCase}
}

var validate = validator.New()

func (h *supplierHandler) FindAll(ctx *fiber.Ctx) error {
	suppliers, err := h.UseCase.FindAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, suppliers)
}

func (h *supplierHandler) FindByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	supplier, err := h.UseCase.FindByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, supplier)
}

func (h *supplierHandler) Create(ctx *fiber.Ctx) error {
	var req CreateSupplierRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	supplier, err := h.UseCase.Create(ctx.Context(), &req)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, supplier)
}

func (h *supplierHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req UpdateSupplierRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	supplier, err := h.UseCase.Update(ctx.Context(), id, &req)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, supplier)
}

func (h *supplierHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.Delete(ctx.Context(), id); err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

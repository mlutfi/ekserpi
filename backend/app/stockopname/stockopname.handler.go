package stockopname

import (
	"hris_backend/helper"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type StockOpnameHandler interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	UpdateStatus(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type stockOpnameHandler struct {
	UseCase StockOpnameUseCase
}

func NewStockOpnameHandler(useCase StockOpnameUseCase) StockOpnameHandler {
	return &stockOpnameHandler{UseCase: useCase}
}

var validate = validator.New()

func (h *stockOpnameHandler) FindAll(ctx *fiber.Ctx) error {
	opnames, err := h.UseCase.FindAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, opnames)
}

func (h *stockOpnameHandler) FindByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	opname, err := h.UseCase.FindByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, opname)
}

func (h *stockOpnameHandler) Create(ctx *fiber.Ctx) error {
	var req CreateOpnameRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userSession := ctx.Locals("user").(map[string]interface{})
	userID := userSession["id"].(string)

	opname, err := h.UseCase.Create(ctx.Context(), &req, userID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, opname)
}

func (h *stockOpnameHandler) UpdateStatus(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req UpdateOpnameStatusRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userSession := ctx.Locals("user").(map[string]interface{})
	userID := userSession["id"].(string)

	opname, err := h.UseCase.UpdateStatus(ctx.Context(), id, &req, userID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, opname)
}

func (h *stockOpnameHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.Delete(ctx.Context(), id); err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

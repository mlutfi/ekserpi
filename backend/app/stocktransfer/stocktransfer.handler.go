package stocktransfer

import (
	"hris_backend/helper"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type StockTransferHandler interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	UpdateStatus(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type stockTransferHandler struct {
	UseCase StockTransferUseCase
}

func NewStockTransferHandler(useCase StockTransferUseCase) StockTransferHandler {
	return &stockTransferHandler{UseCase: useCase}
}

var validate = validator.New()

func (h *stockTransferHandler) FindAll(ctx *fiber.Ctx) error {
	trs, err := h.UseCase.FindAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, trs)
}

func (h *stockTransferHandler) FindByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	tr, err := h.UseCase.FindByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, tr)
}

func (h *stockTransferHandler) Create(ctx *fiber.Ctx) error {
	var req CreateTransferRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userSession := ctx.Locals("user").(map[string]interface{})
	userID := userSession["id"].(string)

	tr, err := h.UseCase.Create(ctx.Context(), &req, userID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, tr)
}

func (h *stockTransferHandler) UpdateStatus(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req UpdateTransferStatusRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userSession := ctx.Locals("user").(map[string]interface{})
	userID := userSession["id"].(string)

	tr, err := h.UseCase.UpdateStatus(ctx.Context(), id, &req, userID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, tr)
}

func (h *stockTransferHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.Delete(ctx.Context(), id); err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

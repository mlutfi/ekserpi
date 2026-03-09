package purchaseorder

import (
	"hris_backend/helper"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type PurchaseOrderHandler interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	UpdateStatus(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type purchaseOrderHandler struct {
	UseCase PurchaseOrderUseCase
}

func NewPurchaseOrderHandler(useCase PurchaseOrderUseCase) PurchaseOrderHandler {
	return &purchaseOrderHandler{UseCase: useCase}
}

var validate = validator.New()

func (h *purchaseOrderHandler) FindAll(ctx *fiber.Ctx) error {
	pos, err := h.UseCase.FindAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, pos)
}

func (h *purchaseOrderHandler) FindByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	po, err := h.UseCase.FindByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, po)
}

func (h *purchaseOrderHandler) Create(ctx *fiber.Ctx) error {
	var req CreatePORequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userID := ctx.Locals("userId").(string)

	po, err := h.UseCase.Create(ctx.Context(), &req, userID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, po)
}

func (h *purchaseOrderHandler) UpdateStatus(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req UpdatePOStatusRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userID := ctx.Locals("userId").(string)

	po, err := h.UseCase.UpdateStatus(ctx.Context(), id, &req, userID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, po)
}

func (h *purchaseOrderHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.Delete(ctx.Context(), id); err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

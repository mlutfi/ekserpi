package position

import (
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type PositionHandler interface {
	GetAll(ctx *fiber.Ctx) error
	GetByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type positionHandler struct {
	UseCase PositionUseCase
}

func NewPositionHandler(useCase PositionUseCase) PositionHandler {
	return &positionHandler{UseCase: useCase}
}

func (h *positionHandler) GetAll(ctx *fiber.Ctx) error {
	positions, err := h.UseCase.GetAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, positions)
}

func (h *positionHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	position, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Position not found")
	}
	return helper.SuccessResponse(ctx, position)
}

func (h *positionHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreatePositionRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	position, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, position)
}

func (h *positionHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(UpdatePositionRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	position, err := h.UseCase.Update(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, position)
}

func (h *positionHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.Delete(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Position deleted successfully", nil)
}

package location

import (
	"hris_backend/helper"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type LocationHandler interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type locationHandler struct {
	UseCase LocationUseCase
}

func NewLocationHandler(useCase LocationUseCase) LocationHandler {
	return &locationHandler{UseCase: useCase}
}

var validate = validator.New()

func (h *locationHandler) FindAll(ctx *fiber.Ctx) error {
	locations, err := h.UseCase.FindAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, locations)
}

func (h *locationHandler) FindByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	location, err := h.UseCase.FindByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, location)
}

func (h *locationHandler) Create(ctx *fiber.Ctx) error {
	var req CreateLocationRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	location, err := h.UseCase.Create(ctx.Context(), &req)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, location)
}

func (h *locationHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req UpdateLocationRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	location, err := h.UseCase.Update(ctx.Context(), id, &req)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, location)
}

func (h *locationHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.Delete(ctx.Context(), id); err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

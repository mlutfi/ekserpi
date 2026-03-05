package category

import (
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type CategoryHandler interface {
	GetAll(ctx *fiber.Ctx) error
	GetByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type categoryHandler struct {
	UseCase CategoryUseCase
}

func NewCategoryHandler(useCase CategoryUseCase) CategoryHandler {
	return &categoryHandler{UseCase: useCase}
}

func (h *categoryHandler) GetAll(ctx *fiber.Ctx) error {
	categories, err := h.UseCase.GetAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, categories)
}

func (h *categoryHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	category, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Category not found")
	}
	return helper.SuccessResponse(ctx, category)
}

func (h *categoryHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateCategoryRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	category, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, category)
}

func (h *categoryHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(UpdateCategoryRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	category, err := h.UseCase.Update(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, category)
}

func (h *categoryHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.Delete(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Category deleted successfully", nil)
}

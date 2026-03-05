package user

import (
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type UserHandler interface {
	GetAll(ctx *fiber.Ctx) error
	GetByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type userHandler struct {
	UseCase UserUseCase
}

func NewUserHandler(useCase UserUseCase) UserHandler {
	return &userHandler{UseCase: useCase}
}

func (h *userHandler) GetAll(ctx *fiber.Ctx) error {
	users, err := h.UseCase.GetAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, users)
}

func (h *userHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	user, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "User not found")
	}
	return helper.SuccessResponse(ctx, user)
}

func (h *userHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateUserRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	user, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, user)
}

func (h *userHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(UpdateUserRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	user, err := h.UseCase.Update(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, user)
}

func (h *userHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.Delete(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "User deleted successfully", nil)
}

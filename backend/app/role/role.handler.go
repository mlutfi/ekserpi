package role

import (
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type RoleHandler interface {
	GetAll(ctx *fiber.Ctx) error
	GetPermissions(ctx *fiber.Ctx) error
	UpdatePermissions(ctx *fiber.Ctx) error
}

type roleHandler struct {
	UseCase RoleUseCase
}

func NewRoleHandler(useCase RoleUseCase) RoleHandler {
	return &roleHandler{UseCase: useCase}
}

func (h *roleHandler) GetAll(ctx *fiber.Ctx) error {
	roles, err := h.UseCase.GetAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, roles)
}

func (h *roleHandler) GetPermissions(ctx *fiber.Ctx) error {
	role := ctx.Params("role")
	response, err := h.UseCase.GetPermissions(ctx.Context(), role)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, response)
}

func (h *roleHandler) UpdatePermissions(ctx *fiber.Ctx) error {
	role := ctx.Params("role")
	request := new(UpdateRolePermissionsRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	response, err := h.UseCase.UpdatePermissions(ctx.Context(), role, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, response)
}

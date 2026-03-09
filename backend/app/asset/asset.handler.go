package asset

import (
	"hris_backend/helper"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type AssetHandler interface {
	FindAllAssets(ctx *fiber.Ctx) error
	FindAssetByID(ctx *fiber.Ctx) error
	CreateAsset(ctx *fiber.Ctx) error
	UpdateAsset(ctx *fiber.Ctx) error
	DeleteAsset(ctx *fiber.Ctx) error

	FindAllAssignments(ctx *fiber.Ctx) error
	CreateAssignment(ctx *fiber.Ctx) error
	ReturnAssignment(ctx *fiber.Ctx) error
	DeleteAssignment(ctx *fiber.Ctx) error

	FindAllMaintenances(ctx *fiber.Ctx) error
	CreateMaintenance(ctx *fiber.Ctx) error
	UpdateMaintenanceStatus(ctx *fiber.Ctx) error
	DeleteMaintenance(ctx *fiber.Ctx) error

	FindAllDepreciations(ctx *fiber.Ctx) error
	GenerateDepreciations(ctx *fiber.Ctx) error
	UpdateDepreciationStatus(ctx *fiber.Ctx) error
}

type assetHandler struct {
	UseCase AssetUseCase
}

func NewAssetHandler(useCase AssetUseCase) AssetHandler {
	return &assetHandler{UseCase: useCase}
}

var validate = validator.New()

func (h *assetHandler) FindAllAssets(ctx *fiber.Ctx) error {
	assets, err := h.UseCase.FindAllAssets(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, assets)
}

func (h *assetHandler) FindAssetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	asset, err := h.UseCase.FindAssetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, asset)
}

func (h *assetHandler) CreateAsset(ctx *fiber.Ctx) error {
	var req CreateAssetRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userID := ctx.Locals("userId").(string)
	asset, err := h.UseCase.CreateAsset(ctx.Context(), &req, userID)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, asset)
}

func (h *assetHandler) UpdateAsset(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req UpdateAssetRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	asset, err := h.UseCase.UpdateAsset(ctx.Context(), id, &req)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, asset)
}

func (h *assetHandler) DeleteAsset(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.DeleteAsset(ctx.Context(), id); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

func (h *assetHandler) FindAllAssignments(ctx *fiber.Ctx) error {
	assignments, err := h.UseCase.FindAllAssignments(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, assignments)
}

func (h *assetHandler) CreateAssignment(ctx *fiber.Ctx) error {
	var req CreateAssignmentRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userID := ctx.Locals("userId").(string)
	assignment, err := h.UseCase.CreateAssignment(ctx.Context(), &req, userID)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, assignment)
}

func (h *assetHandler) ReturnAssignment(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req ReturnAssignmentRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	assignment, err := h.UseCase.ReturnAssignment(ctx.Context(), id, &req)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, assignment)
}

func (h *assetHandler) DeleteAssignment(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.DeleteAssignment(ctx.Context(), id); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

func (h *assetHandler) FindAllMaintenances(ctx *fiber.Ctx) error {
	maintenances, err := h.UseCase.FindAllMaintenances(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, maintenances)
}

func (h *assetHandler) CreateMaintenance(ctx *fiber.Ctx) error {
	var req CreateMaintenanceRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userID := ctx.Locals("userId").(string)
	maintenance, err := h.UseCase.CreateMaintenance(ctx.Context(), &req, userID)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, maintenance)
}

func (h *assetHandler) UpdateMaintenanceStatus(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req UpdateMaintenanceStatusRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	maintenance, err := h.UseCase.UpdateMaintenanceStatus(ctx.Context(), id, &req)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, maintenance)
}

func (h *assetHandler) DeleteMaintenance(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.UseCase.DeleteMaintenance(ctx.Context(), id); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, nil)
}

func (h *assetHandler) FindAllDepreciations(ctx *fiber.Ctx) error {
	period := ctx.Query("period")
	depreciations, err := h.UseCase.FindAllDepreciations(ctx.Context(), period)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, depreciations)
}

func (h *assetHandler) GenerateDepreciations(ctx *fiber.Ctx) error {
	var req GenerateDepreciationRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	userID := ctx.Locals("userId").(string)
	depreciations, err := h.UseCase.GenerateDepreciations(ctx.Context(), &req, userID)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, depreciations)
}

func (h *assetHandler) UpdateDepreciationStatus(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req PostDepreciationRequest
	if err := ctx.BodyParser(&req); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	dep, err := h.UseCase.UpdateDepreciationStatus(ctx.Context(), id, &req)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, dep)
}

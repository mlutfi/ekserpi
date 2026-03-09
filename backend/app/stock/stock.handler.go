package stock

import (
	"hris_backend/helper"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type StockHandler interface {
	AddStockIn(ctx *fiber.Ctx) error
	GetStockIns(ctx *fiber.Ctx) error
	AddStockOut(ctx *fiber.Ctx) error
	GetStockOuts(ctx *fiber.Ctx) error
	GetInventory(ctx *fiber.Ctx) error
}

type stockHandler struct {
	UseCase StockUseCase
}

func NewStockHandler(useCase StockUseCase) StockHandler {
	return &stockHandler{UseCase: useCase}
}

func (h *stockHandler) AddStockIn(ctx *fiber.Ctx) error {
	userId := ctx.Locals("userId").(string)
	request := new(StockInRequest)

	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	stockIn, err := h.UseCase.AddStockIn(ctx.Context(), userId, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	return helper.CreatedResponse(ctx, stockIn)
}

func (h *stockHandler) GetStockIns(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	stockIns, total, err := h.UseCase.GetStockIns(ctx.Context(), page, limit)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"code":   fiber.StatusOK,
		"status": "success",
		"data":   stockIns,
		"meta": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

func (h *stockHandler) AddStockOut(ctx *fiber.Ctx) error {
	userId := ctx.Locals("userId").(string)
	request := new(StockOutRequest)

	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	stockOut, err := h.UseCase.AddStockOut(ctx.Context(), userId, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	return helper.CreatedResponse(ctx, stockOut)
}

func (h *stockHandler) GetStockOuts(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	stockOuts, total, err := h.UseCase.GetStockOuts(ctx.Context(), page, limit)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"code":   fiber.StatusOK,
		"status": "success",
		"data":   stockOuts,
		"meta": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

func (h *stockHandler) GetInventory(ctx *fiber.Ctx) error {
	locationId := ctx.Query("locationId")
	inventory, err := h.UseCase.GetInventory(ctx.Context(), locationId)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, inventory)
}

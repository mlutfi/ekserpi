package sale

import (
	"fmt"
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type SaleHandler interface {
	FindAll(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	GetByID(ctx *fiber.Ctx) error
	UpdateStatus(ctx *fiber.Ctx) error
	PayCash(ctx *fiber.Ctx) error
	PayQRIS(ctx *fiber.Ctx) error
	PayQRISStatic(ctx *fiber.Ctx) error
	PayTransfer(ctx *fiber.Ctx) error
	GetQRISStatus(ctx *fiber.Ctx) error
	GetDailyReport(ctx *fiber.Ctx) error
	MidtransNotification(ctx *fiber.Ctx) error
	GenerateSnapToken(ctx *fiber.Ctx) error
}

type saleHandler struct {
	UseCase SaleUseCase
}

func NewSaleHandler(useCase SaleUseCase) SaleHandler {
	return &saleHandler{UseCase: useCase}
}

func (h *saleHandler) FindAll(ctx *fiber.Ctx) error {
	status := ctx.Query("status")
	sales, err := h.UseCase.FindAll(ctx.Context(), status)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, sales)
}

func (h *saleHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateSaleRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	cashierId := ctx.Locals("userId").(string)
	sale, err := h.UseCase.Create(ctx.Context(), cashierId, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, sale)
}

func (h *saleHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	sale, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Sale not found")
	}
	return helper.SuccessResponse(ctx, sale)
}

func (h *saleHandler) UpdateStatus(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(UpdateSaleStatusRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	sale, err := h.UseCase.UpdateStatus(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	return helper.SuccessResponse(ctx, sale)
}

func (h *saleHandler) PayCash(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(PayCashRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	sale, err := h.UseCase.PayCash(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, sale)
}

func (h *saleHandler) PayQRIS(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	sale, err := h.UseCase.PayQRIS(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, sale)
}

func (h *saleHandler) PayQRISStatic(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	sale, err := h.UseCase.PayQRISStatic(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, sale)
}

func (h *saleHandler) PayTransfer(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(PayTransferRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	sale, err := h.UseCase.PayTransfer(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, sale)
}

func (h *saleHandler) GetQRISStatus(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	status, err := h.UseCase.GetQRISStatus(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, status)
}

func (h *saleHandler) GetDailyReport(ctx *fiber.Ctx) error {
	date := ctx.Query("date")
	report, err := h.UseCase.GetDailyReport(ctx.Context(), date)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, report)
}

func (h *saleHandler) MidtransNotification(ctx *fiber.Ctx) error {
	var payload map[string]interface{}
	if err := ctx.BodyParser(&payload); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid notification payload")
	}

	err := h.UseCase.MidtransNotification(ctx.Context(), payload)
	if err != nil {
		// Midtrans expects 200 OK even if we fail to process, to stop retrying.
		// However, logging the error is good practice.
		fmt.Printf("Midtrans notification error: %v\n", err)
		return ctx.SendStatus(fiber.StatusOK)
	}

	return ctx.SendStatus(fiber.StatusOK)
}

func (h *saleHandler) GenerateSnapToken(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	tokenResp, err := h.UseCase.GenerateSnapToken(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, tokenResp)
}

package setting

import (
	"hris_backend/helper"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type SettingHandler interface {
	GetModules(c *fiber.Ctx) error
	UpdateModules(c *fiber.Ctx) error
	GetPosPayment(c *fiber.Ctx) error
	UpdatePosPayment(c *fiber.Ctx) error
	UploadQrisImage(c *fiber.Ctx) error
}

type settingHandler struct {
	UseCase  SettingUseCase
	Validate *validator.Validate
}

func NewSettingHandler(useCase SettingUseCase, validate *validator.Validate) SettingHandler {
	return &settingHandler{
		UseCase:  useCase,
		Validate: validate,
	}
}

func (h *settingHandler) GetModules(c *fiber.Ctx) error {
	ctx := c.Context()
	setting, err := h.UseCase.GetByKey(ctx, "ACTIVE_MODULES")
	if err != nil {
		return helper.InternalServerErrorResponse(c, err.Error())
	}
	return helper.SuccessResponse(c, setting)
}

func (h *settingHandler) UpdateModules(c *fiber.Ctx) error {
	ctx := c.Context()
	request := new(UpdateSettingRequest)

	if err := c.BodyParser(request); err != nil {
		return helper.BadRequestResponse(c, "invalid request body")
	}

	if err := h.Validate.Struct(request); err != nil {
		return helper.BadRequestResponse(c, err.Error())
	}

	setting, err := h.UseCase.Upsert(ctx, "ACTIVE_MODULES", request)
	if err != nil {
		return helper.InternalServerErrorResponse(c, err.Error())
	}

	return helper.SuccessResponse(c, setting)
}

func (h *settingHandler) GetPosPayment(c *fiber.Ctx) error {
	ctx := c.Context()
	setting, err := h.UseCase.GetByKey(ctx, "POS_PAYMENT_SETTINGS")
	if err != nil {
		return helper.InternalServerErrorResponse(c, err.Error())
	}

	if setting.Value == "" {
		setting.Value = `{"cash":true,"qrisMidtrans":false,"qrisStatic":false,"qrisStaticImage":"","bankTransfer":false,"bankAccounts":[]}`
	}

	return helper.SuccessResponse(c, setting)
}

func (h *settingHandler) UpdatePosPayment(c *fiber.Ctx) error {
	ctx := c.Context()
	request := new(UpdateSettingRequest)

	if err := c.BodyParser(request); err != nil {
		return helper.BadRequestResponse(c, "invalid request body")
	}

	if err := h.Validate.Struct(request); err != nil {
		return helper.BadRequestResponse(c, err.Error())
	}

	setting, err := h.UseCase.Upsert(ctx, "POS_PAYMENT_SETTINGS", request)
	if err != nil {
		return helper.InternalServerErrorResponse(c, err.Error())
	}

	return helper.SuccessResponse(c, setting)
}

func (h *settingHandler) UploadQrisImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		return helper.BadRequestResponse(c, "Failed to get image file from request")
	}

	_ = helper.CreateDirIfNotExists("./uploads/qris")
	filename := helper.GenerateSafeFilename(file.Filename)
	filePath := "./uploads/qris/" + filename

	if err := c.SaveFile(file, filePath); err != nil {
		return helper.InternalServerErrorResponse(c, "Failed to save image file")
	}

	imageUrl := "/uploads/qris/" + filename
	return helper.SuccessResponse(c, fiber.Map{
		"imageUrl": imageUrl,
	})
}

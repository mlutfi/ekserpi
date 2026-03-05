package product

import (
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
)

type ProductHandler interface {
	GetAll(ctx *fiber.Ctx) error
	GetByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
	Search(ctx *fiber.Ctx) error
	GetByCategory(ctx *fiber.Ctx) error
	UploadImage(ctx *fiber.Ctx) error
}

type productHandler struct {
	UseCase ProductUseCase
}

func NewProductHandler(useCase ProductUseCase) ProductHandler {
	return &productHandler{UseCase: useCase}
}

func (h *productHandler) GetAll(ctx *fiber.Ctx) error {
	products, err := h.UseCase.GetAll(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, products)
}

func (h *productHandler) GetByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	product, err := h.UseCase.GetByID(ctx.Context(), id)
	if err != nil {
		return helper.NotFoundResponse(ctx, "Product not found")
	}
	return helper.SuccessResponse(ctx, product)
}

func (h *productHandler) Create(ctx *fiber.Ctx) error {
	request := new(CreateProductRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	product, err := h.UseCase.Create(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, product)
}

func (h *productHandler) Update(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	request := new(UpdateProductRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	product, err := h.UseCase.Update(ctx.Context(), id, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, product)
}

func (h *productHandler) Delete(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	err := h.UseCase.Delete(ctx.Context(), id)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponseWithMessage(ctx, "Product deleted successfully", nil)
}

func (h *productHandler) Search(ctx *fiber.Ctx) error {
	query := ctx.Query("q")
	products, err := h.UseCase.Search(ctx.Context(), query)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, products)
}

func (h *productHandler) GetByCategory(ctx *fiber.Ctx) error {
	categoryId := ctx.Query("categoryId")
	products, err := h.UseCase.GetByCategory(ctx.Context(), categoryId)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, products)
}

func (h *productHandler) UploadImage(ctx *fiber.Ctx) error {
	file, err := ctx.FormFile("image")
	if err != nil {
		return helper.BadRequestResponse(ctx, "Failed to get image file from request")
	}

	// create uploads/products directory if it doesn't exist
	_ = helper.CreateDirIfNotExists("./uploads/products")

	// generate safe filename
	filename := helper.GenerateSafeFilename(file.Filename)
	filePath := "./uploads/products/" + filename

	if err := ctx.SaveFile(file, filePath); err != nil {
		return helper.InternalServerErrorResponse(ctx, "Failed to save image file")
	}

	// Assuming the app is accessible on root /
	// return URL path accessible from frontend
	imageUrl := "/uploads/products/" + filename

	return helper.SuccessResponse(ctx, fiber.Map{
		"imageUrl": imageUrl,
	})
}

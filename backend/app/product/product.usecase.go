package product

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type ProductUseCase interface {
	GetAll(ctx context.Context) ([]ProductResponse, error)
	GetByID(ctx context.Context, id string) (*ProductResponse, error)
	Create(ctx context.Context, request *CreateProductRequest) (*ProductResponse, error)
	Update(ctx context.Context, id string, request *UpdateProductRequest) (*ProductResponse, error)
	Delete(ctx context.Context, id string) error
	Search(ctx context.Context, query string) ([]ProductResponse, error)
	GetByCategory(ctx context.Context, categoryId string) ([]ProductResponse, error)
}

type productUseCase struct {
	DB         *gorm.DB
	Repository ProductRepository
}

func NewProductUseCase(db *gorm.DB, repository ProductRepository) ProductUseCase {
	return &productUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *productUseCase) GetAll(ctx context.Context) ([]ProductResponse, error) {
	products, err := u.Repository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var responses []ProductResponse
	for _, p := range products {
		responses = append(responses, *u.toResponse(&p))
	}
	return responses, nil
}

func (u *productUseCase) GetByID(ctx context.Context, id string) (*ProductResponse, error) {
	product, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.toResponse(product), nil
}

func (u *productUseCase) Create(ctx context.Context, request *CreateProductRequest) (*ProductResponse, error) {
	product := &entity.Product{
		CategoryID: request.CategoryID,
		SKU:        request.SKU,
		Barcode:    request.Barcode,
		Name:       request.Name,
		Price:      request.Price,
		Cost:       request.Cost,
		ImageURL:   request.ImageURL,
		IsActive:   request.IsActive,
	}

	err := u.Repository.Create(ctx, product)
	if err != nil {
		return nil, err
	}

	if request.QtyOnHand > 0 {
		inventory := &entity.Inventory{
			ProductID: product.ID,
			QtyOnHand: request.QtyOnHand,
		}
		u.Repository.CreateInventory(ctx, inventory)
	}

	return u.toResponse(product), nil
}

func (u *productUseCase) Update(ctx context.Context, id string, request *UpdateProductRequest) (*ProductResponse, error) {
	product, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	product.CategoryID = request.CategoryID
	product.SKU = request.SKU
	product.Barcode = request.Barcode
	product.Name = request.Name
	product.Price = request.Price
	product.Cost = request.Cost
	product.ImageURL = request.ImageURL
	product.IsActive = request.IsActive

	err = u.Repository.Update(ctx, product)
	if err != nil {
		return nil, err
	}

	return u.toResponse(product), nil
}

func (u *productUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return u.Repository.Delete(ctx, id)
}

func (u *productUseCase) Search(ctx context.Context, query string) ([]ProductResponse, error) {
	if len(query) < 2 {
		return nil, errors.New("query must be at least 2 characters")
	}

	products, err := u.Repository.Search(ctx, query)
	if err != nil {
		return nil, err
	}

	var responses []ProductResponse
	for _, p := range products {
		responses = append(responses, *u.toResponse(&p))
	}
	return responses, nil
}

func (u *productUseCase) GetByCategory(ctx context.Context, categoryId string) ([]ProductResponse, error) {
	products, err := u.Repository.GetByCategory(ctx, categoryId)
	if err != nil {
		return nil, err
	}

	var responses []ProductResponse
	for _, p := range products {
		responses = append(responses, *u.toResponse(&p))
	}
	return responses, nil
}

func (u *productUseCase) toResponse(p *entity.Product) *ProductResponse {
	response := &ProductResponse{
		ID:         p.ID,
		CategoryID: p.CategoryID,
		SKU:        p.SKU,
		Barcode:    p.Barcode,
		Name:       p.Name,
		Price:      p.Price,
		Cost:       p.Cost,
		ImageURL:   p.ImageURL,
		IsActive:   p.IsActive,
		QtyOnHand:  0,
	}

	if p.Category != nil {
		categoryName := p.Category.Name
		response.Category = &categoryName
	}

	if p.Inventory != nil {
		response.QtyOnHand = p.Inventory.QtyOnHand
	}

	return response
}

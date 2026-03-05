package category

import (
	"context"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type CategoryUseCase interface {
	GetAll(ctx context.Context) ([]CategoryResponse, error)
	GetByID(ctx context.Context, id string) (*CategoryResponse, error)
	Create(ctx context.Context, request *CreateCategoryRequest) (*CategoryResponse, error)
	Update(ctx context.Context, id string, request *UpdateCategoryRequest) (*CategoryResponse, error)
	Delete(ctx context.Context, id string) error
}

type categoryUseCase struct {
	DB         *gorm.DB
	Repository CategoryRepository
}

func NewCategoryUseCase(db *gorm.DB, repository CategoryRepository) CategoryUseCase {
	return &categoryUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *categoryUseCase) GetAll(ctx context.Context) ([]CategoryResponse, error) {
	categories, err := u.Repository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var responses []CategoryResponse
	for _, c := range categories {
		responses = append(responses, CategoryResponse{
			ID:   c.ID,
			Name: c.Name,
		})
	}
	return responses, nil
}

func (u *categoryUseCase) GetByID(ctx context.Context, id string) (*CategoryResponse, error) {
	category, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &CategoryResponse{
		ID:   category.ID,
		Name: category.Name,
	}, nil
}

func (u *categoryUseCase) Create(ctx context.Context, request *CreateCategoryRequest) (*CategoryResponse, error) {
	category := &entity.Category{
		Name: request.Name,
	}

	err := u.Repository.Create(ctx, category)
	if err != nil {
		return nil, err
	}

	return &CategoryResponse{
		ID:   category.ID,
		Name: category.Name,
	}, nil
}

func (u *categoryUseCase) Update(ctx context.Context, id string, request *UpdateCategoryRequest) (*CategoryResponse, error) {
	category, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	category.Name = request.Name

	err = u.Repository.Update(ctx, category)
	if err != nil {
		return nil, err
	}

	return &CategoryResponse{
		ID:   category.ID,
		Name: category.Name,
	}, nil
}

func (u *categoryUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return u.Repository.Delete(ctx, id)
}

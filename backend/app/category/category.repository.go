package category

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type CategoryRepository interface {
	GetAll(ctx context.Context) ([]entity.Category, error)
	GetByID(ctx context.Context, id string) (*entity.Category, error)
	Create(ctx context.Context, category *entity.Category) error
	Update(ctx context.Context, category *entity.Category) error
	Delete(ctx context.Context, id string) error
}

type categoryRepository struct {
	DB *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{DB: db}
}

func (r *categoryRepository) GetAll(ctx context.Context) ([]entity.Category, error) {
	var categories []entity.Category
	err := r.DB.WithContext(ctx).Order("created_at DESC").Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetByID(ctx context.Context, id string) (*entity.Category, error) {
	category := new(entity.Category)
	err := r.DB.WithContext(ctx).First(category, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("category not found")
		}
		return nil, err
	}
	return category, nil
}

func (r *categoryRepository) Create(ctx context.Context, category *entity.Category) error {
	return r.DB.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) Update(ctx context.Context, category *entity.Category) error {
	return r.DB.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Category{}, "id = ?", id).Error
}

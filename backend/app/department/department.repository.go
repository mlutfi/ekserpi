package department

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type DepartmentRepository interface {
	GetAll(ctx context.Context) ([]entity.Department, error)
	GetByID(ctx context.Context, id string) (*entity.Department, error)
	Create(ctx context.Context, department *entity.Department) error
	Update(ctx context.Context, department *entity.Department) error
	Delete(ctx context.Context, id string) error
}

type departmentRepository struct {
	DB *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepository{DB: db}
}

func (r *departmentRepository) GetAll(ctx context.Context) ([]entity.Department, error) {
	var departments []entity.Department
	err := r.DB.WithContext(ctx).Order("created_at DESC").Find(&departments).Error
	return departments, err
}

func (r *departmentRepository) GetByID(ctx context.Context, id string) (*entity.Department, error) {
	department := new(entity.Department)
	err := r.DB.WithContext(ctx).First(department, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("department not found")
		}
		return nil, err
	}
	return department, nil
}

func (r *departmentRepository) Create(ctx context.Context, department *entity.Department) error {
	return r.DB.WithContext(ctx).Create(department).Error
}

func (r *departmentRepository) Update(ctx context.Context, department *entity.Department) error {
	return r.DB.WithContext(ctx).Save(department).Error
}

func (r *departmentRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Department{}, "id = ?", id).Error
}

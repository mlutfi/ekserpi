package supplier

import (
	"context"
	"hris_backend/entity"

	"gorm.io/gorm"
)

type SupplierRepository interface {
	FindAll(ctx context.Context) ([]entity.Supplier, error)
	FindByID(ctx context.Context, id string) (*entity.Supplier, error)
	Create(ctx context.Context, supplier *entity.Supplier) error
	Update(ctx context.Context, supplier *entity.Supplier) error
	Delete(ctx context.Context, id string) error
}

type supplierRepository struct {
	DB *gorm.DB
}

func NewSupplierRepository(db *gorm.DB) SupplierRepository {
	return &supplierRepository{DB: db}
}

func (r *supplierRepository) FindAll(ctx context.Context) ([]entity.Supplier, error) {
	var suppliers []entity.Supplier
	err := r.DB.WithContext(ctx).Order("name ASC").Find(&suppliers).Error
	return suppliers, err
}

func (r *supplierRepository) FindByID(ctx context.Context, id string) (*entity.Supplier, error) {
	var supplier entity.Supplier
	err := r.DB.WithContext(ctx).First(&supplier, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &supplier, nil
}

func (r *supplierRepository) Create(ctx context.Context, supplier *entity.Supplier) error {
	return r.DB.WithContext(ctx).Create(supplier).Error
}

func (r *supplierRepository) Update(ctx context.Context, supplier *entity.Supplier) error {
	return r.DB.WithContext(ctx).Save(supplier).Error
}

func (r *supplierRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Supplier{}, "id = ?", id).Error
}

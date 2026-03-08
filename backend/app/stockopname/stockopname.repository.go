package stockopname

import (
	"context"
	"hris_backend/entity"

	"gorm.io/gorm"
)

type StockOpnameRepository interface {
	FindAll(ctx context.Context) ([]entity.StockOpname, error)
	FindByID(ctx context.Context, id string) (*entity.StockOpname, error)
	Create(ctx context.Context, opname *entity.StockOpname) error
	Update(ctx context.Context, opname *entity.StockOpname) error
	Delete(ctx context.Context, id string) error
	GetNextOpnameNumber() string
}

type stockOpnameRepository struct {
	DB *gorm.DB
}

func NewStockOpnameRepository(db *gorm.DB) StockOpnameRepository {
	return &stockOpnameRepository{DB: db}
}

func (r *stockOpnameRepository) FindAll(ctx context.Context) ([]entity.StockOpname, error) {
	var opnames []entity.StockOpname
	err := r.DB.WithContext(ctx).
		Preload("Location").
		Preload("CreatedBy").
		Order("created_at DESC").Find(&opnames).Error
	return opnames, err
}

func (r *stockOpnameRepository) FindByID(ctx context.Context, id string) (*entity.StockOpname, error) {
	var opname entity.StockOpname
	err := r.DB.WithContext(ctx).
		Preload("Location").
		Preload("CreatedBy").
		Preload("Items").
		Preload("Items.Product").
		First(&opname, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &opname, nil
}

func (r *stockOpnameRepository) Create(ctx context.Context, opname *entity.StockOpname) error {
	return r.DB.WithContext(ctx).Create(opname).Error
}

func (r *stockOpnameRepository) Update(ctx context.Context, opname *entity.StockOpname) error {
	return r.DB.WithContext(ctx).Save(opname).Error
}

func (r *stockOpnameRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.StockOpname{}, "id = ?", id).Error
}

func (r *stockOpnameRepository) GetNextOpnameNumber() string {
	var count int64
	r.DB.Model(&entity.StockOpname{}).Count(&count)
	return "OPN-" + string(rune(count+1)) // simplified
}

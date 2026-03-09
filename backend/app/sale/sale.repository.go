package sale

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type SaleRepository interface {
	Create(ctx context.Context, sale *entity.Sale) error
	FindAll(ctx context.Context, status string) ([]entity.Sale, error)
	GetByID(ctx context.Context, id string) (*entity.Sale, error)
	Update(ctx context.Context, sale *entity.Sale) error
	CreatePayment(ctx context.Context, payment *entity.Payment) error
	GetDailySales(ctx context.Context, date string) ([]entity.Sale, error)
}

type saleRepository struct {
	DB *gorm.DB
}

func NewSaleRepository(db *gorm.DB) SaleRepository {
	return &saleRepository{DB: db}
}

func (r *saleRepository) Create(ctx context.Context, sale *entity.Sale) error {
	return r.DB.WithContext(ctx).Create(sale).Error
}

func (r *saleRepository) FindAll(ctx context.Context, status string) ([]entity.Sale, error) {
	var sales []entity.Sale
	query := r.DB.WithContext(ctx).
		Preload("Cashier").
		Preload("Location").
		Preload("Items.Product").
		Preload("Payments")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("created_at DESC").Find(&sales).Error
	return sales, err
}

func (r *saleRepository) GetByID(ctx context.Context, id string) (*entity.Sale, error) {
	sale := new(entity.Sale)
	err := r.DB.WithContext(ctx).
		Preload("Cashier").
		Preload("Items.Product").
		Preload("Payments").
		First(sale, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("sale not found")
		}
		return nil, err
	}
	return sale, nil
}

func (r *saleRepository) Update(ctx context.Context, sale *entity.Sale) error {
	return r.DB.WithContext(ctx).Save(sale).Error
}

func (r *saleRepository) CreatePayment(ctx context.Context, payment *entity.Payment) error {
	return r.DB.WithContext(ctx).Create(payment).Error
}

func (r *saleRepository) GetDailySales(ctx context.Context, date string) ([]entity.Sale, error) {
	var sales []entity.Sale
	err := r.DB.WithContext(ctx).
		Preload("Items").
		Preload("Payments").
		Where("DATE(created_at) = ?", date).
		Where("status = ?", entity.SaleStatusPaid).
		Find(&sales).Error
	return sales, err
}

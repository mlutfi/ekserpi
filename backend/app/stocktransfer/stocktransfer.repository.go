package stocktransfer

import (
	"context"
	"hris_backend/entity"

	"gorm.io/gorm"
)

type StockTransferRepository interface {
	FindAll(ctx context.Context) ([]entity.StockTransfer, error)
	FindByID(ctx context.Context, id string) (*entity.StockTransfer, error)
	Create(ctx context.Context, tr *entity.StockTransfer) error
	Update(ctx context.Context, tr *entity.StockTransfer) error
	Delete(ctx context.Context, id string) error
	GetNextTransferNumber() string
}

type stockTransferRepository struct {
	DB *gorm.DB
}

func NewStockTransferRepository(db *gorm.DB) StockTransferRepository {
	return &stockTransferRepository{DB: db}
}

func (r *stockTransferRepository) FindAll(ctx context.Context) ([]entity.StockTransfer, error) {
	var trs []entity.StockTransfer
	err := r.DB.WithContext(ctx).
		Preload("SourceLocation").
		Preload("DestLocation").
		Preload("CreatedBy").
		Order("created_at DESC").Find(&trs).Error
	return trs, err
}

func (r *stockTransferRepository) FindByID(ctx context.Context, id string) (*entity.StockTransfer, error) {
	var tr entity.StockTransfer
	err := r.DB.WithContext(ctx).
		Preload("SourceLocation").
		Preload("DestLocation").
		Preload("CreatedBy").
		Preload("Items").
		Preload("Items.Product").
		First(&tr, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &tr, nil
}

func (r *stockTransferRepository) Create(ctx context.Context, tr *entity.StockTransfer) error {
	return r.DB.WithContext(ctx).Create(tr).Error
}

func (r *stockTransferRepository) Update(ctx context.Context, tr *entity.StockTransfer) error {
	return r.DB.WithContext(ctx).Save(tr).Error
}

func (r *stockTransferRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.StockTransfer{}, "id = ?", id).Error
}

func (r *stockTransferRepository) GetNextTransferNumber() string {
	var count int64
	r.DB.Model(&entity.StockTransfer{}).Count(&count)
	return "TRX-" + string(rune(count+1)) // simplified
}

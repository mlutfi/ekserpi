package purchaseorder

import (
	"context"
	"hris_backend/entity"

	"gorm.io/gorm"
)

type PurchaseOrderRepository interface {
	FindAll(ctx context.Context) ([]entity.PurchaseOrder, error)
	FindByID(ctx context.Context, id string) (*entity.PurchaseOrder, error)
	Create(ctx context.Context, po *entity.PurchaseOrder) error
	Update(ctx context.Context, po *entity.PurchaseOrder) error
	Delete(ctx context.Context, id string) error
	GetNextPONumber() string
}

type purchaseOrderRepository struct {
	DB *gorm.DB
}

func NewPurchaseOrderRepository(db *gorm.DB) PurchaseOrderRepository {
	return &purchaseOrderRepository{DB: db}
}

func (r *purchaseOrderRepository) FindAll(ctx context.Context) ([]entity.PurchaseOrder, error) {
	var pos []entity.PurchaseOrder
	err := r.DB.WithContext(ctx).
		Preload("Supplier").
		Preload("Location").
		Preload("CreatedBy").
		Order("created_at DESC").Find(&pos).Error
	return pos, err
}

func (r *purchaseOrderRepository) FindByID(ctx context.Context, id string) (*entity.PurchaseOrder, error) {
	var po entity.PurchaseOrder
	err := r.DB.WithContext(ctx).
		Preload("Supplier").
		Preload("Location").
		Preload("CreatedBy").
		Preload("Items").
		Preload("Items.Product").
		First(&po, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &po, nil
}

func (r *purchaseOrderRepository) Create(ctx context.Context, po *entity.PurchaseOrder) error {
	return r.DB.WithContext(ctx).Create(po).Error
}

func (r *purchaseOrderRepository) Update(ctx context.Context, po *entity.PurchaseOrder) error {
	return r.DB.WithContext(ctx).Save(po).Error
}

func (r *purchaseOrderRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.PurchaseOrder{}, "id = ?", id).Error
}

func (r *purchaseOrderRepository) GetNextPONumber() string {
	var count int64
	// In a real app we might want to query today's count to format PO-YYYYMMDD-00X
	r.DB.Model(&entity.PurchaseOrder{}).Count(&count)
	return "PO-" + string(rune(count+1)) // simplified
}

package stock

import (
	"context"

	"hris_backend/entity"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type StockRepository interface {
	CreateStockIn(ctx context.Context, stockIn *entity.StockIn) error
	GetStockIns(ctx context.Context, limit int, offset int) ([]entity.StockIn, int64, error)
	CreateStockOut(ctx context.Context, stockOut *entity.StockOut) error
	GetStockOuts(ctx context.Context, limit int, offset int) ([]entity.StockOut, int64, error)
	UpsertInventory(ctx context.Context, inventory *entity.Inventory) error
	InsertStockMovement(ctx context.Context, movement *entity.StockMovement) error
	GetAllInventory(ctx context.Context, locationId string) ([]entity.Inventory, error)
}

type stockRepository struct {
	DB *gorm.DB
}

func NewStockRepository(db *gorm.DB) StockRepository {
	return &stockRepository{DB: db}
}

func (r *stockRepository) CreateStockIn(ctx context.Context, stockIn *entity.StockIn) error {
	return r.DB.WithContext(ctx).Create(stockIn).Error
}

func (r *stockRepository) GetStockIns(ctx context.Context, limit int, offset int) ([]entity.StockIn, int64, error) {
	var stockIns []entity.StockIn
	var total int64

	query := r.DB.WithContext(ctx).Model(&entity.StockIn{})
	query.Count(&total)

	err := query.
		Preload("Product").
		Preload("Location").
		Preload("Supplier").
		Preload("PurchaseOrder").
		Preload("CreatedBy").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&stockIns).Error

	return stockIns, total, err
}

func (r *stockRepository) CreateStockOut(ctx context.Context, stockOut *entity.StockOut) error {
	return r.DB.WithContext(ctx).Create(stockOut).Error
}

func (r *stockRepository) GetStockOuts(ctx context.Context, limit int, offset int) ([]entity.StockOut, int64, error) {
	var stockOuts []entity.StockOut
	var total int64

	query := r.DB.WithContext(ctx).Model(&entity.StockOut{})
	query.Count(&total)

	err := query.
		Preload("Product").
		Preload("Location").
		Preload("CreatedBy").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&stockOuts).Error

	return stockOuts, total, err
}

func (r *stockRepository) UpsertInventory(ctx context.Context, inventory *entity.Inventory) error {
	return r.DB.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "product_id"}, {Name: "location_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"qty_on_hand", "updated_at", "total_cost", "avg_cost"}),
	}).Create(inventory).Error
}

func (r *stockRepository) InsertStockMovement(ctx context.Context, movement *entity.StockMovement) error {
	return r.DB.WithContext(ctx).Create(movement).Error
}

func (r *stockRepository) GetAllInventory(ctx context.Context, locationId string) ([]entity.Inventory, error) {
	var inventories []entity.Inventory
	query := r.DB.WithContext(ctx).
		Preload("Product.Category").
		Preload("Location").
		Joins("JOIN products ON products.id = inventories.product_id AND products.deleted_at IS NULL")

	if locationId != "" {
		query = query.Where("inventories.location_id = ?", locationId)
	}

	err := query.Find(&inventories).Error
	return inventories, err
}

package product

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type ProductRepository interface {
	GetAll(ctx context.Context) ([]entity.Product, error)
	GetByID(ctx context.Context, id string) (*entity.Product, error)
	Create(ctx context.Context, product *entity.Product) error
	Update(ctx context.Context, product *entity.Product) error
	Delete(ctx context.Context, id string) error
	Search(ctx context.Context, query string) ([]entity.Product, error)
	GetByCategory(ctx context.Context, categoryId string) ([]entity.Product, error)
	CreateInventory(ctx context.Context, inventory *entity.Inventory) error
	GetInventory(ctx context.Context, productId string) (*entity.Inventory, error)
}

type productRepository struct {
	DB *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{DB: db}
}

func (r *productRepository) GetAll(ctx context.Context) ([]entity.Product, error) {
	var products []entity.Product
	err := r.DB.WithContext(ctx).Preload("Category").Preload("Inventory").Where("is_active = ?", true).Order("created_at DESC").Find(&products).Error
	return products, err
}

func (r *productRepository) GetByID(ctx context.Context, id string) (*entity.Product, error) {
	product := new(entity.Product)
	err := r.DB.WithContext(ctx).Preload("Category").Preload("Inventory").First(product, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("product not found")
		}
		return nil, err
	}
	return product, nil
}

func (r *productRepository) Create(ctx context.Context, product *entity.Product) error {
	return r.DB.WithContext(ctx).Create(product).Error
}

func (r *productRepository) Update(ctx context.Context, product *entity.Product) error {
	return r.DB.WithContext(ctx).Save(product).Error
}

func (r *productRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Product{}, "id = ?", id).Error
}

func (r *productRepository) Search(ctx context.Context, query string) ([]entity.Product, error) {
	var products []entity.Product
	err := r.DB.WithContext(ctx).
		Preload("Category").
		Preload("Inventory").
		Where("is_active = ?", true).
		Where("name ILIKE ?", "%"+query+"%").
		Or("sku ILIKE ?", "%"+query+"%").
		Or("barcode ILIKE ?", "%"+query+"%").
		Find(&products).Error
	return products, err
}

func (r *productRepository) GetByCategory(ctx context.Context, categoryId string) ([]entity.Product, error) {
	var products []entity.Product
	err := r.DB.WithContext(ctx).
		Preload("Category").
		Preload("Inventory").
		Where("is_active = ? AND category_id = ?", true, categoryId).
		Find(&products).Error
	return products, err
}

func (r *productRepository) CreateInventory(ctx context.Context, inventory *entity.Inventory) error {
	return r.DB.WithContext(ctx).Create(inventory).Error
}

func (r *productRepository) GetInventory(ctx context.Context, productId string) (*entity.Inventory, error) {
	inventory := new(entity.Inventory)
	err := r.DB.WithContext(ctx).First(inventory, "product_id = ?", productId).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return inventory, nil
}

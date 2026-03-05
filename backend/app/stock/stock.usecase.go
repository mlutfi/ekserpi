package stock

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type StockUseCase interface {
	AddStockIn(ctx context.Context, userId string, request *StockInRequest) (*StockInResponse, error)
	GetStockIns(ctx context.Context, page, limit int) ([]StockInResponse, int64, error)
	AddStockOut(ctx context.Context, userId string, request *StockOutRequest) (*StockOutResponse, error)
	GetStockOuts(ctx context.Context, page, limit int) ([]StockOutResponse, int64, error)
	GetInventory(ctx context.Context) ([]InventoryResponse, error)
}

type stockUseCase struct {
	DB         *gorm.DB
	Repository StockRepository
}

func NewStockUseCase(db *gorm.DB, repository StockRepository) StockUseCase {
	return &stockUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *stockUseCase) AddStockIn(ctx context.Context, userId string, request *StockInRequest) (*StockInResponse, error) {
	// 1. Validasi produk ada
	var product entity.Product
	if err := u.DB.WithContext(ctx).First(&product, "id = ?", request.ProductID).Error; err != nil {
		return nil, errors.New("product not found")
	}

	notePtr := &request.Note
	if request.Note == "" {
		notePtr = nil
	}

	stockIn := &entity.StockIn{
		ProductID:   request.ProductID,
		Qty:         request.Qty,
		CostPerUnit: request.CostPerUnit,
		Note:        notePtr,
		CreatedByID: userId,
	}

	// Gunakan transaction
	err := u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		repo := NewStockRepository(tx)

		// 1. Insert StockIn
		if err := repo.CreateStockIn(ctx, stockIn); err != nil {
			return err
		}

		// 2. Insert StockMovement (RESTOCK)
		movement := &entity.StockMovement{
			ProductID: request.ProductID,
			Type:      entity.StockMovementTypeRestock,
			QtyDelta:  request.Qty,
			Note:      notePtr,
		}
		if err := repo.InsertStockMovement(ctx, movement); err != nil {
			return err
		}

		// 3. Update Inventory (Get current, then Upsert)
		var inv entity.Inventory
		err := tx.First(&inv, "product_id = ?", request.ProductID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				inv = entity.Inventory{ProductID: request.ProductID, QtyOnHand: request.Qty}
			} else {
				return err
			}
		} else {
			inv.QtyOnHand += request.Qty
		}

		return repo.UpsertInventory(ctx, &inv)
	})

	if err != nil {
		return nil, err
	}

	// Reload with relations for response
	u.DB.WithContext(ctx).Preload("Product").Preload("CreatedBy").First(stockIn, "id = ?", stockIn.ID)

	return ToStockInResponse(stockIn), nil
}

func (u *stockUseCase) GetStockIns(ctx context.Context, page, limit int) ([]StockInResponse, int64, error) {
	offset := (page - 1) * limit
	models, total, err := u.Repository.GetStockIns(ctx, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var res []StockInResponse
	for _, s := range models {
		res = append(res, *ToStockInResponse(&s))
	}
	return res, total, nil
}

func (u *stockUseCase) AddStockOut(ctx context.Context, userId string, request *StockOutRequest) (*StockOutResponse, error) {
	// 1. Validasi produk dan cek qty
	var inv entity.Inventory
	if err := u.DB.WithContext(ctx).First(&inv, "product_id = ?", request.ProductID).Error; err != nil {
		return nil, errors.New("inventory not found for product")
	}

	if inv.QtyOnHand < request.Qty {
		return nil, errors.New("insufficient inventory quantity")
	}

	notePtr := &request.Note
	if request.Note == "" {
		notePtr = nil
	}

	reason := entity.StockOutReason(request.Reason)

	stockOut := &entity.StockOut{
		ProductID:   request.ProductID,
		Qty:         request.Qty,
		Reason:      reason,
		Note:        notePtr,
		CreatedByID: userId,
	}

	err := u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		repo := NewStockRepository(tx)

		// 1. Insert StockOut
		if err := repo.CreateStockOut(ctx, stockOut); err != nil {
			return err
		}

		// 2. Insert StockMovement
		movType := entity.StockMovementTypeAdjustment
		if reason == entity.StockOutReasonRefund {
			movType = entity.StockMovementTypeRefund
		}

		movement := &entity.StockMovement{
			ProductID: request.ProductID,
			Type:      movType,
			QtyDelta:  -request.Qty,
			Note:      notePtr,
		}
		if err := repo.InsertStockMovement(ctx, movement); err != nil {
			return err
		}

		// 3. Update Inventory (-Qty)
		inv.QtyOnHand -= request.Qty
		return repo.UpsertInventory(ctx, &inv)
	})

	if err != nil {
		return nil, err
	}

	u.DB.WithContext(ctx).Preload("Product").Preload("CreatedBy").First(stockOut, "id = ?", stockOut.ID)

	return ToStockOutResponse(stockOut), nil
}

func (u *stockUseCase) GetStockOuts(ctx context.Context, page, limit int) ([]StockOutResponse, int64, error) {
	offset := (page - 1) * limit
	models, total, err := u.Repository.GetStockOuts(ctx, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var res []StockOutResponse
	for _, s := range models {
		res = append(res, *ToStockOutResponse(&s))
	}
	return res, total, nil
}

func (u *stockUseCase) GetInventory(ctx context.Context) ([]InventoryResponse, error) {
	inventories, err := u.Repository.GetAllInventory(ctx)
	if err != nil {
		return nil, err
	}

	var res []InventoryResponse
	for _, inv := range inventories {
		catName := ""
		sku := ""
		if inv.Product != nil {
			if inv.Product.Category != nil {
				catName = inv.Product.Category.Name
			}
			if inv.Product.SKU != nil {
				sku = *inv.Product.SKU
			}
			res = append(res, InventoryResponse{
				ProductID:   inv.ProductID,
				ProductName: inv.Product.Name,
				Category:    catName,
				SKU:         sku,
				QtyOnHand:   inv.QtyOnHand,
			})
		}
	}
	return res, nil
}

package stock

import (
	"context"
	"errors"
	"fmt"
	"time"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type StockUseCase interface {
	AddStockIn(ctx context.Context, userId string, request *StockInRequest) (*StockInResponse, error)
	GetStockIns(ctx context.Context, page, limit int) ([]StockInResponse, int64, error)
	AddStockOut(ctx context.Context, userId string, request *StockOutRequest) (*StockOutResponse, error)
	GetStockOuts(ctx context.Context, page, limit int) ([]StockOutResponse, int64, error)
	GetInventory(ctx context.Context) ([]InventoryResponse, error)
	TransferStock(ctx context.Context, userId string, req *TransferStockRequest) error
	AdjustStock(ctx context.Context, userId string, req *AdjustStockRequest) error
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

	var expiryDate *time.Time
	if request.ExpiryDate != nil && *request.ExpiryDate != "" {
		parsed, err := time.Parse("2006-01-02", *request.ExpiryDate)
		if err == nil {
			expiryDate = &parsed
		}
	}

	stockIn := &entity.StockIn{
		ProductID:       request.ProductID,
		LocationID:      request.LocationID,
		SupplierID:      request.SupplierID,
		PurchaseOrderID: request.PurchaseOrderID,
		Qty:             request.Qty,
		CostPerUnit:     request.CostPerUnit,
		Note:            notePtr,
		ExpiryDate:      expiryDate,
		BatchNumber:     request.BatchNumber,
		CreatedByID:     userId,
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
			ProductID:  request.ProductID,
			LocationID: request.LocationID,
			Type:       entity.StockMovementTypeRestock,
			QtyDelta:   request.Qty,
			Note:       notePtr,
		}
		if err := repo.InsertStockMovement(ctx, movement); err != nil {
			return err
		}

		// 3. Update Inventory (Get current, then Upsert)
		var inv entity.Inventory
		err := tx.First(&inv, "product_id = ? AND location_id = ?", request.ProductID, request.LocationID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				inv = entity.Inventory{
					ProductID:  request.ProductID,
					LocationID: request.LocationID,
					QtyOnHand:  request.Qty,
					TotalCost:  request.Qty * request.CostPerUnit,
					AvgCost:    request.CostPerUnit,
				}
			} else {
				return err
			}
		} else {
			inv.QtyOnHand += request.Qty
			inv.TotalCost += (request.Qty * request.CostPerUnit)
			if inv.QtyOnHand > 0 {
				inv.AvgCost = inv.TotalCost / inv.QtyOnHand
			}
			if expiryDate != nil {
				inv.ExpiryDate = expiryDate
			}
			if request.BatchNumber != nil && *request.BatchNumber != "" {
				inv.BatchNumber = request.BatchNumber
			}
		}

		return repo.UpsertInventory(ctx, &inv)
	})

	if err != nil {
		return nil, err
	}

	// Reload with relations for response
	u.DB.WithContext(ctx).Preload("Product").Preload("Location").Preload("Supplier").Preload("PurchaseOrder").Preload("CreatedBy").First(stockIn, "id = ?", stockIn.ID)

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
	if err := u.DB.WithContext(ctx).First(&inv, "product_id = ? AND location_id = ?", request.ProductID, request.LocationID).Error; err != nil {
		return nil, errors.New("inventory not found for product in this location")
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
		LocationID:  request.LocationID,
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
			ProductID:  request.ProductID,
			LocationID: request.LocationID,
			Type:       movType,
			QtyDelta:   -request.Qty,
			Note:       notePtr,
		}
		if err := repo.InsertStockMovement(ctx, movement); err != nil {
			return err
		}

		// 3. Update Inventory (-Qty, -Cost proportionally)
		deductedCost := inv.AvgCost * request.Qty
		inv.QtyOnHand -= request.Qty
		inv.TotalCost -= deductedCost
		if inv.QtyOnHand > 0 {
			inv.AvgCost = inv.TotalCost / inv.QtyOnHand
		} else {
			inv.AvgCost = 0
			inv.TotalCost = 0
		}
		return repo.UpsertInventory(ctx, &inv)
	})

	if err != nil {
		return nil, err
	}

	u.DB.WithContext(ctx).Preload("Product").Preload("Location").Preload("CreatedBy").First(stockOut, "id = ?", stockOut.ID)

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
		locationName := ""
		if inv.Location != nil {
			locationName = inv.Location.Name
		}
		if inv.Product != nil {
			if inv.Product.Category != nil {
				catName = inv.Product.Category.Name
			}
			if inv.Product.SKU != nil {
				sku = *inv.Product.SKU
			}
			var exp *string
			if inv.ExpiryDate != nil {
				e := inv.ExpiryDate.Format("2006-01-02")
				exp = &e
			}
			res = append(res, InventoryResponse{
				ProductID:    inv.ProductID,
				ProductName:  inv.Product.Name,
				Category:     catName,
				SKU:          sku,
				LocationID:   inv.LocationID,
				LocationName: locationName,
				QtyOnHand:    inv.QtyOnHand,
				AvgCost:      inv.AvgCost, // Assuming added to InventoryResponse
				ExpiryDate:   exp,
				BatchNumber:  inv.BatchNumber,
			})
		}
	}
	return res, nil
}

type TransferStockRequest struct {
	ProductID        string
	SourceLocationID string
	DestLocationID   string
	Qty              int
	Note             *string
	RefTransferID    *string
}

func (u *stockUseCase) TransferStock(ctx context.Context, userId string, req *TransferStockRequest) error {
	return u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		repo := NewStockRepository(tx)

		// 1. Validate & Deduct from Source
		var srcInv entity.Inventory
		if err := tx.First(&srcInv, "product_id = ? AND location_id = ?", req.ProductID, req.SourceLocationID).Error; err != nil {
			return fmt.Errorf("source inventory not found for product %s", req.ProductID)
		}

		if srcInv.QtyOnHand < req.Qty {
			return fmt.Errorf("insufficient stock in source location for product %s", req.ProductID)
		}

		deductedCost := srcInv.AvgCost * req.Qty
		srcInv.QtyOnHand -= req.Qty
		srcInv.TotalCost -= deductedCost
		if srcInv.QtyOnHand > 0 {
			srcInv.AvgCost = srcInv.TotalCost / srcInv.QtyOnHand
		} else {
			srcInv.AvgCost = 0
			srcInv.TotalCost = 0
		}
		if err := repo.UpsertInventory(ctx, &srcInv); err != nil {
			return err
		}

		outMovement := &entity.StockMovement{
			ProductID:     req.ProductID,
			LocationID:    req.SourceLocationID,
			Type:          entity.StockMovementTypeTransferOut,
			QtyDelta:      -req.Qty,
			RefTransferID: req.RefTransferID,
			Note:          req.Note,
		}
		if err := repo.InsertStockMovement(ctx, outMovement); err != nil {
			return err
		}

		// 2. Add to Dest
		var destInv entity.Inventory
		err := tx.First(&destInv, "product_id = ? AND location_id = ?", req.ProductID, req.DestLocationID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				destInv = entity.Inventory{
					ProductID:  req.ProductID,
					LocationID: req.DestLocationID,
					QtyOnHand:  req.Qty,
					TotalCost:  deductedCost,
					AvgCost:    srcInv.AvgCost, // Use Source's AvgCost
				}
			} else {
				return err
			}
		} else {
			destInv.QtyOnHand += req.Qty
			destInv.TotalCost += deductedCost
			if destInv.QtyOnHand > 0 {
				destInv.AvgCost = destInv.TotalCost / destInv.QtyOnHand
			}
		}
		if err := repo.UpsertInventory(ctx, &destInv); err != nil {
			return err
		}

		inMovement := &entity.StockMovement{
			ProductID:     req.ProductID,
			LocationID:    req.DestLocationID,
			Type:          entity.StockMovementTypeTransferIn,
			QtyDelta:      req.Qty,
			RefTransferID: req.RefTransferID,
			Note:          req.Note,
		}
		return repo.InsertStockMovement(ctx, inMovement)
	})
}

type AdjustStockRequest struct {
	ProductID   string
	LocationID  string
	QtyActual   int
	Note        *string
	RefOpnameID *string
}

func (u *stockUseCase) AdjustStock(ctx context.Context, userId string, req *AdjustStockRequest) error {
	return u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		repo := NewStockRepository(tx)

		var inv entity.Inventory
		err := tx.First(&inv, "product_id = ? AND location_id = ?", req.ProductID, req.LocationID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				inv = entity.Inventory{
					ProductID:  req.ProductID,
					LocationID: req.LocationID,
					QtyOnHand:  req.QtyActual,
					TotalCost:  0,
					AvgCost:    0,
				}
			} else {
				return err
			}
		}

		qtyDelta := req.QtyActual - inv.QtyOnHand
		if qtyDelta == 0 {
			return nil // No adjustment needed
		}

		// Adjust inventory
		inv.QtyOnHand = req.QtyActual
		// For cost, let's keep AvgCost roughly the same, but update TotalCost
		inv.TotalCost = inv.QtyOnHand * inv.AvgCost

		if err := repo.UpsertInventory(ctx, &inv); err != nil {
			return err
		}

		movement := &entity.StockMovement{
			ProductID:   req.ProductID,
			LocationID:  req.LocationID,
			Type:        entity.StockMovementTypeAdjustment,
			QtyDelta:    qtyDelta,
			RefOpnameID: req.RefOpnameID,
			Note:        req.Note,
		}
		return repo.InsertStockMovement(ctx, movement)
	})
}

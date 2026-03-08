package purchaseorder

import (
	"context"
	"errors"
	"fmt"
	"hris_backend/app/stock"
	"hris_backend/entity"
	"time"
)

type PurchaseOrderUseCase interface {
	FindAll(ctx context.Context) ([]PurchaseOrderResponse, error)
	FindByID(ctx context.Context, id string) (*PurchaseOrderResponse, error)
	Create(ctx context.Context, req *CreatePORequest, createdBy string) (*PurchaseOrderResponse, error)
	UpdateStatus(ctx context.Context, id string, req *UpdatePOStatusRequest, updatedBy string) (*PurchaseOrderResponse, error)
	Delete(ctx context.Context, id string) error
}

type purchaseOrderUseCase struct {
	Repo         PurchaseOrderRepository
	StockUseCase stock.StockUseCase
}

func NewPurchaseOrderUseCase(repo PurchaseOrderRepository, stockUseCase stock.StockUseCase) PurchaseOrderUseCase {
	return &purchaseOrderUseCase{Repo: repo, StockUseCase: stockUseCase}
}

func toResponse(po *entity.PurchaseOrder) PurchaseOrderResponse {
	supplierName := ""
	if po.Supplier != nil {
		supplierName = po.Supplier.Name
	}
	locationName := ""
	if po.Location != nil {
		locationName = po.Location.Name
	}
	createdByName := ""
	if po.CreatedBy != nil {
		createdByName = po.CreatedBy.Name
	}

	items := []PurchaseOrderItemResponse{}
	for _, item := range po.Items {
		productName := ""
		if item.Product != nil {
			productName = item.Product.Name
		}
		items = append(items, PurchaseOrderItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: productName,
			QtyOrdered:  item.QtyOrdered,
			QtyReceived: item.QtyReceived,
			CostPerUnit: item.CostPerUnit,
			Subtotal:    item.Subtotal,
		})
	}

	return PurchaseOrderResponse{
		ID:            po.ID,
		PONumber:      po.PONumber,
		SupplierID:    po.SupplierID,
		SupplierName:  supplierName,
		LocationID:    po.LocationID,
		LocationName:  locationName,
		Status:        po.Status,
		TotalAmount:   po.TotalAmount,
		Note:          po.Note,
		OrderDate:     po.OrderDate,
		CreatedByID:   po.CreatedByID,
		CreatedByName: createdByName,
		Items:         items,
		CreatedAt:     po.CreatedAt,
	}
}

func (u *purchaseOrderUseCase) FindAll(ctx context.Context) ([]PurchaseOrderResponse, error) {
	pos, err := u.Repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var res []PurchaseOrderResponse
	for _, p := range pos {
		res = append(res, toResponse(&p))
	}
	return res, nil
}

func (u *purchaseOrderUseCase) FindByID(ctx context.Context, id string) (*PurchaseOrderResponse, error) {
	po, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("purchase order not found")
	}

	res := toResponse(po)
	return &res, nil
}

func (u *purchaseOrderUseCase) Create(ctx context.Context, req *CreatePORequest, createdBy string) (*PurchaseOrderResponse, error) {
	// Generate basic PO Number (PO-YYYYMMDD-HHMMSS)
	poNumber := fmt.Sprintf("PO-%s", time.Now().Format("20060102-150405"))

	var items []entity.PurchaseOrderItem
	totalAmount := 0
	for _, itemReq := range req.Items {
		subtotal := itemReq.QtyOrdered * itemReq.CostPerUnit
		totalAmount += subtotal

		items = append(items, entity.PurchaseOrderItem{
			ProductID:   itemReq.ProductID,
			QtyOrdered:  itemReq.QtyOrdered,
			QtyReceived: 0,
			CostPerUnit: itemReq.CostPerUnit,
			Subtotal:    subtotal,
		})
	}

	po := &entity.PurchaseOrder{
		PONumber:    poNumber,
		SupplierID:  req.SupplierID,
		LocationID:  req.LocationID,
		Status:      entity.POStatusDraft,
		TotalAmount: totalAmount,
		Note:        req.Note,
		OrderDate:   req.OrderDate,
		CreatedByID: createdBy,
		Items:       items,
	}

	if err := u.Repo.Create(ctx, po); err != nil {
		return nil, err
	}

	// Fetch cleanly for full relations in response
	createdPO, _ := u.Repo.FindByID(ctx, po.ID)
	res := toResponse(createdPO)
	return &res, nil
}

func (u *purchaseOrderUseCase) UpdateStatus(ctx context.Context, id string, req *UpdatePOStatusRequest, updatedBy string) (*PurchaseOrderResponse, error) {
	po, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("purchase order not found")
	}

	if req.Status == entity.POStatusCompleted && po.Status != entity.POStatusCompleted {
		for i, item := range po.Items {
			_, err := u.StockUseCase.AddStockIn(ctx, updatedBy, &stock.StockInRequest{
				ProductID:       item.ProductID,
				LocationID:      po.LocationID,
				SupplierID:      &po.SupplierID,
				PurchaseOrderID: &po.ID,
				Qty:             item.QtyOrdered, // Auto full receipt
				CostPerUnit:     item.CostPerUnit,
				Note:            "PO Receipt Automatically Completed",
			})
			if err != nil {
				return nil, fmt.Errorf("failed to receive stock for item %s: %w", item.ProductID, err)
			}
			po.Items[i].QtyReceived = item.QtyOrdered
		}
	}

	po.Status = req.Status
	if err := u.Repo.Update(ctx, po); err != nil {
		return nil, err
	}

	res := toResponse(po)
	return &res, nil
}

func (u *purchaseOrderUseCase) Delete(ctx context.Context, id string) error {
	po, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return errors.New("purchase order not found")
	}

	if po.Status != entity.POStatusDraft {
		return errors.New("can only delete DRAFT purchase orders")
	}

	return u.Repo.Delete(ctx, id)
}

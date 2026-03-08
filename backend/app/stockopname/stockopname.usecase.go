package stockopname

import (
	"context"
	"errors"
	"fmt"
	"hris_backend/app/stock"
	"hris_backend/entity"
	"time"
)

type StockOpnameUseCase interface {
	FindAll(ctx context.Context) ([]StockOpnameResponse, error)
	FindByID(ctx context.Context, id string) (*StockOpnameResponse, error)
	Create(ctx context.Context, req *CreateOpnameRequest, createdBy string) (*StockOpnameResponse, error)
	UpdateStatus(ctx context.Context, id string, req *UpdateOpnameStatusRequest, updatedBy string) (*StockOpnameResponse, error)
	Delete(ctx context.Context, id string) error
}

type stockOpnameUseCase struct {
	Repo         StockOpnameRepository
	StockUseCase stock.StockUseCase
}

func NewStockOpnameUseCase(repo StockOpnameRepository, stockUseCase stock.StockUseCase) StockOpnameUseCase {
	return &stockOpnameUseCase{Repo: repo, StockUseCase: stockUseCase}
}

func toResponse(opname *entity.StockOpname) StockOpnameResponse {
	locationName := ""
	if opname.Location != nil {
		locationName = opname.Location.Name
	}
	createdByName := ""
	if opname.CreatedBy != nil {
		createdByName = opname.CreatedBy.Name
	}

	items := []StockOpnameItemResponse{}
	for _, item := range opname.Items {
		productName := ""
		if item.Product != nil {
			productName = item.Product.Name
		}
		items = append(items, StockOpnameItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: productName,
			QtySystem:   item.QtySystem,
			QtyActual:   item.QtyActual,
			QtyDelta:    item.QtyDelta,
		})
	}

	return StockOpnameResponse{
		ID:            opname.ID,
		OpnameNumber:  opname.OpnameNumber,
		LocationID:    opname.LocationID,
		LocationName:  locationName,
		Status:        opname.Status,
		Note:          opname.Note,
		CreatedByID:   opname.CreatedByID,
		CreatedByName: createdByName,
		Items:         items,
		CreatedAt:     opname.CreatedAt,
	}
}

func (u *stockOpnameUseCase) FindAll(ctx context.Context) ([]StockOpnameResponse, error) {
	opnames, err := u.Repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var res []StockOpnameResponse
	for _, o := range opnames {
		res = append(res, toResponse(&o))
	}
	return res, nil
}

func (u *stockOpnameUseCase) FindByID(ctx context.Context, id string) (*StockOpnameResponse, error) {
	opname, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("stock opname not found")
	}

	res := toResponse(opname)
	return &res, nil
}

func (u *stockOpnameUseCase) Create(ctx context.Context, req *CreateOpnameRequest, createdBy string) (*StockOpnameResponse, error) {
	opnameNumber := fmt.Sprintf("OPN-%s", time.Now().Format("20060102-150405"))

	var items []entity.StockOpnameItem
	for _, itemReq := range req.Items {
		items = append(items, entity.StockOpnameItem{
			ProductID: itemReq.ProductID,
			QtySystem: itemReq.QtySystem,
			QtyActual: itemReq.QtyActual,
			QtyDelta:  itemReq.QtyActual - itemReq.QtySystem,
		})
	}

	opname := &entity.StockOpname{
		OpnameNumber: opnameNumber,
		LocationID:   req.LocationID,
		Status:       entity.StockOpnameStatusDraft, // OPNAME are DRAFT initially
		Note:         req.Note,
		CreatedByID:  createdBy,
		Items:        items,
	}

	if err := u.Repo.Create(ctx, opname); err != nil {
		return nil, err
	}

	createdOpname, _ := u.Repo.FindByID(ctx, opname.ID)
	res := toResponse(createdOpname)
	return &res, nil
}

func (u *stockOpnameUseCase) UpdateStatus(ctx context.Context, id string, req *UpdateOpnameStatusRequest, updatedBy string) (*StockOpnameResponse, error) {
	opname, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("stock opname not found")
	}

	if req.Status == entity.StockOpnameStatusCompleted && opname.Status != entity.StockOpnameStatusCompleted {
		for _, item := range opname.Items {
			note := fmt.Sprintf("Opname System: %d, Actual: %d Delta: %d", item.QtySystem, item.QtyActual, item.QtyDelta)
			err := u.StockUseCase.AdjustStock(ctx, updatedBy, &stock.AdjustStockRequest{
				ProductID:   item.ProductID,
				LocationID:  opname.LocationID,
				QtyActual:   item.QtyActual,
				RefOpnameID: &opname.ID,
				Note:        &note,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to adjust stock for product %s: %w", item.ProductID, err)
			}
		}
	}

	opname.Status = req.Status
	if err := u.Repo.Update(ctx, opname); err != nil {
		return nil, err
	}

	res := toResponse(opname)
	return &res, nil
}

func (u *stockOpnameUseCase) Delete(ctx context.Context, id string) error {
	opname, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return errors.New("stock opname not found")
	}

	if opname.Status != entity.StockOpnameStatusDraft {
		return errors.New("can only delete DRAFT stock opnames")
	}

	return u.Repo.Delete(ctx, id)
}

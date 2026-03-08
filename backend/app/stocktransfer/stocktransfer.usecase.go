package stocktransfer

import (
	"context"
	"errors"
	"fmt"
	"hris_backend/app/stock"
	"hris_backend/entity"
	"time"
)

type StockTransferUseCase interface {
	FindAll(ctx context.Context) ([]StockTransferResponse, error)
	FindByID(ctx context.Context, id string) (*StockTransferResponse, error)
	Create(ctx context.Context, req *CreateTransferRequest, createdBy string) (*StockTransferResponse, error)
	UpdateStatus(ctx context.Context, id string, req *UpdateTransferStatusRequest, updatedBy string) (*StockTransferResponse, error)
	Delete(ctx context.Context, id string) error
}

type stockTransferUseCase struct {
	Repo         StockTransferRepository
	StockUseCase stock.StockUseCase
}

func NewStockTransferUseCase(repo StockTransferRepository, stockUseCase stock.StockUseCase) StockTransferUseCase {
	return &stockTransferUseCase{Repo: repo, StockUseCase: stockUseCase}
}

func toResponse(tr *entity.StockTransfer) StockTransferResponse {
	srcName := ""
	if tr.SourceLocation != nil {
		srcName = tr.SourceLocation.Name
	}
	destName := ""
	if tr.DestLocation != nil {
		destName = tr.DestLocation.Name
	}
	createdByName := ""
	if tr.CreatedBy != nil {
		createdByName = tr.CreatedBy.Name
	}

	items := []StockTransferItemResponse{}
	for _, item := range tr.Items {
		productName := ""
		if item.Product != nil {
			productName = item.Product.Name
		}
		items = append(items, StockTransferItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: productName,
			Qty:         item.Qty,
		})
	}

	return StockTransferResponse{
		ID:                 tr.ID,
		TransferNumber:     tr.TransferNumber,
		SourceLocationID:   tr.SourceLocationID,
		SourceLocationName: srcName,
		DestLocationID:     tr.DestLocationID,
		DestLocationName:   destName,
		Status:             tr.Status,
		Note:               tr.Note,
		CreatedByID:        tr.CreatedByID,
		CreatedByName:      createdByName,
		Items:              items,
		CreatedAt:          tr.CreatedAt,
	}
}

func (u *stockTransferUseCase) FindAll(ctx context.Context) ([]StockTransferResponse, error) {
	trs, err := u.Repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var res []StockTransferResponse
	for _, t := range trs {
		res = append(res, toResponse(&t))
	}
	return res, nil
}

func (u *stockTransferUseCase) FindByID(ctx context.Context, id string) (*StockTransferResponse, error) {
	tr, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("stock transfer not found")
	}

	res := toResponse(tr)
	return &res, nil
}

func (u *stockTransferUseCase) Create(ctx context.Context, req *CreateTransferRequest, createdBy string) (*StockTransferResponse, error) {
	if req.SourceLocationID == req.DestLocationID {
		return nil, errors.New("source and destination locations cannot be the same")
	}

	transferNumber := fmt.Sprintf("TRX-%s", time.Now().Format("20060102-150405"))

	var items []entity.StockTransferItem
	for _, itemReq := range req.Items {
		items = append(items, entity.StockTransferItem{
			ProductID: itemReq.ProductID,
			Qty:       itemReq.Qty,
		})
	}

	tr := &entity.StockTransfer{
		TransferNumber:   transferNumber,
		SourceLocationID: req.SourceLocationID,
		DestLocationID:   req.DestLocationID,
		Status:           entity.StockTransferStatusPending,
		Note:             req.Note,
		CreatedByID:      createdBy,
		Items:            items,
	}

	if err := u.Repo.Create(ctx, tr); err != nil {
		return nil, err
	}

	createdTR, _ := u.Repo.FindByID(ctx, tr.ID)
	res := toResponse(createdTR)
	return &res, nil
}

func (u *stockTransferUseCase) UpdateStatus(ctx context.Context, id string, req *UpdateTransferStatusRequest, updatedBy string) (*StockTransferResponse, error) {
	tr, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("stock transfer not found")
	}

	if req.Status == entity.StockTransferStatusCompleted && tr.Status != entity.StockTransferStatusCompleted {
		for _, item := range tr.Items {
			note := fmt.Sprintf("Transfer TRX-%s", tr.TransferNumber)
			err := u.StockUseCase.TransferStock(ctx, updatedBy, &stock.TransferStockRequest{
				ProductID:        item.ProductID,
				SourceLocationID: tr.SourceLocationID,
				DestLocationID:   tr.DestLocationID,
				Qty:              item.Qty,
				RefTransferID:    &tr.ID,
				Note:             &note,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to transfer stock for product %s: %w", item.ProductID, err)
			}
		}
	}

	tr.Status = req.Status
	if err := u.Repo.Update(ctx, tr); err != nil {
		return nil, err
	}

	res := toResponse(tr)
	return &res, nil
}

func (u *stockTransferUseCase) Delete(ctx context.Context, id string) error {
	tr, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return errors.New("stock transfer not found")
	}

	if tr.Status != entity.StockTransferStatusPending {
		return errors.New("can only delete PENDING stock transfers")
	}

	return u.Repo.Delete(ctx, id)
}

package supplier

import (
	"context"
	"errors"
	"hris_backend/entity"
)

type SupplierUseCase interface {
	FindAll(ctx context.Context) ([]SupplierResponse, error)
	FindByID(ctx context.Context, id string) (*SupplierResponse, error)
	Create(ctx context.Context, req *CreateSupplierRequest) (*SupplierResponse, error)
	Update(ctx context.Context, id string, req *UpdateSupplierRequest) (*SupplierResponse, error)
	Delete(ctx context.Context, id string) error
}

type supplierUseCase struct {
	Repo SupplierRepository
}

func NewSupplierUseCase(repo SupplierRepository) SupplierUseCase {
	return &supplierUseCase{Repo: repo}
}

func toResponse(sup *entity.Supplier) SupplierResponse {
	return SupplierResponse{
		ID:          sup.ID,
		Name:        sup.Name,
		ContactName: sup.ContactName,
		Phone:       sup.Phone,
		Email:       sup.Email,
		Address:     sup.Address,
		IsActive:    sup.IsActive,
		CreatedAt:   sup.CreatedAt,
	}
}

func (u *supplierUseCase) FindAll(ctx context.Context) ([]SupplierResponse, error) {
	suppliers, err := u.Repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var res []SupplierResponse
	for _, s := range suppliers {
		res = append(res, toResponse(&s))
	}
	return res, nil
}

func (u *supplierUseCase) FindByID(ctx context.Context, id string) (*SupplierResponse, error) {
	sup, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("supplier not found")
	}

	res := toResponse(sup)
	return &res, nil
}

func (u *supplierUseCase) Create(ctx context.Context, req *CreateSupplierRequest) (*SupplierResponse, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	sup := &entity.Supplier{
		Name:        req.Name,
		ContactName: req.ContactName,
		Phone:       req.Phone,
		Email:       req.Email,
		Address:     req.Address,
		IsActive:    isActive,
	}

	if err := u.Repo.Create(ctx, sup); err != nil {
		return nil, err
	}

	res := toResponse(sup)
	return &res, nil
}

func (u *supplierUseCase) Update(ctx context.Context, id string, req *UpdateSupplierRequest) (*SupplierResponse, error) {
	sup, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("supplier not found")
	}

	if req.Name != nil {
		sup.Name = *req.Name
	}
	if req.ContactName != nil {
		sup.ContactName = req.ContactName
	}
	if req.Phone != nil {
		sup.Phone = req.Phone
	}
	if req.Email != nil {
		sup.Email = req.Email
	}
	if req.Address != nil {
		sup.Address = req.Address
	}
	if req.IsActive != nil {
		sup.IsActive = *req.IsActive
	}

	if err := u.Repo.Update(ctx, sup); err != nil {
		return nil, err
	}

	res := toResponse(sup)
	return &res, nil
}

func (u *supplierUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return errors.New("supplier not found")
	}

	return u.Repo.Delete(ctx, id)
}

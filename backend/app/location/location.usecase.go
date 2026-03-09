package location

import (
	"context"
	"errors"
	"hris_backend/entity"
)

type LocationUseCase interface {
	FindAll(ctx context.Context) ([]LocationResponse, error)
	FindByID(ctx context.Context, id string) (*LocationResponse, error)
	Create(ctx context.Context, req *CreateLocationRequest) (*LocationResponse, error)
	Update(ctx context.Context, id string, req *UpdateLocationRequest) (*LocationResponse, error)
	Delete(ctx context.Context, id string) error
}

type locationUseCase struct {
	Repo LocationRepository
}

func NewLocationUseCase(repo LocationRepository) LocationUseCase {
	return &locationUseCase{Repo: repo}
}

func toResponse(loc *entity.Location) LocationResponse {
	return LocationResponse{
		ID:        loc.ID,
		Name:      loc.Name,
		Type:      loc.Type,
		Address:   loc.Address,
		IsActive:  loc.IsActive,
		IsDefault: loc.IsDefault,
		CreatedAt: loc.CreatedAt,
	}
}

func (u *locationUseCase) FindAll(ctx context.Context) ([]LocationResponse, error) {
	locations, err := u.Repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var res []LocationResponse
	for _, l := range locations {
		res = append(res, toResponse(&l))
	}
	return res, nil
}

func (u *locationUseCase) FindByID(ctx context.Context, id string) (*LocationResponse, error) {
	loc, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("location not found")
	}

	res := toResponse(loc)
	return &res, nil
}

func (u *locationUseCase) Create(ctx context.Context, req *CreateLocationRequest) (*LocationResponse, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	isDefault := false
	if req.IsDefault != nil {
		isDefault = *req.IsDefault
	}

	locType := entity.LocationTypeOutlet
	if req.Type != nil {
		locType = *req.Type
	}

	loc := &entity.Location{
		Name:      req.Name,
		Type:      locType,
		Address:   req.Address,
		IsActive:  isActive,
		IsDefault: isDefault,
	}

	if err := u.Repo.Create(ctx, loc); err != nil {
		return nil, err
	}

	res := toResponse(loc)
	return &res, nil
}

func (u *locationUseCase) Update(ctx context.Context, id string, req *UpdateLocationRequest) (*LocationResponse, error) {
	loc, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("location not found")
	}

	if req.Name != nil {
		loc.Name = *req.Name
	}
	if req.Type != nil {
		loc.Type = *req.Type
	}
	if req.Address != nil {
		loc.Address = req.Address
	}
	if req.IsActive != nil {
		loc.IsActive = *req.IsActive
	}
	if req.IsDefault != nil {
		loc.IsDefault = *req.IsDefault
	}

	if err := u.Repo.Update(ctx, loc); err != nil {
		return nil, err
	}

	res := toResponse(loc)
	return &res, nil
}

func (u *locationUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repo.FindByID(ctx, id)
	if err != nil {
		return errors.New("location not found")
	}

	return u.Repo.Delete(ctx, id)
}

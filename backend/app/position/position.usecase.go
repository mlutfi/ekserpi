package position

import (
	"context"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type PositionUseCase interface {
	GetAll(ctx context.Context) ([]PositionResponse, error)
	GetByID(ctx context.Context, id string) (*PositionResponse, error)
	Create(ctx context.Context, request *CreatePositionRequest) (*PositionResponse, error)
	Update(ctx context.Context, id string, request *UpdatePositionRequest) (*PositionResponse, error)
	Delete(ctx context.Context, id string) error
}

type positionUseCase struct {
	DB         *gorm.DB
	Repository PositionRepository
}

func NewPositionUseCase(db *gorm.DB, repository PositionRepository) PositionUseCase {
	return &positionUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *positionUseCase) GetAll(ctx context.Context) ([]PositionResponse, error) {
	positions, err := u.Repository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var responses []PositionResponse
	for _, p := range positions {
		responses = append(responses, PositionResponse{
			ID:    p.ID,
			Name:  p.Name,
			Level: p.Level,
		})
	}
	return responses, nil
}

func (u *positionUseCase) GetByID(ctx context.Context, id string) (*PositionResponse, error) {
	position, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &PositionResponse{
		ID:    position.ID,
		Name:  position.Name,
		Level: position.Level,
	}, nil
}

func (u *positionUseCase) Create(ctx context.Context, request *CreatePositionRequest) (*PositionResponse, error) {
	position := &entity.Position{
		Name:  request.Name,
		Level: request.Level,
	}

	err := u.Repository.Create(ctx, position)
	if err != nil {
		return nil, err
	}

	return &PositionResponse{
		ID:    position.ID,
		Name:  position.Name,
		Level: position.Level,
	}, nil
}

func (u *positionUseCase) Update(ctx context.Context, id string, request *UpdatePositionRequest) (*PositionResponse, error) {
	position, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	position.Name = request.Name
	position.Level = request.Level

	err = u.Repository.Update(ctx, position)
	if err != nil {
		return nil, err
	}

	return &PositionResponse{
		ID:    position.ID,
		Name:  position.Name,
		Level: position.Level,
	}, nil
}

func (u *positionUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return u.Repository.Delete(ctx, id)
}

package position

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type PositionRepository interface {
	GetAll(ctx context.Context) ([]entity.Position, error)
	GetByID(ctx context.Context, id string) (*entity.Position, error)
	Create(ctx context.Context, position *entity.Position) error
	Update(ctx context.Context, position *entity.Position) error
	Delete(ctx context.Context, id string) error
}

type positionRepository struct {
	DB *gorm.DB
}

func NewPositionRepository(db *gorm.DB) PositionRepository {
	return &positionRepository{DB: db}
}

func (r *positionRepository) GetAll(ctx context.Context) ([]entity.Position, error) {
	var positions []entity.Position
	err := r.DB.WithContext(ctx).Find(&positions).Error
	return positions, err
}

func (r *positionRepository) GetByID(ctx context.Context, id string) (*entity.Position, error) {
	position := new(entity.Position)
	err := r.DB.WithContext(ctx).First(position, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("position not found")
		}
		return nil, err
	}
	return position, nil
}

func (r *positionRepository) Create(ctx context.Context, position *entity.Position) error {
	return r.DB.WithContext(ctx).Create(position).Error
}

func (r *positionRepository) Update(ctx context.Context, position *entity.Position) error {
	return r.DB.WithContext(ctx).Save(position).Error
}

func (r *positionRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Position{}, "id = ?", id).Error
}

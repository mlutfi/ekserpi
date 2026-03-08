package location

import (
	"context"
	"hris_backend/entity"

	"gorm.io/gorm"
)

type LocationRepository interface {
	FindAll(ctx context.Context) ([]entity.Location, error)
	FindByID(ctx context.Context, id string) (*entity.Location, error)
	Create(ctx context.Context, location *entity.Location) error
	Update(ctx context.Context, location *entity.Location) error
	Delete(ctx context.Context, id string) error
}

type locationRepository struct {
	DB *gorm.DB
}

func NewLocationRepository(db *gorm.DB) LocationRepository {
	return &locationRepository{DB: db}
}

func (r *locationRepository) FindAll(ctx context.Context) ([]entity.Location, error) {
	var locations []entity.Location
	err := r.DB.WithContext(ctx).Order("name ASC").Find(&locations).Error
	return locations, err
}

func (r *locationRepository) FindByID(ctx context.Context, id string) (*entity.Location, error) {
	var location entity.Location
	err := r.DB.WithContext(ctx).First(&location, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (r *locationRepository) Create(ctx context.Context, location *entity.Location) error {
	return r.DB.WithContext(ctx).Create(location).Error
}

func (r *locationRepository) Update(ctx context.Context, location *entity.Location) error {
	return r.DB.WithContext(ctx).Save(location).Error
}

func (r *locationRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Location{}, "id = ?", id).Error
}

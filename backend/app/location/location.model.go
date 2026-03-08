package location

import (
	"hris_backend/entity"
	"time"
)

type LocationResponse struct {
	ID        string              `json:"id"`
	Name      string              `json:"name"`
	Type      entity.LocationType `json:"type"`
	Address   *string             `json:"address"`
	IsActive  bool                `json:"isActive"`
	CreatedAt time.Time           `json:"createdAt"`
}

type CreateLocationRequest struct {
	Name     string              `json:"name" validate:"required"`
	Type     entity.LocationType `json:"type" validate:"required,oneof=WAREHOUSE OUTLET"`
	Address  *string             `json:"address"`
	IsActive *bool               `json:"isActive"`
}

type UpdateLocationRequest struct {
	Name     *string              `json:"name"`
	Type     *entity.LocationType `json:"type" validate:"omitempty,oneof=WAREHOUSE OUTLET"`
	Address  *string              `json:"address"`
	IsActive *bool                `json:"isActive"`
}

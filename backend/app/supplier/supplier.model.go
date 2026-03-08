package supplier

import (
	"time"
)

type SupplierResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	ContactName *string   `json:"contactName"`
	Phone       *string   `json:"phone"`
	Email       *string   `json:"email"`
	Address     *string   `json:"address"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
}

type CreateSupplierRequest struct {
	Name        string  `json:"name" validate:"required"`
	ContactName *string `json:"contactName"`
	Phone       *string `json:"phone"`
	Email       *string `json:"email" validate:"omitempty,email"`
	Address     *string `json:"address"`
	IsActive    *bool   `json:"isActive"`
}

type UpdateSupplierRequest struct {
	Name        *string `json:"name"`
	ContactName *string `json:"contactName"`
	Phone       *string `json:"phone"`
	Email       *string `json:"email" validate:"omitempty,email"`
	Address     *string `json:"address"`
	IsActive    *bool   `json:"isActive"`
}

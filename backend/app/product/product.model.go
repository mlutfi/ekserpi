package product

type ProductResponse struct {
	ID         string  `json:"id"`
	CategoryID *string `json:"categoryId"`
	Category   *string `json:"category"`
	SKU        *string `json:"sku"`
	Barcode    *string `json:"barcode"`
	Name       string  `json:"name"`
	Price      int     `json:"price"`
	Cost       *int    `json:"cost"`
	ImageURL   *string `json:"imageUrl"`
	IsActive   bool    `json:"isActive"`
	QtyOnHand  int     `json:"qtyOnHand"`
}

type CreateProductRequest struct {
	CategoryID *string `json:"categoryId"`
	SKU        *string `json:"sku"`
	Barcode    *string `json:"barcode"`
	Name       string  `json:"name" validate:"required"`
	Price      int     `json:"price" validate:"required,gt=0"`
	Cost       *int    `json:"cost"`
	ImageURL   *string `json:"imageUrl"`
	IsActive   bool    `json:"isActive"`
	QtyOnHand  int     `json:"qtyOnHand"`
}

type UpdateProductRequest struct {
	CategoryID *string `json:"categoryId"`
	SKU        *string `json:"sku"`
	Barcode    *string `json:"barcode"`
	Name       string  `json:"name" validate:"required"`
	Price      int     `json:"price" validate:"required,gt=0"`
	Cost       *int    `json:"cost"`
	ImageURL   *string `json:"imageUrl"`
	IsActive   bool    `json:"isActive"`
}

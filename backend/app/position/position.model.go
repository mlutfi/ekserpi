package position

type PositionResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Level int    `json:"level"`
}

type CreatePositionRequest struct {
	Name  string `json:"name" validate:"required"`
	Level int    `json:"level" validate:"required"`
}

type UpdatePositionRequest struct {
	Name  string `json:"name" validate:"required"`
	Level int    `json:"level" validate:"required"`
}

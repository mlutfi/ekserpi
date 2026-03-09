package user

type UserResponse struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	Email              string   `json:"email"`
	Role               string   `json:"role"`
	Permissions        []string `json:"permissions,omitempty"`
	MustChangePassword bool     `json:"mustChangePassword"`
	TeamLeaderID       *string  `json:"teamLeaderId,omitempty"`
}

type CreateUserRequest struct {
	Name         string  `json:"name" validate:"required"`
	Email        string  `json:"email" validate:"required,email"`
	Password     string  `json:"password" validate:"required,min=6"`
	Role         string  `json:"role" validate:"required"`
	TeamLeaderID *string `json:"teamLeaderId"`
}

type UpdateUserRequest struct {
	Name         *string `json:"name,omitempty"`
	Email        *string `json:"email,omitempty"`
	Password     *string `json:"password,omitempty"`
	Role         *string `json:"role,omitempty"`
	TeamLeaderID *string `json:"teamLeaderId,omitempty"`
}

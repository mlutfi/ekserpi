package user

import (
	"context"
	"errors"

	"hris_backend/entity"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserUseCase interface {
	GetAll(ctx context.Context) ([]UserResponse, error)
	GetByID(ctx context.Context, id string) (*UserResponse, error)
	Create(ctx context.Context, request *CreateUserRequest) (*UserResponse, error)
	Update(ctx context.Context, id string, request *UpdateUserRequest) (*UserResponse, error)
	Delete(ctx context.Context, id string) error
}

type userUseCase struct {
	DB         *gorm.DB
	Repository UserRepository
}

func NewUserUseCase(db *gorm.DB, repository UserRepository) UserUseCase {
	return &userUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *userUseCase) GetAll(ctx context.Context) ([]UserResponse, error) {
	users, err := u.Repository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var responses []UserResponse
	for _, user := range users {
		responses = append(responses, *u.toResponse(&user))
	}
	return responses, nil
}

func (u *userUseCase) GetByID(ctx context.Context, id string) (*UserResponse, error) {
	user, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.toResponse(user), nil
}

func (u *userUseCase) Create(ctx context.Context, request *CreateUserRequest) (*UserResponse, error) {
	// Check if email already exists
	existing, _ := u.Repository.GetByEmail(ctx, request.Email)
	if existing != nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	passwordStr := string(hashedPassword)
	user := &entity.User{
		Name:               request.Name,
		Email:              request.Email,
		PasswordHash:       &passwordStr,
		Role:               entity.Role(request.Role),
		MustChangePassword: true,
		TeamLeaderID:       request.TeamLeaderID,
	}

	err = u.Repository.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	return u.toResponse(user), nil
}

func (u *userUseCase) Update(ctx context.Context, id string, request *UpdateUserRequest) (*UserResponse, error) {
	user, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if request.Name != nil {
		user.Name = *request.Name
	}
	if request.Email != nil {
		// Check if email already exists for another user
		existing, _ := u.Repository.GetByEmail(ctx, *request.Email)
		if existing != nil && existing.ID != id {
			return nil, errors.New("email already exists")
		}
		user.Email = *request.Email
	}
	if request.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*request.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		passwordStr := string(hashedPassword)
		user.PasswordHash = &passwordStr
		user.MustChangePassword = false
	}
	if request.Role != nil {
		user.Role = entity.Role(*request.Role)
	}
	if request.TeamLeaderID != nil {
		user.TeamLeaderID = request.TeamLeaderID
	}

	err = u.Repository.Update(ctx, user)
	if err != nil {
		return nil, err
	}

	return u.toResponse(user), nil
}

func (u *userUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return u.Repository.Delete(ctx, id)
}

func (u *userUseCase) toResponse(user *entity.User) *UserResponse {
	return &UserResponse{
		ID:                 user.ID,
		Name:               user.Name,
		Email:              user.Email,
		Role:               string(user.Role),
		MustChangePassword: user.MustChangePassword,
		TeamLeaderID:       user.TeamLeaderID,
	}
}

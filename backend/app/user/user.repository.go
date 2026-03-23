package user

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type UserRepository interface {
	GetAll(ctx context.Context) ([]entity.User, error)
	GetByID(ctx context.Context, id string) (*entity.User, error)
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	Create(ctx context.Context, user *entity.User) error
	Update(ctx context.Context, user *entity.User) error
	Delete(ctx context.Context, id string) error
}

type userRepository struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{DB: db}
}

func (r *userRepository) GetAll(ctx context.Context) ([]entity.User, error) {
	var users []entity.User
	err := r.DB.WithContext(ctx).Order("created_at DESC").Find(&users).Error
	return users, err
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*entity.User, error) {
	user := new(entity.User)
	err := r.DB.WithContext(ctx).First(user, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	user := new(entity.User)
	err := r.DB.WithContext(ctx).Where("email = ?", email).First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

func (r *userRepository) Create(ctx context.Context, user *entity.User) error {
	return r.DB.WithContext(ctx).Create(user).Error
}

func (r *userRepository) Update(ctx context.Context, user *entity.User) error {
	return r.DB.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.User{}, "id = ?", id).Error
}

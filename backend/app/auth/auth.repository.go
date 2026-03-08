package auth

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type AuthRepository interface {
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindByID(ctx context.Context, id string) (*entity.User, error)
	UpdatePassword(ctx context.Context, userId string, passwordHash string) error
	Update2FASecret(ctx context.Context, id string, secret string) error
	Set2FAEnabled(ctx context.Context, id string, enabled bool) error
}

type authRepository struct {
	DB *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{DB: db}
}

func (r *authRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
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

func (r *authRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	user := new(entity.User)
	err := r.DB.WithContext(ctx).Where("id = ?", id).First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

func (r *authRepository) UpdatePassword(ctx context.Context, userId string, passwordHash string) error {
	result := r.DB.WithContext(ctx).Model(&entity.User{}).Where("id = ?", userId).Update("password_hash", passwordHash)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *authRepository) Update2FASecret(ctx context.Context, id string, secret string) error {
	result := r.DB.WithContext(ctx).Model(&entity.User{}).Where("id = ?", id).Update("two_factor_secret", secret)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *authRepository) Set2FAEnabled(ctx context.Context, id string, enabled bool) error {
	result := r.DB.WithContext(ctx).Model(&entity.User{}).Where("id = ?", id).Update("two_factor_enabled", enabled)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

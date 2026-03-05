package auth

import (
	"context"
	"errors"
	"time"

	"hris_backend/entity"
	"hris_backend/middleware"

	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthUseCase interface {
	Login(ctx context.Context, request *LoginRequest) (*LoginResponse, error)
	GetMe(ctx context.Context, userId string) (*UserResponse, error)
	ChangePassword(ctx context.Context, userId string, request *ChangePasswordRequest) error
}

type authUseCase struct {
	DB         *gorm.DB
	Repository AuthRepository
	Config     *viper.Viper
}

func NewAuthUseCase(db *gorm.DB, repository AuthRepository, config *viper.Viper) AuthUseCase {
	return &authUseCase{
		DB:         db,
		Repository: repository,
		Config:     config,
	}
}

// isHRISRole checks if the role requires an employee profile
func isHRISRole(role string) bool {
	switch role {
	case string(entity.RoleOwner), string(entity.RoleHRAdmin), string(entity.RoleManager),
		string(entity.RoleTeamLeader), string(entity.RoleEmployee), string(entity.RoleStaff):
		return true
	}
	return false
}

func (u *authUseCase) Login(ctx context.Context, request *LoginRequest) (*LoginResponse, error) {
	user, err := u.Repository.FindByEmail(ctx, request.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if user.PasswordHash == nil {
		return nil, errors.New("user has no password set")
	}

	err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(request.Password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := u.generateToken(user)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	response := &LoginResponse{
		Token: token,
		User: UserResponse{
			ID:                 user.ID,
			Name:               user.Name,
			Email:              user.Email,
			Role:               string(user.Role),
			MustChangePassword: user.MustChangePassword,
		},
	}

	// Helper to convert *string to string
	ptrToStr := func(s *string) string {
		if s == nil {
			return ""
		}
		return *s
	}

	// HRIS Employee Response mapping
	if isHRISRole(string(user.Role)) {
		joinDateStr := ""
		if user.JoinDate != nil {
			joinDateStr = user.JoinDate.Format("2006-01-02")
		}

		response.Employee = &EmployeeResponse{
			ID:           user.ID,
			NIP:          ptrToStr(user.NIP),
			Name:         user.Name,
			Email:        user.Email,
			Phone:        user.Phone,
			DepartmentID: ptrToStr(user.DepartmentID),
			PositionID:   ptrToStr(user.PositionID),
			JoinDate:     joinDateStr,
			EmployeeType: string(user.EmployeeType),
			Status:       string(user.Status),
		}
	}

	return response, nil
}

func (u *authUseCase) GetMe(ctx context.Context, userId string) (*UserResponse, error) {
	user, err := u.Repository.FindByID(ctx, userId)
	if err != nil {
		return nil, err
	}

	return &UserResponse{
		ID:                 user.ID,
		Name:               user.Name,
		Email:              user.Email,
		Role:               string(user.Role),
		MustChangePassword: user.MustChangePassword,
	}, nil
}

func (u *authUseCase) ChangePassword(ctx context.Context, userId string, request *ChangePasswordRequest) error {
	user, err := u.Repository.FindByID(ctx, userId)
	if err != nil {
		return err
	}

	if user.PasswordHash == nil {
		return errors.New("user has no password set")
	}

	err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(request.CurrentPassword))
	if err != nil {
		return errors.New("current password is incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	return u.Repository.UpdatePassword(ctx, userId, string(hashedPassword))
}

func (u *authUseCase) generateToken(user *entity.User) (string, error) {
	secret := u.Config.GetString("jwt.secret")
	expiration := u.Config.GetInt("jwt.expiration")

	claims := &middleware.JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   string(user.Role),
		Name:   user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiration) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

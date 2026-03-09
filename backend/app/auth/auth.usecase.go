package auth

import (
	"context"
	"errors"
	"sort"
	"time"

	"hris_backend/entity"
	"hris_backend/middleware"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pquerna/otp/totp"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthUseCase interface {
	Login(ctx context.Context, request *LoginRequest) (*LoginResponse, error)
	Verify2FALogin(ctx context.Context, request *Verify2FALoginRequest) (*LoginResponse, error)
	GetMe(ctx context.Context, userId string) (*UserResponse, error)
	ChangePassword(ctx context.Context, userId string, request *ChangePasswordRequest) error
	Generate2FASetup(ctx context.Context, userId string) (*Setup2FAResponse, error)
	Enable2FA(ctx context.Context, userId string, request *Verify2FARequest) error
	Disable2FA(ctx context.Context, userId string) error
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

	permissions, err := u.getPermissionsByRole(ctx, user.Role)
	if err != nil {
		return nil, errors.New("failed to load role permissions")
	}

	if user.TwoFactorEnabled {
		token, err := u.generateToken(user, permissions, true)
		if err != nil {
			return nil, errors.New("failed to generate 2fa token")
		}
		return &LoginResponse{
			TwoFactorRequired: true,
			TwoFactorToken:    token,
			User: UserResponse{
				ID:                 user.ID,
				Name:               user.Name,
				Email:              user.Email,
				Role:               string(user.Role),
				Permissions:        permissions,
				MustChangePassword: user.MustChangePassword,
				TwoFactorEnabled:   user.TwoFactorEnabled,
			},
		}, nil
	}

	token, err := u.generateToken(user, permissions, false)
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
			Permissions:        permissions,
			MustChangePassword: user.MustChangePassword,
			TwoFactorEnabled:   user.TwoFactorEnabled,
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
			EmployeeType: string(entity.NormalizeEmployeeType(string(user.EmployeeType))),
			Status:       string(user.Status),
		}
	}

	return response, nil
}

func (u *authUseCase) Verify2FALogin(ctx context.Context, request *Verify2FALoginRequest) (*LoginResponse, error) {
	secret := u.Config.GetString("jwt.secret")
	token, err := jwt.ParseWithClaims(request.TwoFactorToken, &middleware.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired 2fa token")
	}

	claims, ok := token.Claims.(*middleware.JWTClaims)
	if !ok || !claims.Is2FAPending {
		return nil, errors.New("invalid token claims")
	}

	user, err := u.Repository.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if !totp.Validate(request.Code, user.TwoFactorSecret) {
		return nil, errors.New("invalid 2fa code")
	}

	permissions, err := u.getPermissionsByRole(ctx, user.Role)
	if err != nil {
		return nil, errors.New("failed to load role permissions")
	}

	newToken, err := u.generateToken(user, permissions, false)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &LoginResponse{
		Token: newToken,
		User: UserResponse{
			ID:                 user.ID,
			Name:               user.Name,
			Email:              user.Email,
			Role:               string(user.Role),
			Permissions:        permissions,
			MustChangePassword: user.MustChangePassword,
			TwoFactorEnabled:   user.TwoFactorEnabled,
		},
	}, nil
}

func (u *authUseCase) Generate2FASetup(ctx context.Context, userId string) (*Setup2FAResponse, error) {
	user, err := u.Repository.FindByID(ctx, userId)
	if err != nil {
		return nil, err
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "XRP System",
		AccountName: user.Email,
	})
	if err != nil {
		return nil, err
	}

	// Store secret temporarily or just return to user to store when enabling
	// Actually we should store it and mark as disabled
	err = u.Repository.Update2FASecret(ctx, userId, key.Secret())
	if err != nil {
		return nil, err
	}

	return &Setup2FAResponse{
		Secret: key.Secret(),
		QRURL:  key.URL(),
	}, nil
}

func (u *authUseCase) Enable2FA(ctx context.Context, userId string, request *Verify2FARequest) error {
	user, err := u.Repository.FindByID(ctx, userId)
	if err != nil {
		return err
	}

	if user.TwoFactorSecret == "" {
		return errors.New("2fa setup not initiated")
	}

	if !totp.Validate(request.Code, user.TwoFactorSecret) {
		return errors.New("invalid verification code")
	}

	return u.Repository.Set2FAEnabled(ctx, userId, true)
}

func (u *authUseCase) Disable2FA(ctx context.Context, userId string) error {
	return u.Repository.Set2FAEnabled(ctx, userId, false)
}

func (u *authUseCase) GetMe(ctx context.Context, userId string) (*UserResponse, error) {
	user, err := u.Repository.FindByID(ctx, userId)
	if err != nil {
		return nil, err
	}

	permissions, err := u.getPermissionsByRole(ctx, user.Role)
	if err != nil {
		return nil, errors.New("failed to load role permissions")
	}

	return &UserResponse{
		ID:                 user.ID,
		Name:               user.Name,
		Email:              user.Email,
		Role:               string(user.Role),
		Permissions:        permissions,
		MustChangePassword: user.MustChangePassword,
		TwoFactorEnabled:   user.TwoFactorEnabled,
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

func (u *authUseCase) generateToken(user *entity.User, permissions []string, is2faPending bool) (string, error) {
	secret := u.Config.GetString("jwt.secret")
	expiration := u.Config.GetInt("jwt.expiration")

	if is2faPending {
		expiration = 1 // 1 hour for 2fa pending token
	}

	claims := &middleware.JWTClaims{
		UserID:       user.ID,
		Email:        user.Email,
		Role:         string(user.Role),
		Name:         user.Name,
		Permissions:  permissions,
		Is2FAPending: is2faPending,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiration) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (u *authUseCase) getPermissionsByRole(ctx context.Context, role entity.Role) ([]string, error) {
	var rolePermissions []entity.RolePermission
	err := u.DB.WithContext(ctx).
		Where("role = ? AND is_allowed = ?", role, true).
		Find(&rolePermissions).Error
	if err != nil {
		return nil, err
	}

	if len(rolePermissions) == 0 {
		permissions := entity.DefaultPermissionCodesByRole(role)
		sort.Strings(permissions)
		return permissions, nil
	}

	permissionSet := map[string]struct{}{}
	for _, permission := range rolePermissions {
		code := entity.PermissionCode(permission.Resource, permission.Action)
		permissionSet[code] = struct{}{}
	}

	permissions := make([]string, 0, len(permissionSet))
	for code := range permissionSet {
		permissions = append(permissions, code)
	}
	sort.Strings(permissions)
	return permissions, nil
}

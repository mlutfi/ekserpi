package user

import (
	"context"
	"errors"
	"sort"

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

	permissionByRole, err := u.getPermissionsByRoles(ctx, users)
	if err != nil {
		return nil, err
	}

	var responses []UserResponse
	for _, user := range users {
		responses = append(responses, *u.toResponse(&user, permissionByRole[string(user.Role)]))
	}
	return responses, nil
}

func (u *userUseCase) GetByID(ctx context.Context, id string) (*UserResponse, error) {
	user, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	permissions, err := u.getPermissionsForRole(ctx, user.Role)
	if err != nil {
		return nil, err
	}
	return u.toResponse(user, permissions), nil
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

	normalizedRole := entity.NormalizeRole(request.Role)
	if !entity.IsValidRole(string(normalizedRole)) {
		return nil, errors.New("invalid role")
	}

	passwordStr := string(hashedPassword)
	user := &entity.User{
		Name:               request.Name,
		Email:              request.Email,
		PasswordHash:       &passwordStr,
		Role:               normalizedRole,
		MustChangePassword: true,
		TeamLeaderID:       request.TeamLeaderID,
	}

	err = u.Repository.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	permissions, err := u.getPermissionsForRole(ctx, user.Role)
	if err != nil {
		return nil, err
	}

	return u.toResponse(user, permissions), nil
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
		normalizedRole := entity.NormalizeRole(*request.Role)
		if !entity.IsValidRole(string(normalizedRole)) {
			return nil, errors.New("invalid role")
		}
		user.Role = normalizedRole
	}
	if request.TeamLeaderID != nil {
		user.TeamLeaderID = request.TeamLeaderID
	}

	err = u.Repository.Update(ctx, user)
	if err != nil {
		return nil, err
	}

	permissions, err := u.getPermissionsForRole(ctx, user.Role)
	if err != nil {
		return nil, err
	}

	return u.toResponse(user, permissions), nil
}

func (u *userUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return u.Repository.Delete(ctx, id)
}

func (u *userUseCase) toResponse(user *entity.User, permissions []string) *UserResponse {
	return &UserResponse{
		ID:                 user.ID,
		Name:               user.Name,
		Email:              user.Email,
		Role:               string(user.Role),
		Permissions:        permissions,
		MustChangePassword: user.MustChangePassword,
		TeamLeaderID:       user.TeamLeaderID,
	}
}

func (u *userUseCase) getPermissionsForRole(ctx context.Context, role entity.Role) ([]string, error) {
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

	set := map[string]struct{}{}
	for _, permission := range rolePermissions {
		set[entity.PermissionCode(permission.Resource, permission.Action)] = struct{}{}
	}

	permissions := make([]string, 0, len(set))
	for permission := range set {
		permissions = append(permissions, permission)
	}
	sort.Strings(permissions)
	return permissions, nil
}

func (u *userUseCase) getPermissionsByRoles(ctx context.Context, users []entity.User) (map[string][]string, error) {
	roleSet := map[entity.Role]struct{}{}
	for _, user := range users {
		roleSet[user.Role] = struct{}{}
	}

	out := map[string][]string{}
	for role := range roleSet {
		permissions, err := u.getPermissionsForRole(ctx, role)
		if err != nil {
			return nil, err
		}
		out[string(role)] = permissions
	}
	return out, nil
}

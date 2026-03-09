package role

import (
	"context"
	"errors"
	"strings"

	"hris_backend/entity"
)

type RoleUseCase interface {
	GetAll(ctx context.Context) ([]RoleSummaryResponse, error)
	GetPermissions(ctx context.Context, role string) (*RolePermissionsResponse, error)
	UpdatePermissions(ctx context.Context, role string, request *UpdateRolePermissionsRequest) (*RolePermissionsResponse, error)
}

type roleUseCase struct {
	Repository RoleRepository
}

func NewRoleUseCase(repository RoleRepository) RoleUseCase {
	return &roleUseCase{
		Repository: repository,
	}
}

func (u *roleUseCase) GetAll(ctx context.Context) ([]RoleSummaryResponse, error) {
	if err := u.Repository.EnsureDefaultPermissions(ctx); err != nil {
		return nil, err
	}

	userCountByRole, err := u.Repository.CountUsersByRole(ctx)
	if err != nil {
		return nil, err
	}

	roles := entity.AllRoles()
	responses := make([]RoleSummaryResponse, 0, len(roles))
	for _, role := range roles {
		responses = append(responses, RoleSummaryResponse{
			Role:      string(role),
			Label:     entity.RoleLabel(role),
			UserCount: userCountByRole[string(role)],
		})
	}
	return responses, nil
}

func (u *roleUseCase) GetPermissions(ctx context.Context, role string) (*RolePermissionsResponse, error) {
	normalizedRole := entity.NormalizeRole(role)
	if !entity.IsValidRole(string(normalizedRole)) {
		return nil, errors.New("invalid role")
	}

	if err := u.Repository.EnsureDefaultPermissions(ctx); err != nil {
		return nil, err
	}

	permissions, err := u.Repository.GetPermissionsByRole(ctx, normalizedRole)
	if err != nil {
		return nil, err
	}

	return &RolePermissionsResponse{
		Role:        string(normalizedRole),
		Label:       entity.RoleLabel(normalizedRole),
		Permissions: toPermissionResponses(permissions),
	}, nil
}

func (u *roleUseCase) UpdatePermissions(ctx context.Context, role string, request *UpdateRolePermissionsRequest) (*RolePermissionsResponse, error) {
	normalizedRole := entity.NormalizeRole(role)
	if !entity.IsValidRole(string(normalizedRole)) {
		return nil, errors.New("invalid role")
	}

	if request == nil || len(request.Permissions) == 0 {
		return nil, errors.New("permissions is required")
	}

	if err := u.Repository.EnsureDefaultPermissions(ctx); err != nil {
		return nil, err
	}

	catalogByCode := map[string]entity.PermissionDefinition{}
	for _, item := range entity.PermissionCatalog {
		catalogByCode[entity.PermissionCode(item.Resource, item.Action)] = item
	}

	updates := make([]entity.RolePermission, 0, len(request.Permissions))
	for _, item := range request.Permissions {
		resource := strings.ToLower(strings.TrimSpace(item.Resource))
		action := strings.ToLower(strings.TrimSpace(item.Action))
		if resource == "" || action == "" {
			return nil, errors.New("resource and action are required")
		}

		code := entity.PermissionCode(resource, action)
		definition, exists := catalogByCode[code]
		if !exists {
			return nil, errors.New("invalid permission code: " + code)
		}

		description := strings.TrimSpace(item.Description)
		if description == "" {
			description = definition.Description
		}

		updates = append(updates, entity.RolePermission{
			Role:        normalizedRole,
			Resource:    resource,
			Action:      action,
			IsAllowed:   item.IsAllowed,
			Description: description,
		})
	}

	if err := u.Repository.SavePermissions(ctx, updates); err != nil {
		return nil, err
	}

	return u.GetPermissions(ctx, string(normalizedRole))
}

func toPermissionResponses(items []entity.RolePermission) []RolePermissionResponse {
	responses := make([]RolePermissionResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, RolePermissionResponse{
			ID:          item.ID,
			Resource:    item.Resource,
			Action:      item.Action,
			Code:        entity.PermissionCode(item.Resource, item.Action),
			IsAllowed:   item.IsAllowed,
			Description: item.Description,
		})
	}
	return responses
}

package role

import (
	"context"

	"hris_backend/entity"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RoleRepository interface {
	CountUsersByRole(ctx context.Context) (map[string]int64, error)
	GetPermissionsByRole(ctx context.Context, role entity.Role) ([]entity.RolePermission, error)
	SavePermissions(ctx context.Context, permissions []entity.RolePermission) error
	EnsureDefaultPermissions(ctx context.Context) error
}

type roleRepository struct {
	DB *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{DB: db}
}

func (r *roleRepository) CountUsersByRole(ctx context.Context) (map[string]int64, error) {
	type result struct {
		Role  string
		Count int64
	}
	var rows []result
	err := r.DB.WithContext(ctx).
		Table("users").
		Select("role, COUNT(*) as count").
		Group("role").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	out := map[string]int64{}
	for _, row := range rows {
		out[row.Role] = row.Count
	}
	return out, nil
}

func (r *roleRepository) GetPermissionsByRole(ctx context.Context, role entity.Role) ([]entity.RolePermission, error) {
	var permissions []entity.RolePermission
	err := r.DB.WithContext(ctx).
		Where("role = ?", role).
		Order("resource asc, action asc").
		Find(&permissions).Error
	return permissions, err
}

func (r *roleRepository) SavePermissions(ctx context.Context, permissions []entity.RolePermission) error {
	if len(permissions) == 0 {
		return nil
	}
	return r.DB.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{
				{Name: "role"},
				{Name: "resource"},
				{Name: "action"},
			},
			DoUpdates: clause.AssignmentColumns([]string{"is_allowed", "description", "updated_at"}),
		}).
		Create(&permissions).Error
}

func (r *roleRepository) EnsureDefaultPermissions(ctx context.Context) error {
	defaultPermissions := entity.BuildDefaultRolePermissions()
	if len(defaultPermissions) == 0 {
		return nil
	}

	return r.DB.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{
				{Name: "role"},
				{Name: "resource"},
				{Name: "action"},
			},
			DoUpdates: clause.AssignmentColumns([]string{"description", "updated_at"}),
		}).
		Create(&defaultPermissions).Error
}

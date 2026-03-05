package employee

import (
	"context"
	"errors"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type EmployeeRepository interface {
	GetAll(ctx context.Context, page, limit int) ([]entity.User, int64, error)
	GetByID(ctx context.Context, id string) (*entity.User, error)
	GetByNIP(ctx context.Context, nip string) (*entity.User, error)
	GetByUserID(ctx context.Context, userID string) (*entity.User, error)
	GetByDepartment(ctx context.Context, deptID string) ([]entity.User, error)
	GetByManager(ctx context.Context, managerID string) ([]entity.User, error)
	GetByTeamLeader(ctx context.Context, teamLeaderID string) ([]entity.User, error)
	GetByRole(ctx context.Context, role string) ([]entity.User, error)
	Create(ctx context.Context, employee *entity.User) error
	Update(ctx context.Context, employee *entity.User) error
	Delete(ctx context.Context, id string) error
}

type employeeRepository struct {
	DB *gorm.DB
}

func NewEmployeeRepository(db *gorm.DB) EmployeeRepository {
	return &employeeRepository{DB: db}
}

func (r *employeeRepository) GetAll(ctx context.Context, page, limit int) ([]entity.User, int64, error) {
	var employees []entity.User
	var total int64

	offset := (page - 1) * limit

	err := r.DB.WithContext(ctx).Model(&entity.User{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = r.DB.WithContext(ctx).
		Preload("Department").
		Preload("Position").
		Preload("Manager").
		Offset(offset).
		Limit(limit).
		Find(&employees).Error

	return employees, total, err
}

func (r *employeeRepository) GetByID(ctx context.Context, id string) (*entity.User, error) {
	employee := new(entity.User)
	err := r.DB.WithContext(ctx).
		Preload("Department").
		Preload("Position").
		Preload("Manager").
		First(employee, "id = ?", id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("employee not found")
		}
		return nil, err
	}
	return employee, nil
}

func (r *employeeRepository) GetByNIP(ctx context.Context, nip string) (*entity.User, error) {
	employee := new(entity.User)
	err := r.DB.WithContext(ctx).Where("nip = ?", nip).First(employee).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("employee not found")
		}
		return nil, err
	}
	return employee, nil
}

func (r *employeeRepository) GetByUserID(ctx context.Context, userID string) (*entity.User, error) {
	return r.GetByID(ctx, userID)
}

func (r *employeeRepository) GetByDepartment(ctx context.Context, deptID string) ([]entity.User, error) {
	var employees []entity.User
	err := r.DB.WithContext(ctx).
		Preload("Position").
		Where("department_id = ?", deptID).
		Find(&employees).Error
	return employees, err
}

func (r *employeeRepository) GetByManager(ctx context.Context, managerID string) ([]entity.User, error) {
	var employees []entity.User
	err := r.DB.WithContext(ctx).
		Preload("Position").
		Where("manager_id = ?", managerID).
		Find(&employees).Error
	return employees, err
}

func (r *employeeRepository) GetByTeamLeader(ctx context.Context, teamLeaderID string) ([]entity.User, error) {
	var employees []entity.User
	err := r.DB.WithContext(ctx).
		Preload("Position").
		Where("team_leader_id = ?", teamLeaderID).
		Find(&employees).Error
	return employees, err
}

func (r *employeeRepository) GetByRole(ctx context.Context, role string) ([]entity.User, error) {
	var employees []entity.User

	err := r.DB.WithContext(ctx).
		Where("role = ?", role).
		Preload("Department").
		Preload("Position").
		Find(&employees).Error
	return employees, err
}

func (r *employeeRepository) Create(ctx context.Context, employee *entity.User) error {
	return r.DB.WithContext(ctx).Create(employee).Error
}

func (r *employeeRepository) Update(ctx context.Context, employee *entity.User) error {
	return r.DB.WithContext(ctx).Save(employee).Error
}

func (r *employeeRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.User{}, "id = ?", id).Error
}

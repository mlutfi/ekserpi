package department

import (
	"context"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type DepartmentUseCase interface {
	GetAll(ctx context.Context) ([]DepartmentResponse, error)
	GetByID(ctx context.Context, id string) (*DepartmentResponse, error)
	Create(ctx context.Context, request *CreateDepartmentRequest) (*DepartmentResponse, error)
	Update(ctx context.Context, id string, request *UpdateDepartmentRequest) (*DepartmentResponse, error)
	Delete(ctx context.Context, id string) error
}

type departmentUseCase struct {
	DB         *gorm.DB
	Repository DepartmentRepository
}

func NewDepartmentUseCase(db *gorm.DB, repository DepartmentRepository) DepartmentUseCase {
	return &departmentUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *departmentUseCase) GetAll(ctx context.Context) ([]DepartmentResponse, error) {
	departments, err := u.Repository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var responses []DepartmentResponse
	for _, d := range departments {
		responses = append(responses, DepartmentResponse{
			ID:          d.ID,
			Name:        d.Name,
			Description: d.Description,
		})
	}
	return responses, nil
}

func (u *departmentUseCase) GetByID(ctx context.Context, id string) (*DepartmentResponse, error) {
	department, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &DepartmentResponse{
		ID:          department.ID,
		Name:        department.Name,
		Description: department.Description,
	}, nil
}

func (u *departmentUseCase) Create(ctx context.Context, request *CreateDepartmentRequest) (*DepartmentResponse, error) {
	department := &entity.Department{
		Name:        request.Name,
		Description: request.Description,
	}

	err := u.Repository.Create(ctx, department)
	if err != nil {
		return nil, err
	}

	return &DepartmentResponse{
		ID:          department.ID,
		Name:        department.Name,
		Description: department.Description,
	}, nil
}

func (u *departmentUseCase) Update(ctx context.Context, id string, request *UpdateDepartmentRequest) (*DepartmentResponse, error) {
	department, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	department.Name = request.Name
	department.Description = request.Description

	err = u.Repository.Update(ctx, department)
	if err != nil {
		return nil, err
	}

	return &DepartmentResponse{
		ID:          department.ID,
		Name:        department.Name,
		Description: department.Description,
	}, nil
}

func (u *departmentUseCase) Delete(ctx context.Context, id string) error {
	_, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return u.Repository.Delete(ctx, id)
}

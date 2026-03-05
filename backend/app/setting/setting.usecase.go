package setting

import (
	"context"

	"hris_backend/entity"
)

type SettingUseCase interface {
	GetByKey(ctx context.Context, key string) (*SettingResponse, error)
	Upsert(ctx context.Context, key string, request *UpdateSettingRequest) (*SettingResponse, error)
}

type settingUseCase struct {
	Repository SettingRepository
}

func NewSettingUseCase(repository SettingRepository) SettingUseCase {
	return &settingUseCase{Repository: repository}
}

func (u *settingUseCase) GetByKey(ctx context.Context, key string) (*SettingResponse, error) {
	setting, err := u.Repository.GetByKey(ctx, key)
	if err != nil {
		return nil, err
	}
	if setting == nil {
		return &SettingResponse{Key: key, Value: ""}, nil
	}
	return u.toResponse(setting), nil
}

func (u *settingUseCase) Upsert(ctx context.Context, key string, request *UpdateSettingRequest) (*SettingResponse, error) {
	setting := &entity.Setting{
		Key:   key,
		Value: request.Value,
	}

	err := u.Repository.Upsert(ctx, setting)
	if err != nil {
		return nil, err
	}

	return u.toResponse(setting), nil
}

func (u *settingUseCase) toResponse(setting *entity.Setting) *SettingResponse {
	return &SettingResponse{
		ID:    setting.ID,
		Key:   setting.Key,
		Value: setting.Value,
	}
}

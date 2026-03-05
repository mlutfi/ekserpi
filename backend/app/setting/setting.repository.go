package setting

import (
	"context"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type SettingRepository interface {
	GetByKey(ctx context.Context, key string) (*entity.Setting, error)
	Upsert(ctx context.Context, setting *entity.Setting) error
}

type settingRepository struct {
	DB *gorm.DB
}

func NewSettingRepository(db *gorm.DB) SettingRepository {
	return &settingRepository{DB: db}
}

func (r *settingRepository) GetByKey(ctx context.Context, key string) (*entity.Setting, error) {
	var setting entity.Setting
	err := r.DB.WithContext(ctx).Where("key = ?", key).First(&setting).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // Return nil if setting doesn't exist yet
		}
		return nil, err
	}
	return &setting, nil
}

func (r *settingRepository) Upsert(ctx context.Context, setting *entity.Setting) error {
	var count int64
	r.DB.WithContext(ctx).Model(&entity.Setting{}).Where("key = ?", setting.Key).Count(&count)

	if count > 0 {
		return r.DB.WithContext(ctx).Model(&entity.Setting{}).Where("key = ?", setting.Key).Updates(map[string]interface{}{"value": setting.Value}).Error
	}
	return r.DB.WithContext(ctx).Create(setting).Error
}

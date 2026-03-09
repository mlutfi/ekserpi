package asset

import (
	"context"
	"hris_backend/entity"

	"gorm.io/gorm"
)

type AssetRepository interface {
	FindAllAssets(ctx context.Context) ([]entity.Asset, error)
	FindAssetByID(ctx context.Context, id string) (*entity.Asset, error)
	CreateAsset(ctx context.Context, asset *entity.Asset) error
	UpdateAsset(ctx context.Context, asset *entity.Asset) error
	DeleteAsset(ctx context.Context, id string) error

	FindAllAssignments(ctx context.Context) ([]entity.AssetAssignment, error)
	FindAssignmentByID(ctx context.Context, id string) (*entity.AssetAssignment, error)
	FindActiveAssignmentByAssetID(ctx context.Context, assetID string) (*entity.AssetAssignment, error)
	CreateAssignment(ctx context.Context, assignment *entity.AssetAssignment) error
	UpdateAssignment(ctx context.Context, assignment *entity.AssetAssignment) error
	DeleteAssignment(ctx context.Context, id string) error

	FindAllMaintenances(ctx context.Context) ([]entity.AssetMaintenance, error)
	FindMaintenanceByID(ctx context.Context, id string) (*entity.AssetMaintenance, error)
	CreateMaintenance(ctx context.Context, maintenance *entity.AssetMaintenance) error
	UpdateMaintenance(ctx context.Context, maintenance *entity.AssetMaintenance) error
	DeleteMaintenance(ctx context.Context, id string) error

	FindAllDepreciations(ctx context.Context, period string) ([]entity.AssetDepreciation, error)
	FindDepreciationByID(ctx context.Context, id string) (*entity.AssetDepreciation, error)
	FindDepreciationByAssetAndPeriod(ctx context.Context, assetID string, period string) (*entity.AssetDepreciation, error)
	FindLatestDepreciationBefore(ctx context.Context, assetID string, period string) (*entity.AssetDepreciation, error)
	CreateDepreciation(ctx context.Context, depreciation *entity.AssetDepreciation) error
	UpdateDepreciation(ctx context.Context, depreciation *entity.AssetDepreciation) error
}

type assetRepository struct {
	DB *gorm.DB
}

func NewAssetRepository(db *gorm.DB) AssetRepository {
	return &assetRepository{DB: db}
}

func (r *assetRepository) FindAllAssets(ctx context.Context) ([]entity.Asset, error) {
	var assets []entity.Asset
	err := r.DB.WithContext(ctx).
		Preload("Location").
		Preload("CreatedBy").
		Order("created_at DESC").
		Find(&assets).Error
	return assets, err
}

func (r *assetRepository) FindAssetByID(ctx context.Context, id string) (*entity.Asset, error) {
	var asset entity.Asset
	err := r.DB.WithContext(ctx).
		Preload("Location").
		Preload("CreatedBy").
		First(&asset, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *assetRepository) CreateAsset(ctx context.Context, asset *entity.Asset) error {
	return r.DB.WithContext(ctx).Create(asset).Error
}

func (r *assetRepository) UpdateAsset(ctx context.Context, asset *entity.Asset) error {
	return r.DB.WithContext(ctx).Save(asset).Error
}

func (r *assetRepository) DeleteAsset(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Asset{}, "id = ?", id).Error
}

func (r *assetRepository) FindAllAssignments(ctx context.Context) ([]entity.AssetAssignment, error) {
	var assignments []entity.AssetAssignment
	err := r.DB.WithContext(ctx).
		Preload("Asset").
		Preload("CreatedBy").
		Order("assigned_at DESC").
		Find(&assignments).Error
	return assignments, err
}

func (r *assetRepository) FindAssignmentByID(ctx context.Context, id string) (*entity.AssetAssignment, error) {
	var assignment entity.AssetAssignment
	err := r.DB.WithContext(ctx).
		Preload("Asset").
		Preload("CreatedBy").
		First(&assignment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (r *assetRepository) FindActiveAssignmentByAssetID(ctx context.Context, assetID string) (*entity.AssetAssignment, error) {
	var assignment entity.AssetAssignment
	err := r.DB.WithContext(ctx).
		Where("asset_id = ? AND status = ?", assetID, entity.AssetAssignmentStatusActive).
		Order("assigned_at DESC").
		First(&assignment).Error
	if err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (r *assetRepository) CreateAssignment(ctx context.Context, assignment *entity.AssetAssignment) error {
	return r.DB.WithContext(ctx).Create(assignment).Error
}

func (r *assetRepository) UpdateAssignment(ctx context.Context, assignment *entity.AssetAssignment) error {
	return r.DB.WithContext(ctx).Save(assignment).Error
}

func (r *assetRepository) DeleteAssignment(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.AssetAssignment{}, "id = ?", id).Error
}

func (r *assetRepository) FindAllMaintenances(ctx context.Context) ([]entity.AssetMaintenance, error) {
	var maintenances []entity.AssetMaintenance
	err := r.DB.WithContext(ctx).
		Preload("Asset").
		Preload("CreatedBy").
		Order("maintenance_date DESC").
		Find(&maintenances).Error
	return maintenances, err
}

func (r *assetRepository) FindMaintenanceByID(ctx context.Context, id string) (*entity.AssetMaintenance, error) {
	var maintenance entity.AssetMaintenance
	err := r.DB.WithContext(ctx).
		Preload("Asset").
		Preload("CreatedBy").
		First(&maintenance, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &maintenance, nil
}

func (r *assetRepository) CreateMaintenance(ctx context.Context, maintenance *entity.AssetMaintenance) error {
	return r.DB.WithContext(ctx).Create(maintenance).Error
}

func (r *assetRepository) UpdateMaintenance(ctx context.Context, maintenance *entity.AssetMaintenance) error {
	return r.DB.WithContext(ctx).Save(maintenance).Error
}

func (r *assetRepository) DeleteMaintenance(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.AssetMaintenance{}, "id = ?", id).Error
}

func (r *assetRepository) FindAllDepreciations(ctx context.Context, period string) ([]entity.AssetDepreciation, error) {
	var depreciations []entity.AssetDepreciation
	query := r.DB.WithContext(ctx).
		Preload("Asset").
		Preload("CreatedBy")

	if period != "" {
		query = query.Where("period = ?", period)
	}

	err := query.Order("period DESC, created_at DESC").Find(&depreciations).Error
	return depreciations, err
}

func (r *assetRepository) FindDepreciationByID(ctx context.Context, id string) (*entity.AssetDepreciation, error) {
	var depreciation entity.AssetDepreciation
	err := r.DB.WithContext(ctx).
		Preload("Asset").
		Preload("CreatedBy").
		First(&depreciation, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &depreciation, nil
}

func (r *assetRepository) FindDepreciationByAssetAndPeriod(ctx context.Context, assetID string, period string) (*entity.AssetDepreciation, error) {
	var depreciation entity.AssetDepreciation
	err := r.DB.WithContext(ctx).
		Where("asset_id = ? AND period = ?", assetID, period).
		First(&depreciation).Error
	if err != nil {
		return nil, err
	}
	return &depreciation, nil
}

func (r *assetRepository) FindLatestDepreciationBefore(ctx context.Context, assetID string, period string) (*entity.AssetDepreciation, error) {
	var depreciation entity.AssetDepreciation
	err := r.DB.WithContext(ctx).
		Where("asset_id = ? AND period < ?", assetID, period).
		Order("period DESC").
		First(&depreciation).Error
	if err != nil {
		return nil, err
	}
	return &depreciation, nil
}

func (r *assetRepository) CreateDepreciation(ctx context.Context, depreciation *entity.AssetDepreciation) error {
	return r.DB.WithContext(ctx).Create(depreciation).Error
}

func (r *assetRepository) UpdateDepreciation(ctx context.Context, depreciation *entity.AssetDepreciation) error {
	return r.DB.WithContext(ctx).Save(depreciation).Error
}

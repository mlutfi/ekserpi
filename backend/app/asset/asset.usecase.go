package asset

import (
	"context"
	"errors"
	"hris_backend/entity"
	"strings"
	"time"

	"gorm.io/gorm"
)

type AssetUseCase interface {
	FindAllAssets(ctx context.Context) ([]AssetResponse, error)
	FindAssetByID(ctx context.Context, id string) (*AssetResponse, error)
	CreateAsset(ctx context.Context, req *CreateAssetRequest, userID string) (*AssetResponse, error)
	UpdateAsset(ctx context.Context, id string, req *UpdateAssetRequest) (*AssetResponse, error)
	DeleteAsset(ctx context.Context, id string) error

	FindAllAssignments(ctx context.Context) ([]AssetAssignmentResponse, error)
	CreateAssignment(ctx context.Context, req *CreateAssignmentRequest, userID string) (*AssetAssignmentResponse, error)
	ReturnAssignment(ctx context.Context, id string, req *ReturnAssignmentRequest) (*AssetAssignmentResponse, error)
	DeleteAssignment(ctx context.Context, id string) error

	FindAllMaintenances(ctx context.Context) ([]AssetMaintenanceResponse, error)
	CreateMaintenance(ctx context.Context, req *CreateMaintenanceRequest, userID string) (*AssetMaintenanceResponse, error)
	UpdateMaintenanceStatus(ctx context.Context, id string, req *UpdateMaintenanceStatusRequest) (*AssetMaintenanceResponse, error)
	DeleteMaintenance(ctx context.Context, id string) error

	FindAllDepreciations(ctx context.Context, period string) ([]AssetDepreciationResponse, error)
	GenerateDepreciations(ctx context.Context, req *GenerateDepreciationRequest, userID string) ([]AssetDepreciationResponse, error)
	UpdateDepreciationStatus(ctx context.Context, id string, req *PostDepreciationRequest) (*AssetDepreciationResponse, error)
}

type assetUseCase struct {
	DB   *gorm.DB
	Repo AssetRepository
}

func NewAssetUseCase(db *gorm.DB, repo AssetRepository) AssetUseCase {
	return &assetUseCase{DB: db, Repo: repo}
}

func (u *assetUseCase) toAssetResponse(asset *entity.Asset, currentValue int) AssetResponse {
	locationName := ""
	if asset.Location != nil {
		locationName = asset.Location.Name
	}
	createdByName := ""
	if asset.CreatedBy != nil {
		createdByName = asset.CreatedBy.Name
	}

	return AssetResponse{
		ID:                 asset.ID,
		AssetCode:          asset.AssetCode,
		Name:               asset.Name,
		Category:           asset.Category,
		PurchaseDate:       asset.PurchaseDate,
		AcquisitionCost:    asset.AcquisitionCost,
		ResidualValue:      asset.ResidualValue,
		UsefulLifeMonths:   asset.UsefulLifeMonths,
		DepreciationMethod: string(asset.DepreciationMethod),
		Status:             asset.Status,
		LocationID:         asset.LocationID,
		LocationName:       locationName,
		Note:               asset.Note,
		CreatedByID:        asset.CreatedByID,
		CreatedByName:      createdByName,
		CreatedAt:          asset.CreatedAt,
		CurrentBookValue:   currentValue,
	}
}

func (u *assetUseCase) currentBookValue(ctx context.Context, asset *entity.Asset) int {
	lastDep, err := u.Repo.FindLatestDepreciationBefore(ctx, asset.ID, "9999-12")
	if err != nil {
		return asset.AcquisitionCost
	}
	return lastDep.ClosingBookValue
}

func (u *assetUseCase) FindAllAssets(ctx context.Context) ([]AssetResponse, error) {
	assets, err := u.Repo.FindAllAssets(ctx)
	if err != nil {
		return nil, err
	}

	var responses []AssetResponse
	for _, asset := range assets {
		bookValue := u.currentBookValue(ctx, &asset)
		responses = append(responses, u.toAssetResponse(&asset, bookValue))
	}
	return responses, nil
}

func (u *assetUseCase) FindAssetByID(ctx context.Context, id string) (*AssetResponse, error) {
	asset, err := u.Repo.FindAssetByID(ctx, id)
	if err != nil {
		return nil, errors.New("asset not found")
	}
	res := u.toAssetResponse(asset, u.currentBookValue(ctx, asset))
	return &res, nil
}

func parseDate(date string) (time.Time, error) {
	return time.Parse("2006-01-02", date)
}

func (u *assetUseCase) CreateAsset(ctx context.Context, req *CreateAssetRequest, userID string) (*AssetResponse, error) {
	if req.ResidualValue > req.AcquisitionCost {
		return nil, errors.New("residual value cannot exceed acquisition cost")
	}

	purchaseDate, err := parseDate(req.PurchaseDate)
	if err != nil {
		return nil, errors.New("invalid purchaseDate format, use YYYY-MM-DD")
	}

	asset := &entity.Asset{
		AssetCode:          strings.TrimSpace(req.AssetCode),
		Name:               strings.TrimSpace(req.Name),
		Category:           strings.TrimSpace(req.Category),
		PurchaseDate:       purchaseDate,
		AcquisitionCost:    req.AcquisitionCost,
		ResidualValue:      req.ResidualValue,
		UsefulLifeMonths:   req.UsefulLifeMonths,
		DepreciationMethod: entity.DepreciationMethodStraightLine,
		Status:             entity.AssetStatusAvailable,
		LocationID:         req.LocationID,
		Note:               req.Note,
		CreatedByID:        userID,
	}

	if err := u.Repo.CreateAsset(ctx, asset); err != nil {
		return nil, err
	}

	created, err := u.Repo.FindAssetByID(ctx, asset.ID)
	if err != nil {
		return nil, err
	}
	res := u.toAssetResponse(created, created.AcquisitionCost)
	return &res, nil
}

func (u *assetUseCase) UpdateAsset(ctx context.Context, id string, req *UpdateAssetRequest) (*AssetResponse, error) {
	asset, err := u.Repo.FindAssetByID(ctx, id)
	if err != nil {
		return nil, errors.New("asset not found")
	}

	if req.AssetCode != nil {
		asset.AssetCode = strings.TrimSpace(*req.AssetCode)
	}
	if req.Name != nil {
		asset.Name = strings.TrimSpace(*req.Name)
	}
	if req.Category != nil {
		asset.Category = strings.TrimSpace(*req.Category)
	}
	if req.PurchaseDate != nil {
		parsed, err := parseDate(*req.PurchaseDate)
		if err != nil {
			return nil, errors.New("invalid purchaseDate format, use YYYY-MM-DD")
		}
		asset.PurchaseDate = parsed
	}
	if req.AcquisitionCost != nil {
		asset.AcquisitionCost = *req.AcquisitionCost
	}
	if req.ResidualValue != nil {
		asset.ResidualValue = *req.ResidualValue
	}
	if req.UsefulLifeMonths != nil {
		asset.UsefulLifeMonths = *req.UsefulLifeMonths
	}
	if req.LocationID != nil {
		asset.LocationID = req.LocationID
	}
	if req.Status != nil {
		asset.Status = *req.Status
	}
	if req.Note != nil {
		asset.Note = req.Note
	}

	if asset.ResidualValue > asset.AcquisitionCost {
		return nil, errors.New("residual value cannot exceed acquisition cost")
	}

	if err := u.Repo.UpdateAsset(ctx, asset); err != nil {
		return nil, err
	}

	updated, err := u.Repo.FindAssetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	res := u.toAssetResponse(updated, u.currentBookValue(ctx, updated))
	return &res, nil
}

func (u *assetUseCase) DeleteAsset(ctx context.Context, id string) error {
	_, err := u.Repo.FindAssetByID(ctx, id)
	if err != nil {
		return errors.New("asset not found")
	}

	if _, err := u.Repo.FindActiveAssignmentByAssetID(ctx, id); err == nil {
		return errors.New("cannot delete asset with active assignment")
	}

	return u.Repo.DeleteAsset(ctx, id)
}

func toAssignmentResponse(assignment *entity.AssetAssignment) AssetAssignmentResponse {
	assetCode := ""
	assetName := ""
	if assignment.Asset != nil {
		assetCode = assignment.Asset.AssetCode
		assetName = assignment.Asset.Name
	}
	createdByName := ""
	if assignment.CreatedBy != nil {
		createdByName = assignment.CreatedBy.Name
	}

	return AssetAssignmentResponse{
		ID:            assignment.ID,
		AssetID:       assignment.AssetID,
		AssetCode:     assetCode,
		AssetName:     assetName,
		AssigneeType:  assignment.AssigneeType,
		AssigneeRef:   assignment.AssigneeRef,
		AssigneeName:  assignment.AssigneeName,
		AssignedAt:    assignment.AssignedAt,
		ReturnedAt:    assignment.ReturnedAt,
		ConditionOut:  assignment.ConditionOut,
		ConditionIn:   assignment.ConditionIn,
		Note:          assignment.Note,
		Status:        assignment.Status,
		CreatedByID:   assignment.CreatedByID,
		CreatedByName: createdByName,
		CreatedAt:     assignment.CreatedAt,
	}
}

func (u *assetUseCase) FindAllAssignments(ctx context.Context) ([]AssetAssignmentResponse, error) {
	assignments, err := u.Repo.FindAllAssignments(ctx)
	if err != nil {
		return nil, err
	}

	var responses []AssetAssignmentResponse
	for _, assignment := range assignments {
		responses = append(responses, toAssignmentResponse(&assignment))
	}
	return responses, nil
}

func (u *assetUseCase) CreateAssignment(ctx context.Context, req *CreateAssignmentRequest, userID string) (*AssetAssignmentResponse, error) {
	asset, err := u.Repo.FindAssetByID(ctx, req.AssetID)
	if err != nil {
		return nil, errors.New("asset not found")
	}
	if asset.Status == entity.AssetStatusDisposed {
		return nil, errors.New("cannot assign disposed asset")
	}

	if _, err := u.Repo.FindActiveAssignmentByAssetID(ctx, req.AssetID); err == nil {
		return nil, errors.New("asset already has active assignment")
	}

	assignedAt, err := parseDate(req.AssignedAt)
	if err != nil {
		return nil, errors.New("invalid assignedAt format, use YYYY-MM-DD")
	}

	assignment := &entity.AssetAssignment{
		AssetID:      req.AssetID,
		AssigneeType: req.AssigneeType,
		AssigneeRef:  req.AssigneeRef,
		AssigneeName: strings.TrimSpace(req.AssigneeName),
		AssignedAt:   assignedAt,
		ConditionOut: req.ConditionOut,
		Note:         req.Note,
		Status:       entity.AssetAssignmentStatusActive,
		CreatedByID:  userID,
	}

	err = u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(assignment).Error; err != nil {
			return err
		}

		asset.Status = entity.AssetStatusAssigned
		return tx.Save(asset).Error
	})
	if err != nil {
		return nil, err
	}

	created, err := u.Repo.FindAssignmentByID(ctx, assignment.ID)
	if err != nil {
		return nil, err
	}
	res := toAssignmentResponse(created)
	return &res, nil
}

func (u *assetUseCase) ReturnAssignment(ctx context.Context, id string, req *ReturnAssignmentRequest) (*AssetAssignmentResponse, error) {
	assignment, err := u.Repo.FindAssignmentByID(ctx, id)
	if err != nil {
		return nil, errors.New("assignment not found")
	}
	if assignment.Status == entity.AssetAssignmentStatusReturned {
		res := toAssignmentResponse(assignment)
		return &res, nil
	}

	asset, err := u.Repo.FindAssetByID(ctx, assignment.AssetID)
	if err != nil {
		return nil, errors.New("asset not found")
	}

	returnedAt := time.Now()
	if req.ReturnedAt != nil && *req.ReturnedAt != "" {
		parsed, err := parseDate(*req.ReturnedAt)
		if err != nil {
			return nil, errors.New("invalid returnedAt format, use YYYY-MM-DD")
		}
		returnedAt = parsed
	}

	assignment.ReturnedAt = &returnedAt
	assignment.ConditionIn = req.ConditionIn
	assignment.Note = req.Note
	assignment.Status = entity.AssetAssignmentStatusReturned

	err = u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(assignment).Error; err != nil {
			return err
		}

		if asset.Status != entity.AssetStatusDisposed {
			asset.Status = entity.AssetStatusAvailable
		}
		return tx.Save(asset).Error
	})
	if err != nil {
		return nil, err
	}

	updated, err := u.Repo.FindAssignmentByID(ctx, id)
	if err != nil {
		return nil, err
	}
	res := toAssignmentResponse(updated)
	return &res, nil
}

func (u *assetUseCase) DeleteAssignment(ctx context.Context, id string) error {
	assignment, err := u.Repo.FindAssignmentByID(ctx, id)
	if err != nil {
		return errors.New("assignment not found")
	}
	if assignment.Status == entity.AssetAssignmentStatusActive {
		return errors.New("cannot delete active assignment, return it first")
	}
	return u.Repo.DeleteAssignment(ctx, id)
}

func toMaintenanceResponse(maintenance *entity.AssetMaintenance) AssetMaintenanceResponse {
	assetCode := ""
	assetName := ""
	if maintenance.Asset != nil {
		assetCode = maintenance.Asset.AssetCode
		assetName = maintenance.Asset.Name
	}
	createdByName := ""
	if maintenance.CreatedBy != nil {
		createdByName = maintenance.CreatedBy.Name
	}

	return AssetMaintenanceResponse{
		ID:              maintenance.ID,
		AssetID:         maintenance.AssetID,
		AssetCode:       assetCode,
		AssetName:       assetName,
		MaintenanceDate: maintenance.MaintenanceDate,
		Type:            maintenance.Type,
		Vendor:          maintenance.Vendor,
		Cost:            maintenance.Cost,
		Description:     maintenance.Description,
		Status:          maintenance.Status,
		CompletedAt:     maintenance.CompletedAt,
		CreatedByID:     maintenance.CreatedByID,
		CreatedByName:   createdByName,
		CreatedAt:       maintenance.CreatedAt,
	}
}

func (u *assetUseCase) FindAllMaintenances(ctx context.Context) ([]AssetMaintenanceResponse, error) {
	maintenances, err := u.Repo.FindAllMaintenances(ctx)
	if err != nil {
		return nil, err
	}

	var responses []AssetMaintenanceResponse
	for _, maintenance := range maintenances {
		responses = append(responses, toMaintenanceResponse(&maintenance))
	}
	return responses, nil
}

func (u *assetUseCase) CreateMaintenance(ctx context.Context, req *CreateMaintenanceRequest, userID string) (*AssetMaintenanceResponse, error) {
	asset, err := u.Repo.FindAssetByID(ctx, req.AssetID)
	if err != nil {
		return nil, errors.New("asset not found")
	}
	if asset.Status == entity.AssetStatusDisposed {
		return nil, errors.New("cannot maintain disposed asset")
	}

	maintenanceDate, err := parseDate(req.MaintenanceDate)
	if err != nil {
		return nil, errors.New("invalid maintenanceDate format, use YYYY-MM-DD")
	}

	status := entity.AssetMaintenanceStatusScheduled
	if req.Status != nil {
		status = *req.Status
	}

	maintenance := &entity.AssetMaintenance{
		AssetID:         req.AssetID,
		MaintenanceDate: maintenanceDate,
		Type:            req.Type,
		Vendor:          req.Vendor,
		Cost:            req.Cost,
		Description:     req.Description,
		Status:          status,
		CreatedByID:     userID,
	}

	err = u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(maintenance).Error; err != nil {
			return err
		}

		if status == entity.AssetMaintenanceStatusInProgress || status == entity.AssetMaintenanceStatusScheduled {
			asset.Status = entity.AssetStatusMaintenance
			return tx.Save(asset).Error
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	created, err := u.Repo.FindMaintenanceByID(ctx, maintenance.ID)
	if err != nil {
		return nil, err
	}
	res := toMaintenanceResponse(created)
	return &res, nil
}

func (u *assetUseCase) UpdateMaintenanceStatus(ctx context.Context, id string, req *UpdateMaintenanceStatusRequest) (*AssetMaintenanceResponse, error) {
	maintenance, err := u.Repo.FindMaintenanceByID(ctx, id)
	if err != nil {
		return nil, errors.New("maintenance not found")
	}
	asset, err := u.Repo.FindAssetByID(ctx, maintenance.AssetID)
	if err != nil {
		return nil, errors.New("asset not found")
	}

	maintenance.Status = req.Status
	if req.Status == entity.AssetMaintenanceStatusCompleted {
		now := time.Now()
		maintenance.CompletedAt = &now
	}

	err = u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(maintenance).Error; err != nil {
			return err
		}

		if asset.Status != entity.AssetStatusDisposed {
			switch req.Status {
			case entity.AssetMaintenanceStatusCompleted:
				if _, err := u.Repo.FindActiveAssignmentByAssetID(ctx, asset.ID); err == nil {
					asset.Status = entity.AssetStatusAssigned
				} else {
					asset.Status = entity.AssetStatusAvailable
				}
			default:
				asset.Status = entity.AssetStatusMaintenance
			}
			return tx.Save(asset).Error
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	updated, err := u.Repo.FindMaintenanceByID(ctx, id)
	if err != nil {
		return nil, err
	}
	res := toMaintenanceResponse(updated)
	return &res, nil
}

func (u *assetUseCase) DeleteMaintenance(ctx context.Context, id string) error {
	maintenance, err := u.Repo.FindMaintenanceByID(ctx, id)
	if err != nil {
		return errors.New("maintenance not found")
	}
	if maintenance.Status == entity.AssetMaintenanceStatusInProgress {
		return errors.New("cannot delete in-progress maintenance")
	}
	return u.Repo.DeleteMaintenance(ctx, id)
}

func toDepreciationResponse(dep *entity.AssetDepreciation) AssetDepreciationResponse {
	assetCode := ""
	assetName := ""
	if dep.Asset != nil {
		assetCode = dep.Asset.AssetCode
		assetName = dep.Asset.Name
	}
	createdByName := ""
	if dep.CreatedBy != nil {
		createdByName = dep.CreatedBy.Name
	}

	return AssetDepreciationResponse{
		ID:                dep.ID,
		AssetID:           dep.AssetID,
		AssetCode:         assetCode,
		AssetName:         assetName,
		Period:            dep.Period,
		OpeningBookValue:  dep.OpeningBookValue,
		DepreciationValue: dep.DepreciationValue,
		ClosingBookValue:  dep.ClosingBookValue,
		Status:            dep.Status,
		PostedAt:          dep.PostedAt,
		CreatedByID:       dep.CreatedByID,
		CreatedByName:     createdByName,
		CreatedAt:         dep.CreatedAt,
	}
}

func validPeriod(period string) bool {
	if len(period) != 7 {
		return false
	}
	_, err := time.Parse("2006-01", period)
	return err == nil
}

func (u *assetUseCase) FindAllDepreciations(ctx context.Context, period string) ([]AssetDepreciationResponse, error) {
	if period != "" && !validPeriod(period) {
		return nil, errors.New("invalid period format, use YYYY-MM")
	}

	depreciations, err := u.Repo.FindAllDepreciations(ctx, period)
	if err != nil {
		return nil, err
	}

	var responses []AssetDepreciationResponse
	for _, dep := range depreciations {
		responses = append(responses, toDepreciationResponse(&dep))
	}
	return responses, nil
}

func (u *assetUseCase) GenerateDepreciations(ctx context.Context, req *GenerateDepreciationRequest, userID string) ([]AssetDepreciationResponse, error) {
	if !validPeriod(req.Period) {
		return nil, errors.New("invalid period format, use YYYY-MM")
	}

	assets, err := u.Repo.FindAllAssets(ctx)
	if err != nil {
		return nil, err
	}

	var generated []AssetDepreciationResponse
	for _, asset := range assets {
		if asset.Status == entity.AssetStatusDisposed {
			continue
		}
		if asset.UsefulLifeMonths <= 0 {
			continue
		}

		if _, err := u.Repo.FindDepreciationByAssetAndPeriod(ctx, asset.ID, req.Period); err == nil {
			continue
		}

		opening := asset.AcquisitionCost
		if prev, err := u.Repo.FindLatestDepreciationBefore(ctx, asset.ID, req.Period); err == nil {
			opening = prev.ClosingBookValue
		}

		depreciableBase := asset.AcquisitionCost - asset.ResidualValue
		if depreciableBase < 0 {
			depreciableBase = 0
		}

		monthly := 0
		if asset.UsefulLifeMonths > 0 {
			monthly = depreciableBase / asset.UsefulLifeMonths
		}

		closing := opening - monthly
		if closing < asset.ResidualValue {
			closing = asset.ResidualValue
			monthly = opening - closing
			if monthly < 0 {
				monthly = 0
			}
		}

		dep := &entity.AssetDepreciation{
			AssetID:           asset.ID,
			Period:            req.Period,
			OpeningBookValue:  opening,
			DepreciationValue: monthly,
			ClosingBookValue:  closing,
			Status:            entity.AssetDepreciationStatusDraft,
			CreatedByID:       userID,
		}

		if err := u.Repo.CreateDepreciation(ctx, dep); err != nil {
			return nil, err
		}

		created, err := u.Repo.FindDepreciationByID(ctx, dep.ID)
		if err != nil {
			return nil, err
		}
		generated = append(generated, toDepreciationResponse(created))
	}

	return generated, nil
}

func (u *assetUseCase) UpdateDepreciationStatus(ctx context.Context, id string, req *PostDepreciationRequest) (*AssetDepreciationResponse, error) {
	dep, err := u.Repo.FindDepreciationByID(ctx, id)
	if err != nil {
		return nil, errors.New("depreciation entry not found")
	}

	dep.Status = req.Status
	if req.Status == entity.AssetDepreciationStatusPosted {
		now := time.Now()
		dep.PostedAt = &now
	} else {
		dep.PostedAt = nil
	}

	if err := u.Repo.UpdateDepreciation(ctx, dep); err != nil {
		return nil, err
	}

	updated, err := u.Repo.FindDepreciationByID(ctx, id)
	if err != nil {
		return nil, err
	}
	res := toDepreciationResponse(updated)
	return &res, nil
}

package asset

import (
	"hris_backend/entity"
	"time"
)

type AssetResponse struct {
	ID                 string             `json:"id"`
	AssetCode          string             `json:"assetCode"`
	Name               string             `json:"name"`
	Category           string             `json:"category"`
	PurchaseDate       time.Time          `json:"purchaseDate"`
	AcquisitionCost    int                `json:"acquisitionCost"`
	ResidualValue      int                `json:"residualValue"`
	UsefulLifeMonths   int                `json:"usefulLifeMonths"`
	DepreciationMethod string             `json:"depreciationMethod"`
	Status             entity.AssetStatus `json:"status"`
	LocationID         *string            `json:"locationId"`
	LocationName       string             `json:"locationName"`
	Note               *string            `json:"note"`
	CreatedByID        string             `json:"createdById"`
	CreatedByName      string             `json:"createdByName"`
	CreatedAt          time.Time          `json:"createdAt"`
	CurrentBookValue   int                `json:"currentBookValue"`
}

type CreateAssetRequest struct {
	AssetCode        string  `json:"assetCode" validate:"required"`
	Name             string  `json:"name" validate:"required"`
	Category         string  `json:"category" validate:"required"`
	PurchaseDate     string  `json:"purchaseDate" validate:"required"`
	AcquisitionCost  int     `json:"acquisitionCost" validate:"required,min=1"`
	ResidualValue    int     `json:"residualValue" validate:"min=0"`
	UsefulLifeMonths int     `json:"usefulLifeMonths" validate:"required,min=1"`
	LocationID       *string `json:"locationId"`
	Note             *string `json:"note"`
}

type UpdateAssetRequest struct {
	AssetCode        *string            `json:"assetCode"`
	Name             *string            `json:"name"`
	Category         *string            `json:"category"`
	PurchaseDate     *string            `json:"purchaseDate"`
	AcquisitionCost  *int               `json:"acquisitionCost"`
	ResidualValue    *int               `json:"residualValue"`
	UsefulLifeMonths *int               `json:"usefulLifeMonths"`
	LocationID       *string            `json:"locationId"`
	Status           *entity.AssetStatus `json:"status"`
	Note             *string            `json:"note"`
}

type AssetAssignmentResponse struct {
	ID           string                       `json:"id"`
	AssetID      string                       `json:"assetId"`
	AssetCode    string                       `json:"assetCode"`
	AssetName    string                       `json:"assetName"`
	AssigneeType entity.AssetAssigneeType     `json:"assigneeType"`
	AssigneeRef  *string                      `json:"assigneeRef"`
	AssigneeName string                       `json:"assigneeName"`
	AssignedAt   time.Time                    `json:"assignedAt"`
	ReturnedAt   *time.Time                   `json:"returnedAt"`
	ConditionOut *string                      `json:"conditionOut"`
	ConditionIn  *string                      `json:"conditionIn"`
	Note         *string                      `json:"note"`
	Status       entity.AssetAssignmentStatus `json:"status"`
	CreatedByID  string                       `json:"createdById"`
	CreatedByName string                      `json:"createdByName"`
	CreatedAt    time.Time                    `json:"createdAt"`
}

type CreateAssignmentRequest struct {
	AssetID      string                   `json:"assetId" validate:"required"`
	AssigneeType entity.AssetAssigneeType `json:"assigneeType" validate:"required,oneof=USER DEPARTMENT LOCATION OTHER"`
	AssigneeRef  *string                  `json:"assigneeRef"`
	AssigneeName string                   `json:"assigneeName" validate:"required"`
	AssignedAt   string                   `json:"assignedAt" validate:"required"`
	ConditionOut *string                  `json:"conditionOut"`
	Note         *string                  `json:"note"`
}

type ReturnAssignmentRequest struct {
	ReturnedAt  *string `json:"returnedAt"`
	ConditionIn *string `json:"conditionIn"`
	Note        *string `json:"note"`
}

type AssetMaintenanceResponse struct {
	ID              string                        `json:"id"`
	AssetID         string                        `json:"assetId"`
	AssetCode       string                        `json:"assetCode"`
	AssetName       string                        `json:"assetName"`
	MaintenanceDate time.Time                     `json:"maintenanceDate"`
	Type            entity.AssetMaintenanceType   `json:"type"`
	Vendor          *string                       `json:"vendor"`
	Cost            int                           `json:"cost"`
	Description     *string                       `json:"description"`
	Status          entity.AssetMaintenanceStatus `json:"status"`
	CompletedAt     *time.Time                    `json:"completedAt"`
	CreatedByID     string                        `json:"createdById"`
	CreatedByName   string                        `json:"createdByName"`
	CreatedAt       time.Time                     `json:"createdAt"`
}

type CreateMaintenanceRequest struct {
	AssetID         string                      `json:"assetId" validate:"required"`
	MaintenanceDate string                      `json:"maintenanceDate" validate:"required"`
	Type            entity.AssetMaintenanceType `json:"type" validate:"required,oneof=PREVENTIVE CORRECTIVE INSPECTION"`
	Vendor          *string                     `json:"vendor"`
	Cost            int                         `json:"cost" validate:"min=0"`
	Description     *string                     `json:"description"`
	Status          *entity.AssetMaintenanceStatus `json:"status" validate:"omitempty,oneof=SCHEDULED IN_PROGRESS COMPLETED"`
}

type UpdateMaintenanceStatusRequest struct {
	Status entity.AssetMaintenanceStatus `json:"status" validate:"required,oneof=SCHEDULED IN_PROGRESS COMPLETED"`
}

type AssetDepreciationResponse struct {
	ID                string                         `json:"id"`
	AssetID           string                         `json:"assetId"`
	AssetCode         string                         `json:"assetCode"`
	AssetName         string                         `json:"assetName"`
	Period            string                         `json:"period"`
	OpeningBookValue  int                            `json:"openingBookValue"`
	DepreciationValue int                            `json:"depreciationValue"`
	ClosingBookValue  int                            `json:"closingBookValue"`
	Status            entity.AssetDepreciationStatus `json:"status"`
	PostedAt          *time.Time                     `json:"postedAt"`
	CreatedByID       string                         `json:"createdById"`
	CreatedByName     string                         `json:"createdByName"`
	CreatedAt         time.Time                      `json:"createdAt"`
}

type GenerateDepreciationRequest struct {
	Period string `json:"period" validate:"required"`
}

type PostDepreciationRequest struct {
	Status entity.AssetDepreciationStatus `json:"status" validate:"required,oneof=DRAFT POSTED"`
}

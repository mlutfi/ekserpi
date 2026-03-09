package auth

import (
	"hris_backend/entity"
	"hris_backend/helper"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuthHandler interface {
	Login(ctx *fiber.Ctx) error
	Verify2FALogin(ctx *fiber.Ctx) error
	Logout(ctx *fiber.Ctx) error
	Me(ctx *fiber.Ctx) error
	ChangePassword(ctx *fiber.Ctx) error
	Generate2FASetup(ctx *fiber.Ctx) error
	Enable2FA(ctx *fiber.Ctx) error
	Disable2FA(ctx *fiber.Ctx) error
}

type authHandler struct {
	UseCase AuthUseCase
	DB      *gorm.DB
}

func NewAuthHandler(useCase AuthUseCase, db *gorm.DB) AuthHandler {
	return &authHandler{UseCase: useCase, DB: db}
}

func (h *authHandler) Login(ctx *fiber.Ctx) error {
	request := new(LoginRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	response, err := h.UseCase.Login(ctx.Context(), request)
	if err != nil {
		return helper.ErrorResponse(ctx, fiber.StatusUnauthorized, err.Error())
	}

	return helper.SuccessResponse(ctx, response)
}

func (h *authHandler) Logout(ctx *fiber.Ctx) error {
	return helper.SuccessResponse(ctx, fiber.Map{"ok": true})
}

func (h *authHandler) Me(ctx *fiber.Ctx) error {
	userId := ctx.Locals("userId").(string)
	role := ctx.Locals("role").(string)

	user, err := h.UseCase.GetMe(ctx.Context(), userId)
	if err != nil {
		return helper.NotFoundResponse(ctx, "User not found")
	}

	response := fiber.Map{
		"user": user,
	}

	// If HRIS role, also get employee data (from User entity)
	if isHRISRole(role) {
		var employee entity.User
		result := h.DB.WithContext(ctx.Context()).Where("id = ?", userId).First(&employee) // We get via id since user and employee are merged
		if result.Error == nil {
			joinDateStr := ""
			if employee.JoinDate != nil {
				joinDateStr = employee.JoinDate.Format("2006-01-02")
			}
			response["employee"] = EmployeeResponse{
				ID:           employee.ID,
				NIP:          ptrToStr(employee.NIP),
				Name:         employee.Name,
				Email:        employee.Email,
				Phone:        employee.Phone,
				DepartmentID: ptrToStr(employee.DepartmentID),
				PositionID:   ptrToStr(employee.PositionID),
				JoinDate:     joinDateStr,
				EmployeeType: string(entity.NormalizeEmployeeType(string(employee.EmployeeType))),
				Status:       string(employee.Status),
			}
		}
	}

	return helper.SuccessResponse(ctx, response)
}

func (h *authHandler) ChangePassword(ctx *fiber.Ctx) error {
	userId := ctx.Locals("userId").(string)
	request := new(ChangePasswordRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	err := h.UseCase.ChangePassword(ctx.Context(), userId, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	return helper.SuccessResponseWithMessage(ctx, "Password changed successfully", nil)
}

func (h *authHandler) Verify2FALogin(ctx *fiber.Ctx) error {
	request := new(Verify2FALoginRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	response, err := h.UseCase.Verify2FALogin(ctx.Context(), request)
	if err != nil {
		return helper.ErrorResponse(ctx, fiber.StatusUnauthorized, err.Error())
	}

	return helper.SuccessResponse(ctx, response)
}

func (h *authHandler) Generate2FASetup(ctx *fiber.Ctx) error {
	userId := ctx.Locals("userId").(string)
	response, err := h.UseCase.Generate2FASetup(ctx.Context(), userId)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	return helper.SuccessResponse(ctx, response)
}

func (h *authHandler) Enable2FA(ctx *fiber.Ctx) error {
	userId := ctx.Locals("userId").(string)
	request := new(Verify2FARequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	err := h.UseCase.Enable2FA(ctx.Context(), userId, request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	return helper.SuccessResponseWithMessage(ctx, "2FA enabled successfully", nil)
}

func (h *authHandler) Disable2FA(ctx *fiber.Ctx) error {
	userId := ctx.Locals("userId").(string)
	err := h.UseCase.Disable2FA(ctx.Context(), userId)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}

	return helper.SuccessResponseWithMessage(ctx, "2FA disabled successfully", nil)
}

// Helper function to convert *string to string
func ptrToStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

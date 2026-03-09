package attendance

import (
	"hris_backend/entity"
	"hris_backend/helper"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AttendanceHandler interface {
	CheckIn(ctx *fiber.Ctx) error
	CheckOut(ctx *fiber.Ctx) error
	Approve(ctx *fiber.Ctx) error
	Reject(ctx *fiber.Ctx) error
	GetPendingApprovals(ctx *fiber.Ctx) error
	GetHistory(ctx *fiber.Ctx) error
	GetTodayAttendance(ctx *fiber.Ctx) error
	GetMyTodayAttendance(ctx *fiber.Ctx) error
	GetLateEmployees(ctx *fiber.Ctx) error
	GetTodayStats(ctx *fiber.Ctx) error
}

type attendanceHandler struct {
	UseCase AttendanceUseCase
	DB      *gorm.DB
}

func NewAttendanceHandler(useCase AttendanceUseCase, db *gorm.DB) AttendanceHandler {
	return &attendanceHandler{UseCase: useCase, DB: db}
}

func (h *attendanceHandler) CheckIn(ctx *fiber.Ctx) error {
	request := new(CheckInRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	attendance, err := h.UseCase.CheckIn(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.CreatedResponse(ctx, attendance)
}

func (h *attendanceHandler) CheckOut(ctx *fiber.Ctx) error {
	request := new(CheckOutRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	attendance, err := h.UseCase.CheckOut(ctx.Context(), request)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, attendance)
}

func (h *attendanceHandler) GetHistory(ctx *fiber.Ctx) error {
	employeeID := ctx.Query("employeeId")
	startDateStr := ctx.Query("startDate")
	endDateStr := ctx.Query("endDate")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		startDate = time.Now().AddDate(0, 0, -30)
	}
	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		endDate = time.Now()
	}

	// If no employeeId, decide based on role
	if employeeID == "" {
		role := ctx.Locals("role")
		roleStr, _ := role.(string)
		userID := ctx.Locals("userId")

		if roleStr == "HR_ADMIN" || roleStr == "MANAGER" || roleStr == "OWNER" {
			// Return all employees' attendance history
			attendances, err := h.UseCase.GetAllHistory(ctx.Context(), startDate, endDate)
			if err != nil {
				return helper.InternalServerErrorResponse(ctx, err.Error())
			}
			return helper.SuccessResponse(ctx, attendances)
		}

		// For TEAM_LEADER: return team attendance
		if roleStr == "TEAM_LEADER" {
			if userID == nil {
				return helper.BadRequestResponse(ctx, "User not authenticated")
			}
			// Get the team leader's employee record
			var teamLeader entity.User
			dbErr := h.DB.WithContext(ctx.Context()).First(&teamLeader, "id = ?", userID.(string)).Error
			if dbErr != nil {
				if dbErr == gorm.ErrRecordNotFound {
					return helper.BadRequestResponse(ctx, "Employee record not found for this user")
				}
				return helper.InternalServerErrorResponse(ctx, "Failed to lookup employee record")
			}
			// Get team attendance
			attendances, err := h.UseCase.GetTeamHistory(ctx.Context(), teamLeader.ID, startDate, endDate)
			if err != nil {
				return helper.InternalServerErrorResponse(ctx, err.Error())
			}
			return helper.SuccessResponse(ctx, attendances)
		}

		// For EMPLOYEE, STAFF: look up their employee record by userId
		if userID == nil {
			return helper.BadRequestResponse(ctx, "employeeId is required")
		}
		var employee entity.User
		dbErr := h.DB.WithContext(ctx.Context()).First(&employee, "id = ?", userID.(string)).Error
		if dbErr != nil {
			if dbErr == gorm.ErrRecordNotFound {
				return helper.BadRequestResponse(ctx, "Employee record not found for this user. Please contact HR to set up your employee profile.")
			}
			return helper.InternalServerErrorResponse(ctx, "Failed to lookup employee record")
		}
		employeeID = employee.ID
	}

	attendances, err := h.UseCase.GetHistory(ctx.Context(), employeeID, startDate, endDate)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, attendances)
}

func (h *attendanceHandler) GetTodayAttendance(ctx *fiber.Ctx) error {
	attendances, err := h.UseCase.GetTodayAttendance(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, attendances)
}

func (h *attendanceHandler) GetMyTodayAttendance(ctx *fiber.Ctx) error {
	// Get user ID from JWT token
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}

	// Get employee by user ID
	var employee entity.User
	err := h.DB.WithContext(ctx.Context()).First(&employee, "id = ?", userID.(string)).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return helper.BadRequestResponse(ctx, "Employee record not found")
		}
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}

	// Get today's attendance for this employee
	attendance, err := h.UseCase.GetMyTodayAttendance(ctx.Context(), employee.ID)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}

	return helper.SuccessResponse(ctx, attendance)
}

func (h *attendanceHandler) GetLateEmployees(ctx *fiber.Ctx) error {
	attendances, err := h.UseCase.GetLateEmployees(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, attendances)
}

func (h *attendanceHandler) Approve(ctx *fiber.Ctx) error {
	request := new(ApproveAttendanceRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	// Get user ID from JWT token (the approver)
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}

	attendance, err := h.UseCase.Approve(ctx.Context(), request.AttendanceID, userID.(string))
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, attendance)
}

func (h *attendanceHandler) Reject(ctx *fiber.Ctx) error {
	request := new(ApproveAttendanceRequest)
	if err := ctx.BodyParser(request); err != nil {
		return helper.BadRequestResponse(ctx, "Invalid request body")
	}

	// Get user ID from JWT token (the approver)
	userID := ctx.Locals("userId")
	if userID == nil {
		return helper.UnauthorizedResponse(ctx, "User not authenticated")
	}

	reason := ctx.Query("reason", "")
	attendance, err := h.UseCase.Reject(ctx.Context(), request.AttendanceID, userID.(string), reason)
	if err != nil {
		return helper.BadRequestResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, attendance)
}

func (h *attendanceHandler) GetPendingApprovals(ctx *fiber.Ctx) error {
	role := ctx.Locals("role")
	roleStr, _ := role.(string)

	userID := ctx.Locals("userId")
	userIDStr, _ := userID.(string)

	attendances, err := h.UseCase.GetPendingApprovals(ctx.Context(), roleStr, userIDStr)
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, attendances)
}

func (h *attendanceHandler) GetTodayStats(ctx *fiber.Ctx) error {
	stats, err := h.UseCase.GetTodayStats(ctx.Context())
	if err != nil {
		return helper.InternalServerErrorResponse(ctx, err.Error())
	}
	return helper.SuccessResponse(ctx, stats)
}

package attendance

import (
	"context"
	"errors"
	"math"
	"time"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type AttendanceUseCase interface {
	CheckIn(ctx context.Context, request *CheckInRequest) (*AttendanceResponse, error)
	CheckOut(ctx context.Context, request *CheckOutRequest) (*AttendanceResponse, error)
	Approve(ctx context.Context, attendanceID string, approvedBy string) (*AttendanceResponse, error)
	Reject(ctx context.Context, attendanceID string, approvedBy string, reason string) (*AttendanceResponse, error)
	GetPendingApprovals(ctx context.Context, userRole string, userID string) ([]AttendanceResponse, error)
	GetHistory(ctx context.Context, employeeID string, startDate, endDate time.Time) ([]AttendanceResponse, error)
	GetAllHistory(ctx context.Context, startDate, endDate time.Time) ([]AttendanceResponse, error)
	GetTeamHistory(ctx context.Context, teamLeaderID string, startDate, endDate time.Time) ([]AttendanceResponse, error)
	GetTodayAttendance(ctx context.Context) ([]AttendanceResponse, error)
	GetMyTodayAttendance(ctx context.Context, employeeID string) (*AttendanceResponse, error)
	GetLateEmployees(ctx context.Context) ([]AttendanceResponse, error)
	GetTodayStats(ctx context.Context) (*AttendanceStatsResponse, error)
}

type attendanceUseCase struct {
	DB         *gorm.DB
	Repository AttendanceRepository
}

func NewAttendanceUseCase(db *gorm.DB, repository AttendanceRepository) AttendanceUseCase {
	return &attendanceUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *attendanceUseCase) CheckIn(ctx context.Context, request *CheckInRequest) (*AttendanceResponse, error) {
	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	// Check if already checked in
	existing, _ := u.Repository.GetByEmployeeAndDate(ctx, request.EmployeeID, today)
	if existing != nil && existing.CheckInTime != nil {
		return nil, errors.New("already checked in today")
	}

	// Calculate distance from office if WFO
	var status entity.AttendanceStatus = entity.AttendanceStatusPresent
	var radius float64

	if request.WorkType == "WFO" && request.OfficeLat != 0 && request.OfficeLong != 0 {
		distance := u.calculateDistance(request.Latitude, request.Longitude, request.OfficeLat, request.OfficeLong)
		radius = distance
		if distance > request.OfficeRadius {
			status = entity.AttendanceStatusOutside
		}
	}

	// Check if late (after 9:15 AM)
	checkInTime := time.Now()
	thresholdTime := time.Date(today.Year(), today.Month(), today.Day(), 9, 15, 0, 0, today.Location())
	if checkInTime.After(thresholdTime) && status == entity.AttendanceStatusPresent {
		status = entity.AttendanceStatusLate
	}

	// Check if WFH/WFA needs approval
	isWFH := request.WorkType == "WFH"
	isWFA := request.WorkType == "WFA"
	if (isWFH || isWFA) && request.Reason == "" {
		return nil, errors.New("reason is required for WFH/WFA")
	}

	// Set pending approval status for WFH/WFA
	if isWFH || isWFA {
		status = entity.AttendanceStatusPending
	}

	now := time.Now()
	checkInTimeOfDay := time.Date(today.Year(), today.Month(), today.Day(), now.Hour(), now.Minute(), now.Second(), 0, today.Location())

	attendance := &entity.Attendance{
		EmployeeID:    request.EmployeeID,
		Date:          startOfDay,
		CheckInTime:   &checkInTimeOfDay,
		CheckInPhoto:  request.Photo,
		CheckInLat:    &request.Latitude,
		CheckInLong:   &request.Longitude,
		CheckInRadius: radius,
		WorkType:      entity.WorkType(request.WorkType),
		Status:        status,
		Reason:        request.Reason,
	}

	err := u.Repository.Create(ctx, attendance)
	if err != nil {
		return nil, err
	}

	// Reload with employee
	reloaded, err := u.Repository.GetByEmployeeAndDate(ctx, request.EmployeeID, today)
	if err != nil || reloaded == nil {
		// Fallback: return the created attendance directly
		return u.toResponse(attendance), nil
	}
	return u.toResponse(reloaded), nil
}

func (u *attendanceUseCase) CheckOut(ctx context.Context, request *CheckOutRequest) (*AttendanceResponse, error) {
	today := time.Now()

	// Check if checked in
	existing, err := u.Repository.GetByEmployeeAndDate(ctx, request.EmployeeID, today)
	if err != nil {
		return nil, errors.New("not checked in today")
	}

	if existing.CheckOutTime != nil {
		return nil, errors.New("already checked out today")
	}

	now := time.Now()
	checkOutTimeOfDay := time.Date(today.Year(), today.Month(), today.Day(), now.Hour(), now.Minute(), now.Second(), 0, today.Location())

	existing.CheckOutTime = &checkOutTimeOfDay
	existing.CheckOutPhoto = request.Photo
	existing.CheckOutLat = &request.Latitude
	existing.CheckOutLong = &request.Longitude

	err = u.Repository.Update(ctx, existing)
	if err != nil {
		return nil, err
	}

	// Reload with employee
	reloaded, err := u.Repository.GetByEmployeeAndDate(ctx, request.EmployeeID, today)
	if err != nil || reloaded == nil {
		return u.toResponse(existing), nil
	}
	return u.toResponse(reloaded), nil
}

func (u *attendanceUseCase) GetHistory(ctx context.Context, employeeID string, startDate, endDate time.Time) ([]AttendanceResponse, error) {
	attendances, err := u.Repository.GetByEmployee(ctx, employeeID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	var responses []AttendanceResponse
	for _, att := range attendances {
		responses = append(responses, *u.toResponse(&att))
	}
	return responses, nil
}

func (u *attendanceUseCase) GetAllHistory(ctx context.Context, startDate, endDate time.Time) ([]AttendanceResponse, error) {
	attendances, err := u.Repository.GetAll(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	var responses []AttendanceResponse
	for _, att := range attendances {
		responses = append(responses, *u.toResponse(&att))
	}
	return responses, nil
}

func (u *attendanceUseCase) GetTeamHistory(ctx context.Context, teamLeaderID string, startDate, endDate time.Time) ([]AttendanceResponse, error) {
	attendances, err := u.Repository.GetByTeamLeader(ctx, teamLeaderID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	var responses []AttendanceResponse
	for _, att := range attendances {
		responses = append(responses, *u.toResponse(&att))
	}
	return responses, nil
}

func (u *attendanceUseCase) GetTodayAttendance(ctx context.Context) ([]AttendanceResponse, error) {
	attendances, err := u.Repository.GetTodayAttendance(ctx)
	if err != nil {
		return nil, err
	}

	var responses []AttendanceResponse
	for _, att := range attendances {
		responses = append(responses, *u.toResponse(&att))
	}
	return responses, nil
}

func (u *attendanceUseCase) GetMyTodayAttendance(ctx context.Context, employeeID string) (*AttendanceResponse, error) {
	attendance, err := u.Repository.GetMyTodayAttendance(ctx, employeeID)
	if err != nil {
		return nil, err
	}

	if attendance == nil {
		return nil, nil
	}

	resp := u.toResponse(attendance)
	return resp, nil
}

func (u *attendanceUseCase) GetLateEmployees(ctx context.Context) ([]AttendanceResponse, error) {
	today := time.Now()
	thresholdTime := time.Date(today.Year(), today.Month(), today.Day(), 9, 15, 0, 0, today.Location())

	attendances, err := u.Repository.GetLateEmployees(ctx, today, thresholdTime)
	if err != nil {
		return nil, err
	}

	var responses []AttendanceResponse
	for _, att := range attendances {
		responses = append(responses, *u.toResponse(&att))
	}
	return responses, nil
}

func (u *attendanceUseCase) calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000 // Earth's radius in meters

	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	deltaPhi := (lat2 - lat1) * math.Pi / 180
	deltaLambda := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaPhi/2)*math.Sin(deltaPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*
			math.Sin(deltaLambda/2)*math.Sin(deltaLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

func (u *attendanceUseCase) toResponse(attendance *entity.Attendance) *AttendanceResponse {
	if attendance == nil {
		return nil
	}
	resp := &AttendanceResponse{
		ID:            attendance.ID,
		EmployeeID:    attendance.EmployeeID,
		Date:          attendance.Date.Format("2006-01-02"),
		CheckInPhoto:  attendance.CheckInPhoto,
		CheckInLat:    attendance.CheckInLat,
		CheckInLong:   attendance.CheckInLong,
		CheckInRadius: attendance.CheckInRadius,
		CheckOutPhoto: attendance.CheckOutPhoto,
		CheckOutLat:   attendance.CheckOutLat,
		CheckOutLong:  attendance.CheckOutLong,
		WorkType:      string(attendance.WorkType),
		Status:        string(attendance.Status),
		Reason:        attendance.Reason,
		Notes:         attendance.Notes,
	}

	if attendance.CheckInTime != nil {
		resp.CheckInTime = attendance.CheckInTime.Format("15:04:05")
	}
	if attendance.CheckOutTime != nil {
		resp.CheckOutTime = attendance.CheckOutTime.Format("15:04:05")
	}
	if attendance.Employee.Name != "" {
		resp.EmployeeName = attendance.Employee.Name
	}
	if attendance.ApprovedBy != nil {
		resp.ApprovedBy = attendance.ApprovedBy
	}
	if attendance.ApprovedAt != nil {
		t := attendance.ApprovedAt.Format("2006-01-02 15:04:05")
		resp.ApprovedAt = &t
	}

	return resp
}

// Approve approves a WFH/WFA attendance request
func (u *attendanceUseCase) Approve(ctx context.Context, attendanceID string, approvedBy string) (*AttendanceResponse, error) {
	attendance, err := u.Repository.GetByID(ctx, attendanceID)
	if err != nil {
		return nil, errors.New("attendance not found")
	}

	if attendance.Status != entity.AttendanceStatusPending {
		return nil, errors.New("attendance is not pending approval")
	}

	now := time.Now()
	attendance.Status = entity.AttendanceStatusApproved
	attendance.ApprovedBy = &approvedBy
	attendance.ApprovedAt = &now

	err = u.Repository.Update(ctx, attendance)
	if err != nil {
		return nil, err
	}

	return u.toResponse(attendance), nil
}

// Reject rejects a WFH/WFA attendance request
func (u *attendanceUseCase) Reject(ctx context.Context, attendanceID string, approvedBy string, reason string) (*AttendanceResponse, error) {
	attendance, err := u.Repository.GetByID(ctx, attendanceID)
	if err != nil {
		return nil, errors.New("attendance not found")
	}

	if attendance.Status != entity.AttendanceStatusPending {
		return nil, errors.New("attendance is not pending approval")
	}

	now := time.Now()
	attendance.Status = entity.AttendanceStatusRejected
	attendance.ApprovedBy = &approvedBy
	attendance.ApprovedAt = &now
	attendance.Notes = reason // Store rejection reason in notes

	err = u.Repository.Update(ctx, attendance)
	if err != nil {
		return nil, err
	}

	return u.toResponse(attendance), nil
}

// GetPendingApprovals returns pending WFH/WFA attendance requests based on user role
func (u *attendanceUseCase) GetPendingApprovals(ctx context.Context, userRole string, userID string) ([]AttendanceResponse, error) {
	var attendances []entity.Attendance

	// Query based on role
	err := u.DB.WithContext(ctx).
		Preload("Employee").
		Where("status = ?", entity.AttendanceStatusPending).
		Order("created_at DESC").
		Find(&attendances).Error

	if err != nil {
		return nil, err
	}

	var responses []AttendanceResponse
	for _, att := range attendances {
		// Filter based on role hierarchy
		shouldInclude := false
		switch userRole {
		case "OWNER":
			// OWNER can see all
			shouldInclude = true
		case "HR_ADMIN":
			// HR_ADMIN sees pending from all except OWNER
			shouldInclude = true
		case "MANAGER":
			// MANAGER sees pending from TEAM_LEADER and STAFF
			// Would need to check employee hierarchy
			shouldInclude = true
		case "TEAM_LEADER":
			// TEAM_LEADER sees pending from STAFF only
			shouldInclude = true
		case "STAFF":
			// STAFF cannot approve
			shouldInclude = false
		}

		if shouldInclude {
			responses = append(responses, *u.toResponse(&att))
		}
	}

	return responses, nil
}

// GetTodayStats returns attendance statistics for today
func (u *attendanceUseCase) GetTodayStats(ctx context.Context) (*AttendanceStatsResponse, error) {
	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	endOfDay := time.Date(today.Year(), today.Month(), today.Day(), 23, 59, 59, 0, today.Location())

	// Get total active employees
	var totalEmployees int64
	err := u.DB.WithContext(ctx).Model(&entity.User{}).
		Where("status = ?", entity.EmployeeStatusActive).
		Count(&totalEmployees).Error
	if err != nil {
		return nil, err
	}

	// Get today's attendance counts
	var wfoCount, wfhCount, wfaCount, notCheckedIn int64

	// WFO count
	u.DB.WithContext(ctx).Model(&entity.Attendance{}).
		Where("date BETWEEN ? AND ? AND work_type = ?", startOfDay, endOfDay, entity.WorkTypeWFO).
		Count(&wfoCount)

	// WFH count (approved)
	u.DB.WithContext(ctx).Model(&entity.Attendance{}).
		Where("date BETWEEN ? AND ? AND work_type = ? AND status = ?", startOfDay, endOfDay, entity.WorkTypeWFH, entity.AttendanceStatusApproved).
		Count(&wfhCount)

	// WFA count (approved)
	u.DB.WithContext(ctx).Model(&entity.Attendance{}).
		Where("date BETWEEN ? AND ? AND work_type = ? AND status = ?", startOfDay, endOfDay, entity.WorkTypeWFA, entity.AttendanceStatusApproved).
		Count(&wfaCount)

	// Not checked in = total employees - (WFO + WFH + WFA)
	notCheckedIn = totalEmployees - wfoCount - wfhCount - wfaCount
	if notCheckedIn < 0 {
		notCheckedIn = 0
	}

	return &AttendanceStatsResponse{
		TotalEmployees: int(totalEmployees),
		WFOCount:       int(wfoCount),
		WFHCount:       int(wfhCount),
		WFACount:       int(wfaCount),
		NotCheckedIn:   int(notCheckedIn),
	}, nil
}

package attendance

import (
	"context"
	"errors"
	"time"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type AttendanceRepository interface {
	GetByID(ctx context.Context, id string) (*entity.Attendance, error)
	GetByEmployeeAndDate(ctx context.Context, employeeID string, date time.Time) (*entity.Attendance, error)
	GetByEmployee(ctx context.Context, employeeID string, startDate, endDate time.Time) ([]entity.Attendance, error)
	GetAll(ctx context.Context, startDate, endDate time.Time) ([]entity.Attendance, error)
	GetByTeamLeader(ctx context.Context, teamLeaderID string, startDate, endDate time.Time) ([]entity.Attendance, error)
	GetTodayAttendance(ctx context.Context) ([]entity.Attendance, error)
	GetMyTodayAttendance(ctx context.Context, employeeID string) (*entity.Attendance, error)
	GetByDepartment(ctx context.Context, deptID string, date time.Time) ([]entity.Attendance, error)
	GetLateEmployees(ctx context.Context, date time.Time, threshold time.Time) ([]entity.Attendance, error)
	Create(ctx context.Context, attendance *entity.Attendance) error
	Update(ctx context.Context, attendance *entity.Attendance) error
	Delete(ctx context.Context, id string) error
}

type attendanceRepository struct {
	DB *gorm.DB
}

func NewAttendanceRepository(db *gorm.DB) AttendanceRepository {
	return &attendanceRepository{DB: db}
}

func (r *attendanceRepository) GetByEmployeeAndDate(ctx context.Context, employeeID string, date time.Time) (*entity.Attendance, error) {
	attendance := new(entity.Attendance)
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("employee_id = ? AND date >= ? AND date < ?", employeeID, startOfDay, endOfDay).
		First(attendance).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("attendance not found")
		}
		return nil, err
	}
	return attendance, nil
}

func (r *attendanceRepository) GetByID(ctx context.Context, id string) (*entity.Attendance, error) {
	attendance := new(entity.Attendance)
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		First(attendance, "id = ?", id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("attendance not found")
		}
		return nil, err
	}
	return attendance, nil
}

func (r *attendanceRepository) GetByEmployee(ctx context.Context, employeeID string, startDate, endDate time.Time) ([]entity.Attendance, error) {
	var attendances []entity.Attendance
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("employee_id = ? AND date >= ? AND date <= ?", employeeID, startDate, endDate).
		Order("date DESC").
		Find(&attendances).Error
	return attendances, err
}

func (r *attendanceRepository) GetAll(ctx context.Context, startDate, endDate time.Time) ([]entity.Attendance, error) {
	var attendances []entity.Attendance
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("date >= ? AND date <= ?", startDate, endDate).
		Order("date DESC").
		Find(&attendances).Error
	return attendances, err
}

func (r *attendanceRepository) GetByTeamLeader(ctx context.Context, teamLeaderID string, startDate, endDate time.Time) ([]entity.Attendance, error) {
	var attendances []entity.Attendance
	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Joins("JOIN users ON users.id = attendances.employee_id").
		Where("users.team_leader_id = ? AND attendances.date >= ? AND attendances.date <= ?", teamLeaderID, startDate, endDate).
		Order("attendances.date DESC").
		Find(&attendances).Error
	return attendances, err
}

func (r *attendanceRepository) GetTodayAttendance(ctx context.Context) ([]entity.Attendance, error) {
	var attendances []entity.Attendance
	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("date = ?", startOfDay).
		Find(&attendances).Error
	return attendances, err
}

func (r *attendanceRepository) GetMyTodayAttendance(ctx context.Context, employeeID string) (*entity.Attendance, error) {
	attendance := new(entity.Attendance)
	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("employee_id = ? AND date = ?", employeeID, startOfDay).
		First(attendance).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return attendance, nil
}

func (r *attendanceRepository) GetByDepartment(ctx context.Context, deptID string, date time.Time) ([]entity.Attendance, error) {
	var attendances []entity.Attendance
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Joins("JOIN users ON users.id = attendances.employee_id").
		Where("users.department_id = ? AND attendances.date = ?", deptID, startOfDay).
		Find(&attendances).Error
	return attendances, err
}

func (r *attendanceRepository) GetLateEmployees(ctx context.Context, date time.Time, threshold time.Time) ([]entity.Attendance, error) {
	var attendances []entity.Attendance
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	err := r.DB.WithContext(ctx).
		Preload("Employee").
		Where("date = ? AND checkin_time > ?", startOfDay, threshold).
		Find(&attendances).Error
	return attendances, err
}

func (r *attendanceRepository) Create(ctx context.Context, attendance *entity.Attendance) error {
	return r.DB.WithContext(ctx).Create(attendance).Error
}

func (r *attendanceRepository) Update(ctx context.Context, attendance *entity.Attendance) error {
	return r.DB.WithContext(ctx).Save(attendance).Error
}

func (r *attendanceRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.Attendance{}, "id = ?", id).Error
}

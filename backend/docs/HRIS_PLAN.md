# HRIS System Implementation Plan

## Overview
This document outlines the implementation of the HRIS (Human Resource Information System) backend using Go with PostgreSQL.

## Entities Created

### 1. User (Extended)
- **File**: `backend/entity/user.entity.go`
- **New Roles Added**:
  - `HR_ADMIN` - Full access to HR functions
  - `MANAGER` - Team management access
  - `EMPLOYEE` - Standard employee access

### 2. Department
- **File**: `backend/entity/department.entity.go`
- **Fields**: id, name, description, timestamps

### 3. Position
- **File**: `backend/entity/position.entity.go`
- **Fields**: id, name, level (1-5)
- **Levels**: Junior(1), Mid(2), Senior(3), Lead(4), Manager(5)

### 4. Employee
- **File**: `backend/entity/employee.entity.go`
- **Fields**: id, user_id, nip, name, email, phone, address, department_id, position_id, join_date, status, photo, manager_id, basic_salary, allowance

### 5. Attendance
- **File**: `backend/entity/attendance.entity.go`
- **Work Types**: WFO (Work From Office), WFH (Work From Home), WFA (Work From Anywhere)
- **Status**: PRESENT, LATE, OUTSIDE_RADIUS, ABSENT, ON_LEAVE
- **Fields**: 
  - Check-in: time, photo, lat, long, radius
  - Check-out: time, photo, lat, long
  - work_type, status, notes

### 6. Daily Report
- **File**: `backend/entity/daily_report.entity.go`
- **Status**: PENDING, APPROVED, REJECTED

### 7. Daily Report Item
- **File**: `backend/entity/daily_report_item.entity.go`
- **Task Status**: PENDING, ON_PROGRESS, COMPLETED, CANCELLED
- **Fields**: title, description, progress (0-100)

### 8. Leave Request
- **File**: `backend/entity/leave_request.entity.go`
- **Leave Types**: ANNUAL, SICK, PERSONAL, MATERNITY, PATERNITY, UNPAID
- **Status**: PENDING, APPROVED, REJECTED, CANCELLED

### 9. Payroll
- **File**: `backend/entity/payroll.entity.go`
- **Income**: basic_salary, allowance, bonus, overtime
- **Deductions**: late_deduction, absent_deduction, bpjs, tht, tax, other_deduction
- **Calculated**: total_income, total_deduction, net_salary
- **Summary**: work_days, present_days, late_days, absent_days, leave_days

## Migration
- **File**: `backend/cmd/migrate/main.go`
- All entities are registered in AutoMigrate
- Sample data seeding included

## Sample Data

### Departments
- Engineering
- Human Resources
- Marketing
- Sales
- Finance

### Positions
- Junior Developer, Mid Developer, Senior Developer, Tech Lead
- Engineering Manager
- HR Manager, HR Staff
- Marketing Manager, Marketing Staff
- Sales Manager, Sales Staff
- Finance Manager, Finance Staff

### Users (Login Credentials: password123)
| Name | Email | Role |
|------|-------|------|
| Budi Santoso | budi@hris.com | HR_ADMIN |
| Ani Wijaya | ani@hris.com | MANAGER |
| Joko Pramono | joko@hris.com | MANAGER |
| Siti Rahayu | siti@hris.com | EMPLOYEE |
| Rudi Hermawan | rudi@hris.com | EMPLOYEE |
| Dewi Lestari | dewi@hris.com | EMPLOYEE |
| Ahmad Fauzi | ahmad@hris.com | EMPLOYEE |
| Lisa Permata | lisa@hris.com | EMPLOYEE |

### Sample Attendance
- Today's attendance records for some employees
- Mix of WFO and WFH
- Some late arrivals recorded

### Sample Daily Reports
- Reports with multiple tasks
- Progress tracking (0-100%)
- Status: PENDING

### Sample Leave Requests
- Approved annual leave
- Approved sick leave
- Pending personal leave

### Sample Payroll
- Current month payroll for all employees
- Calculated based on salary + allowance - deductions

## Database Schema

```
departments
├── id (UUID)
├── name (VARCHAR)
├── description (TEXT)
├── created_at, updated_at, deleted_at

positions
├── id (UUID)
├── name (VARCHAR)
├── level (INTEGER)
├── created_at, updated_at, deleted_at

employees
├── id (UUID)
├── user_id (UUID, FK)
├── nip (VARCHAR, unique)
├── name, email, phone, address
├── department_id (UUID, FK)
├── position_id (UUID, FK)
├── join_date (DATE)
├── status (ACTIVE/INACTIVE/RESIGNED)
├── photo (VARCHAR)
├── manager_id (UUID, FK, self-ref)
├── basic_salary, allowance
├── created_at, updated_at, deleted_at

attendance
├── id (UUID)
├── employee_id (UUID, FK)
├── date (DATE)
├── checkin_time, checkin_photo, checkin_lat, checkin_long, checkin_radius
├── checkout_time, checkout_photo, checkout_lat, checkout_long
├── work_type (WFO/WFH/WFA)
├── status (PRESENT/LATE/OUTSIDE_RADIUS/ABSENT/ON_LEAVE)
├── notes
├── created_at, updated_at, deleted_at

daily_reports
├── id (UUID)
├── employee_id (UUID, FK)
├── date (DATE)
├── notes (TEXT)
├── status (PENDING/APPROVED/REJECTED)
├── approved_by (UUID, FK)
├── approved_at (TIMESTAMP)
├── created_at, updated_at, deleted_at

daily_report_items
├── id (UUID)
├── report_id (UUID, FK)
├── title (VARCHAR)
├── description (TEXT)
├── progress (INTEGER 0-100)
├── status (PENDING/ON_PROGRESS/COMPLETED/CANCELLED)
├── created_at, updated_at, deleted_at

leave_requests
├── id (UUID)
├── employee_id (UUID, FK)
├── leave_type (ANNUAL/SICK/PERSONAL/etc)
├── start_date, end_date (DATE)
├── reason (TEXT)
├── status (PENDING/APPROVED/REJECTED/CANCELLED)
├── approved_by (UUID, FK)
├── approved_at (TIMESTAMP)
├── created_at, updated_at, deleted_at

payroll
├── id (UUID)
├── employee_id (UUID, FK)
├── period (YYYY-MM)
├── basic_salary, allowance, bonus, overtime
├── late_deduction, absent_deduction, bpjs, tht, tax, other_deduction
├── total_income, total_deduction, net_salary
├── work_days, present_days, late_days, absent_days, leave_days
├── is_paid, paid_at
├── notes
├── created_at, updated_at, deleted_at
```

## Next Steps
1. Run migration: `go run cmd/migrate/main.go`
2. Implement API handlers for each module
3. Implement service layer
4. Implement repository layer
5. Connect frontend to backend

## Technology Stack
- **Backend**: Go with Fiber framework
- **Database**: PostgreSQL
- **ORM**: GORM
- **Authentication**: JWT

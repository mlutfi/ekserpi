package main

import (
	"fmt"
	"log"
	"os"
	"reflect"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"hris_backend/entity"
)

// ColumnInfo holds information about a database column from information_schema
type ColumnInfo struct {
	ColumnName string
	DataType   string
	IsNullable string
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Read DB config from environment variables
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "")
	dbname := getEnv("DB_NAME", "postgres")
	sslmode := getEnv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		host, user, password, dbname, port, sslmode,
	)

	fmt.Println("╔══════════════════════════════════════════════════╗")
	fmt.Println("║            HRIS Migration Tool                  ║")
	fmt.Println("╚══════════════════════════════════════════════════╝")
	fmt.Println()
	fmt.Printf("→ Connecting to database: host=%s port=%s dbname=%s\n", host, port, dbname)

	// Open GORM connection
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: gormlogger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			gormlogger.Config{
				SlowThreshold:             5 * time.Second,
				LogLevel:                  gormlogger.Warn,
				IgnoreRecordNotFoundError: true,
				Colorful:                  true,
			},
		),
	})
	if err != nil {
		log.Fatalf("✗ Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("✗ Failed to get underlying sql.DB: %v", err)
	}
	defer sqlDB.Close()

	fmt.Println("✓ Database connected successfully.")
	fmt.Println()

	// ──────────────────────────────────────────────────────────────────
	// STEP 0.5: Pre-migration FK Cleanup
	// ──────────────────────────────────────────────────────────────────
	fmt.Println("━━━ Step 0.5: Pre-migration FK Cleanup ━━━")
	if db.Migrator().HasTable("employees") {
		// Drop old constraints that reference the employees table
		dropConstraints := map[string][]string{
			"attendance":     {"fk_attendance_employee"},
			"daily_reports":  {"fk_daily_reports_employee"},
			"leave_requests": {"fk_leave_requests_employee", "fk_leave_requests_approver"},
			"payroll":        {"fk_payroll_employee"},
		}
		for table, constraints := range dropConstraints {
			for _, constraint := range constraints {
				if db.Migrator().HasConstraint(table, constraint) {
					err := db.Migrator().DropConstraint(table, constraint)
					if err != nil {
						fmt.Printf("  ⚠ Failed to drop constraint %s on %s: %v\n", constraint, table, err)
					} else {
						fmt.Printf("  ✓ Dropped constraint %s on %s\n", constraint, table)
					}
				}
			}
		}

		// Update data: replace employee.id with employee.user_id in dependent tables
		queries := []string{
			`UPDATE attendance SET employee_id = e.user_id FROM employees e WHERE attendance.employee_id = e.id`,
			`UPDATE daily_reports SET employee_id = e.user_id FROM employees e WHERE daily_reports.employee_id = e.id`,
			`UPDATE leave_requests SET employee_id = e.user_id FROM employees e WHERE leave_requests.employee_id = e.id`,
			`UPDATE leave_requests SET approved_by = e.user_id FROM employees e WHERE leave_requests.approved_by = e.id`,
			`UPDATE payroll SET employee_id = e.user_id FROM employees e WHERE payroll.employee_id = e.id`,
		}
		for _, q := range queries {
			if err := db.Exec(q).Error; err != nil {
				fmt.Printf("  ⚠ Failed to update FK data: %v\n", err)
			}
		}
		fmt.Println("  ✓ Pre-migration data updated")
	} else {
		fmt.Println("  - Employees table not found, skipping pre-migration")
	}
	fmt.Println()

	// ──────────────────────────────────────────────────────────────────
	// STEP 0.7: Prepare for Multi-Location
	// ──────────────────────────────────────────────────────────────────
	fmt.Println("━━━ Step 0.7: Prepare for Multi-Location ━━━")
	// 1. Create locations table if not exists
	if err := db.AutoMigrate(&entity.Location{}); err != nil {
		log.Fatalf("  ✗ Failed to create locations table: %v", err)
	}

	// 2. Create default location
	var defaultLoc entity.Location
	if err := db.Where("name = ?", "Gudang Utama").First(&defaultLoc).Error; err != nil {
		defaultLoc = entity.Location{
			Name:     "Gudang Utama",
			Type:     entity.LocationTypeWarehouse,
			IsActive: true,
		}
		if err := db.Create(&defaultLoc).Error; err != nil {
			log.Fatalf("  ✗ Failed to create default location: %v", err)
		}
		fmt.Printf("  ✓ Created default location: %s (%s)\n", defaultLoc.Name, defaultLoc.ID)
	} else {
		fmt.Printf("  - Default location exists: %s (%s)\n", defaultLoc.Name, defaultLoc.ID)
	}

	// 3. Add location_id column as NULLABLE first to existing tables if missing
	tablesToUpdate := []string{"sales", "stock_ins", "stock_outs", "inventories", "stock_movements"}
	for _, table := range tablesToUpdate {
		if db.Migrator().HasTable(table) && !db.Migrator().HasColumn(table, "location_id") {
			// Manually add column as nullable
			query := fmt.Sprintf("ALTER TABLE %s ADD COLUMN location_id VARCHAR(255)", table)
			if err := db.Exec(query).Error; err != nil {
				fmt.Printf("  ⚠ Failed to add location_id to %s: %v\n", table, err)
			} else {
				fmt.Printf("  ✓ Added location_id column to %s\n", table)
			}
		}

		// 4. Update NULL location_id with default
		query := fmt.Sprintf("UPDATE %s SET location_id = '%s' WHERE location_id IS NULL", table, defaultLoc.ID)
		if err := db.Exec(query).Error; err != nil {
			fmt.Printf("  ⚠ Failed to update location_id in %s: %v\n", table, err)
		} else {
			fmt.Printf("  ✓ Updated existing records in %s with default location\n", table)
		}
	}
	fmt.Println()

	// ──────────────────────────────────────────────────────────────────
	// STEP 1: Run AutoMigrate (adds tables & missing columns safely)
	// ──────────────────────────────────────────────────────────────────
	fmt.Println("━━━ Step 1: Schema Migration (AutoMigrate) ━━━")

	entities := []interface{}{
		&entity.User{},
		&entity.Category{},
		&entity.Product{},
		&entity.Inventory{},
		&entity.Sale{},
		&entity.SaleItem{},
		&entity.Payment{},
		&entity.StockIn{},
		&entity.StockOut{},
		&entity.StockMovement{},
		&entity.ReceiptTemplate{},
		&entity.Setting{},
		&entity.Location{},
		&entity.Supplier{},
		&entity.PurchaseOrder{},
		&entity.PurchaseOrderItem{},
		&entity.StockTransfer{},
		&entity.StockTransferItem{},
		&entity.StockOpname{},
		&entity.StockOpnameItem{},
		// HRIS Entities
		&entity.Department{},
		&entity.Position{},
		&entity.Attendance{},
		&entity.DailyReport{},
		&entity.DailyReportItem{},
		&entity.LeaveRequest{},
		&entity.Payroll{},
	}

	err = db.AutoMigrate(entities...)
	if err != nil {
		log.Fatalf("✗ Migration failed: %v", err)
	}
	fmt.Println("✓ AutoMigrate completed successfully!")
	fmt.Println()

	// ──────────────────────────────────────────────────────────────────
	// STEP 1.5: Migrate Employee Data to User table
	// ──────────────────────────────────────────────────────────────────
	fmt.Println("━━━ Step 1.5: Data Migration (Employee -> User) ━━━")
	if db.Migrator().HasTable("employees") {
		fmt.Println("  → Migrating employee data to users table...")

		updateQuery := `
			UPDATE users 
			SET 
				nip = e.nip,
				phone = e.phone,
				address = e.address,
				department_id = e.department_id,
				position_id = e.position_id,
				join_date = e.join_date,
				employee_type = e.employee_type,
				status = e.status,
				photo = e.photo,
				manager_id = e.manager_id,
				basic_salary = e.basic_salary,
				allowance = e.allowance
			FROM employees e
			WHERE users.id = e.user_id
		`
		if err := db.Exec(updateQuery).Error; err != nil {
			fmt.Printf("  ⚠ Failed to migrate employee data: %v\n", err)
		} else {
			fmt.Println("  ✓ Employee data migrated successfully")

			// Drop employees table
			if err := db.Migrator().DropTable("employees"); err != nil {
				fmt.Printf("  ⚠ Failed to drop employees table: %v\n", err)
			} else {
				fmt.Println("  ✓ Dropped employees table")
			}
		}
	} else {
		fmt.Println("  - Employees table not found, skipping migration")
	}
	fmt.Println()

	// ──────────────────────────────────────────────────────────────────
	// STEP 2: Verify columns match entity definitions
	// ──────────────────────────────────────────────────────────────────
	fmt.Println("━━━ Step 2: Column Verification ━━━")
	verifyAllColumns(db, entities)
	fmt.Println()

	// ──────────────────────────────────────────────────────────────────
	// STEP 3: Seed default owner user
	// ──────────────────────────────────────────────────────────────────
	fmt.Println("━━━ Step 3: Seed Default Owner ━━━")
	seedOwnerUser(db)
	fmt.Println()

	// ──────────────────────────────────────────────────────────────────
	// STEP 4: Seed HRIS data
	// ──────────────────────────────────────────────────────────────────
	fmt.Println("━━━ Step 4: Seed HRIS Data ━━━")
	seedHRISData(db)
	fmt.Println()

	fmt.Println("╔══════════════════════════════════════════════════╗")
	fmt.Println("║         ✓ Migration completed successfully!     ║")
	fmt.Println("╚══════════════════════════════════════════════════╝")
}

// ──────────────────────────────────────────────────────────────────────
// COLUMN VERIFICATION
// ──────────────────────────────────────────────────────────────────────

// getTableName extracts the table name from a GORM model
func getTableName(model interface{}) string {
	if tn, ok := model.(interface{ TableName() string }); ok {
		return tn.TableName()
	}
	return ""
}

// getExpectedColumns extracts column names from GORM struct tags
func getExpectedColumns(model interface{}) []string {
	var columns []string
	t := reflect.TypeOf(model)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		gormTag := field.Tag.Get("gorm")
		if gormTag == "" || gormTag == "-" {
			continue
		}

		parts := strings.Split(gormTag, ";")
		for _, part := range parts {
			if strings.HasPrefix(part, "column:") {
				col := strings.TrimPrefix(part, "column:")
				columns = append(columns, col)
				break
			}
		}
	}
	return columns
}

// getDBColumns fetches actual columns from database information_schema
func getDBColumns(db *gorm.DB, tableName string) (map[string]bool, error) {
	var columns []ColumnInfo
	err := db.Raw(`
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_name = ? AND table_schema = 'public'
		ORDER BY ordinal_position
	`, tableName).Scan(&columns).Error
	if err != nil {
		return nil, err
	}

	result := make(map[string]bool)
	for _, col := range columns {
		result[col.ColumnName] = true
	}
	return result, nil
}

// verifyAllColumns checks that all entity columns exist in the database
func verifyAllColumns(db *gorm.DB, entities []interface{}) {
	allMatch := true

	for _, e := range entities {
		// Dereference pointer
		model := e
		v := reflect.ValueOf(e)
		if v.Kind() == reflect.Ptr {
			model = v.Elem().Interface()
		}

		tableName := getTableName(e)
		if tableName == "" {
			continue
		}

		expectedCols := getExpectedColumns(model)
		dbCols, err := getDBColumns(db, tableName)
		if err != nil {
			fmt.Printf("  ⚠ Could not verify table '%s': %v\n", tableName, err)
			allMatch = false
			continue
		}

		missing := []string{}
		for _, col := range expectedCols {
			if !dbCols[col] {
				missing = append(missing, col)
			}
		}

		if len(missing) > 0 {
			fmt.Printf("  ⚠ Table '%s': missing columns: %s\n", tableName, strings.Join(missing, ", "))
			allMatch = false
		} else {
			fmt.Printf("  ✓ Table '%s': all %d columns verified\n", tableName, len(expectedCols))
		}
	}

	if allMatch {
		fmt.Println("✓ All table columns verified successfully!")
	} else {
		fmt.Println("⚠ Some columns are missing. AutoMigrate may not have added them. Please check entity definitions.")
	}
}

// ──────────────────────────────────────────────────────────────────────
// SEED FUNCTIONS (all idempotent using FirstOrCreate)
// ──────────────────────────────────────────────────────────────────────

func seedOwnerUser(db *gorm.DB) {
	var existingOwner entity.User
	result := db.Where("role = ?", entity.RoleOwner).First(&existingOwner)
	if result.Error == nil {
		fmt.Printf("  ✓ Owner user already exists: %s (skipping)\n", existingOwner.Email)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("  ⚠ Failed to hash password: %v (skipping)\n", err)
		return
	}

	hashedStr := string(hashedPassword)
	ownerUser := entity.User{
		Name:               "Administrator",
		Email:              "admin@admin.com",
		PasswordHash:       &hashedStr,
		Role:               entity.RoleOwner,
		MustChangePassword: true,
	}

	if err := db.Create(&ownerUser).Error; err != nil {
		fmt.Printf("  ⚠ Failed to create owner user: %v (skipping)\n", err)
		return
	}
	fmt.Println("  ✓ Created default owner: admin@admin.com / admin123")
}

// ──────────────────────────────────────────────────────────────────────
// SEED HRIS DATA
// ──────────────────────────────────────────────────────────────────────

func seedHRISData(db *gorm.DB) {
	// ── Departments ──
	fmt.Println("  → Seeding departments...")
	departments := []entity.Department{
		{Name: "Engineering", Description: "Software Development and IT"},
		{Name: "Human Resources", Description: "HR and People Operations"},
		{Name: "Marketing", Description: "Marketing and Communications"},
		{Name: "Sales", Description: "Sales and Business Development"},
		{Name: "Finance", Description: "Finance and Accounting"},
	}
	for i := range departments {
		result := db.Where("name = ?", departments[i].Name).FirstOrCreate(&departments[i])
		if result.RowsAffected > 0 {
			fmt.Printf("    ✓ Created department: %s\n", departments[i].Name)
		} else {
			fmt.Printf("    - Department exists: %s (skipping)\n", departments[i].Name)
		}
	}

	// ── Positions ──
	fmt.Println("  → Seeding positions...")
	positions := []entity.Position{
		{Name: "Junior Developer", Level: 1},
		{Name: "Mid Developer", Level: 2},
		{Name: "Senior Developer", Level: 3},
		{Name: "Tech Lead", Level: 4},
		{Name: "Engineering Manager", Level: 5},
		{Name: "HR Manager", Level: 5},
		{Name: "HR Staff", Level: 2},
		{Name: "Marketing Manager", Level: 5},
		{Name: "Marketing Staff", Level: 2},
		{Name: "Sales Manager", Level: 5},
		{Name: "Sales Staff", Level: 2},
		{Name: "Finance Manager", Level: 5},
		{Name: "Finance Staff", Level: 2},
	}
	for i := range positions {
		result := db.Where("name = ?", positions[i].Name).FirstOrCreate(&positions[i])
		if result.RowsAffected > 0 {
			fmt.Printf("    ✓ Created position: %s\n", positions[i].Name)
		} else {
			fmt.Printf("    - Position exists: %s (skipping)\n", positions[i].Name)
		}
	}

	// ── Load references for seeding ──
	var engDept, hrDept, salesDept entity.Department
	db.Where("name = ?", "Engineering").First(&engDept)
	db.Where("name = ?", "Human Resources").First(&hrDept)
	db.Where("name = ?", "Sales").First(&salesDept)

	var juniorDev, midDev, seniorDev, engManager entity.Position
	var hrManager, hrStaff entity.Position
	var salesManager, salesStaff entity.Position

	db.Where("name = ?", "Junior Developer").First(&juniorDev)
	db.Where("name = ?", "Mid Developer").First(&midDev)
	db.Where("name = ?", "Senior Developer").First(&seniorDev)
	db.Where("name = ?", "Engineering Manager").First(&engManager)
	db.Where("name = ?", "HR Manager").First(&hrManager)
	db.Where("name = ?", "HR Staff").First(&hrStaff)
	db.Where("name = ?", "Sales Manager").First(&salesManager)
	db.Where("name = ?", "Sales Staff").First(&salesStaff)

	// ── HRIS Users (Employees) ──
	fmt.Println("  → Seeding HRIS users (employees)...")
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	hashedStr := string(hashedPassword)
	joinDate := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)

	type hrisSeed struct {
		name        string
		email       string
		role        entity.Role
		nip         string
		deptID      string
		posID       string
		managerIdx  int // -1 = no manager
		basicSalary float64
		allowance   float64
	}

	hrisSeeds := []hrisSeed{
		{"Budi Santoso", "budi@hris.com", entity.RoleHRAdmin, "EMP001", hrDept.ID, hrManager.ID, -1, 15000000, 3000000},
		{"Ani Wijaya", "ani@hris.com", entity.RoleManager, "EMP002", engDept.ID, engManager.ID, -1, 25000000, 5000000},
		{"Joko Pramono", "joko@hris.com", entity.RoleManager, "EMP003", salesDept.ID, salesManager.ID, -1, 20000000, 4000000},
		{"Siti Rahayu", "siti@hris.com", entity.RoleEmployee, "EMP004", hrDept.ID, hrStaff.ID, 0, 8000000, 1500000},
		{"Rudi Hermawan", "rudi@hris.com", entity.RoleEmployee, "EMP005", engDept.ID, seniorDev.ID, 1, 18000000, 3500000},
		{"Dewi Lestari", "dewi@hris.com", entity.RoleEmployee, "EMP006", engDept.ID, midDev.ID, 1, 12000000, 2500000},
		{"Ahmad Fauzi", "ahmad@hris.com", entity.RoleEmployee, "EMP007", engDept.ID, juniorDev.ID, 1, 7000000, 1500000},
		{"Lisa Permata", "lisa@hris.com", entity.RoleEmployee, "EMP008", salesDept.ID, salesStaff.ID, 2, 6000000, 1200000},
	}

	var createdEmployees []entity.User
	var createdUsers []entity.User
	for i, s := range hrisSeeds {
		var managerID *string
		if s.managerIdx >= 0 && s.managerIdx < len(createdEmployees) {
			mid := createdEmployees[s.managerIdx].ID
			managerID = &mid
		}

		nipCopy := s.nip

		var user entity.User
		result := db.Where("email = ?", s.email).FirstOrCreate(&user, entity.User{
			Name:               s.name,
			Email:              s.email,
			PasswordHash:       &hashedStr,
			Role:               s.role,
			MustChangePassword: true,
			NIP:                &nipCopy,
			Phone:              fmt.Sprintf("08123456789%d", i),
			DepartmentID:       &s.deptID,
			PositionID:         &s.posID,
			JoinDate:           &joinDate,
			EmployeeType:       entity.EmployeeTypePKWTT,
			Status:             entity.EmployeeStatusActive,
			ManagerID:          managerID,
			BasicSalary:        s.basicSalary,
			Allowance:          s.allowance,
		})
		if result.RowsAffected > 0 {
			fmt.Printf("    ✓ Created HRIS user: %s (%s)\n", s.name, s.role)
		} else {
			fmt.Printf("    - HRIS user exists: %s (skipping)\n", s.email)
		}
		createdEmployees = append(createdEmployees, user)
		createdUsers = append(createdUsers, user)
	}

	// ── Attendance ──
	fmt.Println("  → Seeding attendance...")
	today := time.Now()
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.UTC)
	checkInTime := time.Date(today.Year(), today.Month(), today.Day(), 8, 55, 0, 0, time.UTC)
	checkOutTime := time.Date(today.Year(), today.Month(), today.Day(), 17, 5, 0, 0, time.UTC)

	type attSeed struct {
		empIdx   int
		workType entity.WorkType
		status   entity.AttendanceStatus
		hasOut   bool
	}

	attSeeds := []attSeed{
		{1, entity.WorkTypeWFO, entity.AttendanceStatusPresent, true},
		{4, entity.WorkTypeWFO, entity.AttendanceStatusLate, false},
		{5, entity.WorkTypeWFH, entity.AttendanceStatusPresent, true},
		{6, entity.WorkTypeWFO, entity.AttendanceStatusPresent, true},
	}

	for _, a := range attSeeds {
		if a.empIdx >= len(createdEmployees) {
			continue
		}
		empID := createdEmployees[a.empIdx].ID
		if empID == "" {
			continue
		}

		var att entity.Attendance
		result := db.Where("employee_id = ? AND date = ?", empID, todayDate).FirstOrCreate(&att, entity.Attendance{
			EmployeeID:  empID,
			Date:        todayDate,
			WorkType:    a.workType,
			Status:      a.status,
			CheckInTime: &checkInTime,
		})

		if result.RowsAffected > 0 {
			if a.hasOut {
				db.Model(&att).Update("checkout_time", checkOutTime)
			}
			fmt.Printf("    ✓ Created attendance for: %s\n", createdEmployees[a.empIdx].Name)
		} else {
			fmt.Printf("    - Attendance exists for: %s (skipping)\n", createdEmployees[a.empIdx].Name)
		}
	}

	// ── Daily Reports ──
	fmt.Println("  → Seeding daily reports...")
	for _, idx := range []int{1, 2, 3} {
		if idx >= len(createdEmployees) {
			continue
		}
		emp := createdEmployees[idx]
		if emp.ID == "" {
			continue
		}

		var report entity.DailyReport
		result := db.Where("employee_id = ? AND date = ?", emp.ID, todayDate).FirstOrCreate(&report, entity.DailyReport{
			EmployeeID: emp.ID,
			Date:       todayDate,
			Notes:      "Daily work report for " + todayDate.Format("2006-01-02"),
			Status:     entity.DailyReportStatusPending,
		})

		if result.RowsAffected > 0 {
			// Add items
			items := []entity.DailyReportItem{
				{ReportID: report.ID, Title: "Task 1: Code Review", Description: "Review pull requests from team", Progress: 100, Status: entity.TaskStatusCompleted},
				{ReportID: report.ID, Title: "Task 2: Feature Development", Description: "Implement new feature", Progress: 70, Status: entity.TaskStatusOnProgress},
				{ReportID: report.ID, Title: "Task 3: Bug Fixing", Description: "Fix login issue", Progress: 50, Status: entity.TaskStatusOnProgress},
			}
			for _, item := range items {
				db.Create(&item)
			}
			fmt.Printf("    ✓ Created daily report for: %s\n", emp.Name)
		} else {
			fmt.Printf("    - Daily report exists for: %s (skipping)\n", emp.Name)
		}
	}

	// ── Leave Requests ──
	fmt.Println("  → Seeding leave requests...")
	type leaveSeed struct {
		empIdx    int
		leaveType entity.LeaveType
		startDay  int
		endDay    int
		reason    string
		status    entity.LeaveStatus
	}

	leaveSeeds := []leaveSeed{
		{3, entity.LeaveTypeAnnual, 7, 9, "Family vacation", entity.LeaveStatusApproved},
		{4, entity.LeaveTypeSick, -2, -1, "Doctor appointment", entity.LeaveStatusApproved},
		{5, entity.LeaveTypePersonal, 3, 3, "Personal matters", entity.LeaveStatusPending},
	}

	for _, lr := range leaveSeeds {
		if lr.empIdx >= len(createdEmployees) {
			continue
		}
		emp := createdEmployees[lr.empIdx]
		if emp.ID == "" {
			continue
		}

		startDate := todayDate.AddDate(0, 0, lr.startDay)
		endDate := todayDate.AddDate(0, 0, lr.endDay)

		var leave entity.LeaveRequest
		result := db.Where("employee_id = ? AND start_date = ?", emp.ID, startDate).FirstOrCreate(&leave, entity.LeaveRequest{
			EmployeeID: emp.ID,
			LeaveType:  lr.leaveType,
			StartDate:  startDate,
			EndDate:    endDate,
			Reason:     lr.reason,
			Status:     lr.status,
		})

		if result.RowsAffected > 0 {
			if lr.status == entity.LeaveStatusApproved && len(createdUsers) > 0 {
				approverID := createdUsers[0].ID
				now := time.Now()
				db.Model(&leave).Updates(map[string]interface{}{
					"approved_by": approverID,
					"approved_at": now,
				})
			}
			fmt.Printf("    ✓ Created leave request for: %s\n", emp.Name)
		} else {
			fmt.Printf("    - Leave request exists for: %s (skipping)\n", emp.Name)
		}
	}

	// ── Payroll ──
	fmt.Println("  → Seeding payroll...")
	period := time.Now().Format("2006-01")
	for _, emp := range createdEmployees {
		if emp.ID == "" {
			continue
		}

		totalIncome := emp.BasicSalary + emp.Allowance
		totalDeduction := 500000.0
		netSalary := totalIncome - totalDeduction

		var payroll entity.Payroll
		result := db.Where("employee_id = ? AND period = ?", emp.ID, period).FirstOrCreate(&payroll, entity.Payroll{
			EmployeeID:      emp.ID,
			Period:          period,
			BasicSalary:     emp.BasicSalary,
			Allowance:       emp.Allowance,
			Bonus:           0,
			Overtime:        0,
			LateDeduction:   0,
			AbsentDeduction: 0,
			BPJS:            300000,
			THT:             200000,
			Tax:             0,
			OtherDeduction:  0,
			TotalIncome:     totalIncome,
			TotalDeduction:  totalDeduction,
			NetSalary:       netSalary,
			WorkDays:        22,
			PresentDays:     20,
			LateDays:        1,
			AbsentDays:      1,
			LeaveDays:       0,
			IsPaid:          false,
		})

		if result.RowsAffected > 0 {
			fmt.Printf("    ✓ Created payroll for: %s\n", emp.Name)
		} else {
			fmt.Printf("    - Payroll exists for: %s (skipping)\n", emp.Name)
		}
	}

	fmt.Println("  ✓ HRIS data seeding completed!")
}

// ──────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

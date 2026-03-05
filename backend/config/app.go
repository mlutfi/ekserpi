package config

import (
	"hris_backend/app/attendance"
	"hris_backend/app/auth"
	"hris_backend/app/category"
	"hris_backend/app/dailyreport"
	"hris_backend/app/department"
	"hris_backend/app/employee"
	"hris_backend/app/leave"
	"hris_backend/app/payroll"
	"hris_backend/app/position"
	"hris_backend/app/product"
	"hris_backend/app/report"
	"hris_backend/app/sale"
	"hris_backend/app/setting"
	"hris_backend/app/stock"
	"hris_backend/app/user"
	"hris_backend/middleware"
	"hris_backend/route"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

type BootstrapConfig struct {
	DB       *gorm.DB
	App      *fiber.App
	Log      *logrus.Logger
	Validate *validator.Validate
	Config   *viper.Viper
}

func Bootstrap(config *BootstrapConfig) {
	// POS Repositories
	authRepository := auth.NewAuthRepository(config.DB)
	productRepository := product.NewProductRepository(config.DB)
	categoryRepository := category.NewCategoryRepository(config.DB)
	saleRepository := sale.NewSaleRepository(config.DB)
	userRepository := user.NewUserRepository(config.DB)
	reportRepository := report.NewReportRepository(config.DB)
	stockRepository := stock.NewStockRepository(config.DB)
	settingRepository := setting.NewSettingRepository(config.DB)

	// HRIS Repositories
	employeeRepository := employee.NewEmployeeRepository(config.DB)
	attendanceRepository := attendance.NewAttendanceRepository(config.DB)
	leaveRepository := leave.NewLeaveRepository(config.DB)
	dailyReportRepository := dailyreport.NewDailyReportRepository(config.DB)
	payrollRepository := payroll.NewPayrollRepository(config.DB)
	departmentRepository := department.NewDepartmentRepository(config.DB)
	positionRepository := position.NewPositionRepository(config.DB)

	// POS Use Cases
	authUseCase := auth.NewAuthUseCase(config.DB, authRepository, config.Config)
	productUseCase := product.NewProductUseCase(config.DB, productRepository)
	categoryUseCase := category.NewCategoryUseCase(config.DB, categoryRepository)
	saleUseCase := sale.NewSaleUseCase(config.DB, saleRepository, config.Config)
	userUseCase := user.NewUserUseCase(config.DB, userRepository)
	reportUseCase := report.NewReportUseCase(config.DB, reportRepository)
	stockUseCase := stock.NewStockUseCase(config.DB, stockRepository)
	settingUseCase := setting.NewSettingUseCase(settingRepository)

	// HRIS Use Cases
	employeeUseCase := employee.NewEmployeeUseCase(config.DB, employeeRepository)
	attendanceUseCase := attendance.NewAttendanceUseCase(config.DB, attendanceRepository)
	leaveUseCase := leave.NewLeaveUseCase(config.DB, leaveRepository)
	dailyReportUseCase := dailyreport.NewDailyReportUseCase(config.DB, dailyReportRepository)
	payrollUseCase := payroll.NewPayrollUseCase(config.DB, payrollRepository)
	departmentUseCase := department.NewDepartmentUseCase(config.DB, departmentRepository)
	positionUseCase := position.NewPositionUseCase(config.DB, positionRepository)

	// POS Handlers
	authHandler := auth.NewAuthHandler(authUseCase, config.DB)
	productHandler := product.NewProductHandler(productUseCase)
	categoryHandler := category.NewCategoryHandler(categoryUseCase)
	saleHandler := sale.NewSaleHandler(saleUseCase)
	userHandler := user.NewUserHandler(userUseCase)
	reportHandler := report.NewReportHandler(reportUseCase)
	stockHandler := stock.NewStockHandler(stockUseCase)
	settingHandler := setting.NewSettingHandler(settingUseCase, config.Validate)

	// HRIS Handlers
	employeeHandler := employee.NewEmployeeHandler(employeeUseCase)
	attendanceHandler := attendance.NewAttendanceHandler(attendanceUseCase, config.DB)
	leaveHandler := leave.NewLeaveHandler(leaveUseCase)
	dailyReportHandler := dailyreport.NewDailyReportHandler(dailyReportUseCase, config.DB)
	payrollHandler := payroll.NewPayrollHandler(payrollUseCase, config.DB)
	departmentHandler := department.NewDepartmentHandler(departmentUseCase)
	positionHandler := position.NewPositionHandler(positionUseCase)

	// Middleware
	authMiddleware := middleware.AuthMiddleware(config.Config)

	// Routes
	routeConfig := route.RouteConfig{
		App:             config.App,
		AuthMiddleware:  authMiddleware,
		AuthHandler:     authHandler,
		ProductHandler:  productHandler,
		CategoryHandler: categoryHandler,
		SaleHandler:     saleHandler,
		UserHandler:     userHandler,
		ReportHandler:   reportHandler,
		StockHandler:    stockHandler,
		SettingHandler:  settingHandler,
		Config:          config.Config,
		// HRIS Handlers
		EmployeeHandler:    employeeHandler,
		AttendanceHandler:  attendanceHandler,
		LeaveHandler:       leaveHandler,
		DailyReportHandler: dailyReportHandler,
		PayrollHandler:     payrollHandler,
		DepartmentHandler:  departmentHandler,
		PositionHandler:    positionHandler,
	}

	routeConfig.Setup()
}

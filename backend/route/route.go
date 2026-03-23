package route

import (
	"hris_backend/app/asset"
	"hris_backend/app/attendance"
	"hris_backend/app/auth"
	"hris_backend/app/category"
	"hris_backend/app/dailyreport"
	"hris_backend/app/department"
	"hris_backend/app/employee"
	"hris_backend/app/leave"
	"hris_backend/app/location"
	"hris_backend/app/payroll"
	"hris_backend/app/position"
	"hris_backend/app/product"
	"hris_backend/app/purchaseorder"
	"hris_backend/app/report"
	"hris_backend/app/role"
	"hris_backend/app/sale"
	"hris_backend/app/setting"
	"hris_backend/app/stock"
	"hris_backend/app/stockopname"
	"hris_backend/app/stocktransfer"
	"hris_backend/app/supplier"
	"hris_backend/app/user"
	"hris_backend/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

type RouteConfig struct {
	App                  *fiber.App
	AuthMiddleware       fiber.Handler
	AuthHandler          auth.AuthHandler
	ProductHandler       product.ProductHandler
	CategoryHandler      category.CategoryHandler
	SaleHandler          sale.SaleHandler
	SettingHandler       setting.SettingHandler
	UserHandler          user.UserHandler
	RoleHandler          role.RoleHandler
	ReportHandler        report.ReportHandler
	StockHandler         stock.StockHandler
	AssetHandler         asset.AssetHandler
	LocationHandler      location.LocationHandler
	SupplierHandler      supplier.SupplierHandler
	PurchaseOrderHandler purchaseorder.PurchaseOrderHandler
	StockTransferHandler stocktransfer.StockTransferHandler
	StockOpnameHandler   stockopname.StockOpnameHandler
	Config               *viper.Viper

	// HRIS Handlers
	EmployeeHandler    employee.EmployeeHandler
	AttendanceHandler  attendance.AttendanceHandler
	LeaveHandler       leave.LeaveHandler
	DailyReportHandler dailyreport.DailyReportHandler
	PayrollHandler     payroll.PayrollHandler
	DepartmentHandler  department.DepartmentHandler
	PositionHandler    position.PositionHandler
}

func (c *RouteConfig) Setup() {
	// CORS middleware
	c.App.Use(func(ctx *fiber.Ctx) error {
		origin := ctx.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		ctx.Set("Access-Control-Allow-Origin", origin)
		ctx.Set("Access-Control-Allow-Credentials", "true")
		ctx.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		ctx.Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if ctx.Method() == "OPTIONS" {
			return ctx.SendStatus(fiber.StatusNoContent)
		}
		return ctx.Next()
	})

	// Health check
	c.App.Get("/health", func(ctx *fiber.Ctx) error {
		return ctx.JSON(fiber.Map{"status": "ok"})
	})

	// Static files for uploads
	c.App.Static("/uploads", "./uploads")

	// API routes
	api := c.App.Group("/api")

	// Auth routes (public)
	c.AuthRoutes(api)

	// Midtrans webhook (public, no auth required)
	api.Post("/sales/midtrans-notification", c.SaleHandler.MidtransNotification)

	// Protected routes
	protected := api.Group("/", c.AuthMiddleware)
	c.ProductRoutes(protected)
	c.CategoryRoutes(protected)
	c.SaleRoutes(protected)
	c.SettingRoutes(protected)
	c.UserRoutes(protected)
	c.RoleRoutes(protected)
	c.ReportRoutes(protected)
	c.StockRoutes(protected)
	c.AssetRoutes(protected)
	c.LocationRoutes(protected)
	c.SupplierRoutes(protected)
	c.PurchaseOrderRoutes(protected)
	c.StockTransferRoutes(protected)
	c.StockOpnameRoutes(protected)

	// HRIS Protected routes
	c.EmployeeRoutes(protected)
	c.AttendanceRoutes(protected)
	c.LeaveRoutes(protected)
	c.DailyReportRoutes(protected)
	c.PayrollRoutes(protected)
	c.DepartmentRoutes(protected)
	c.PositionRoutes(protected)

	// Dashboard routes
	dashboard := protected.Group("/dashboard")
	dashboard.Get("/employee", c.EmployeeHandler.GetDashboardStats)
	dashboard.Get("/hr", c.EmployeeHandler.GetHRStats)
	dashboard.Get("/manager", c.EmployeeHandler.GetManagerStats)
}

func (c *RouteConfig) AuthRoutes(router fiber.Router) {
	authGroup := router.Group("/auth")
	authGroup.Post("/login", c.AuthHandler.Login)
	authGroup.Post("/verify-2fa", c.AuthHandler.Verify2FALogin)
	authGroup.Post("/refresh", c.AuthHandler.Refresh)
	authGroup.Post("/logout", c.AuthHandler.Logout)
	authGroup.Get("/me", c.AuthMiddleware, c.AuthHandler.Me)
	authGroup.Post("/change-password", c.AuthMiddleware, c.AuthHandler.ChangePassword)

	// 2FA Routes
	authGroup.Post("/2fa/setup", c.AuthMiddleware, c.AuthHandler.Generate2FASetup)
	authGroup.Post("/2fa/enable", c.AuthMiddleware, c.AuthHandler.Enable2FA)
	authGroup.Post("/2fa/disable", c.AuthMiddleware, c.AuthHandler.Disable2FA)
}

func (c *RouteConfig) ProductRoutes(router fiber.Router) {
	productGroup := router.Group("/products")
	productGroup.Get("/", c.ProductHandler.GetAll)
	productGroup.Get("/search", c.ProductHandler.Search)
	productGroup.Get("/by-category", c.ProductHandler.GetByCategory)
	productGroup.Get("/:id", c.ProductHandler.GetByID)
	productGroup.Post("/", middleware.RequireRole("OWNER", "OPS"), c.ProductHandler.Create)
	productGroup.Post("/upload-image", middleware.RequireRole("OWNER", "OPS"), c.ProductHandler.UploadImage)
	productGroup.Put("/:id", middleware.RequireRole("OWNER", "OPS"), c.ProductHandler.Update)
	productGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.ProductHandler.Delete)
}

func (c *RouteConfig) CategoryRoutes(router fiber.Router) {
	categoryGroup := router.Group("/categories")
	categoryGroup.Get("/", c.CategoryHandler.GetAll)
	categoryGroup.Get("/:id", c.CategoryHandler.GetByID)
	categoryGroup.Post("/", middleware.RequireRole("OWNER", "OPS"), c.CategoryHandler.Create)
	categoryGroup.Put("/:id", middleware.RequireRole("OWNER", "OPS"), c.CategoryHandler.Update)
	categoryGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.CategoryHandler.Delete)
}

func (c *RouteConfig) SaleRoutes(router fiber.Router) {
	saleGroup := router.Group("/sales")
	saleGroup.Get("/", c.SaleHandler.FindAll)
	saleGroup.Post("/", c.SaleHandler.Create)
	saleGroup.Get("/daily-report", c.SaleHandler.GetDailyReport)
	saleGroup.Get("/:id", c.SaleHandler.GetByID)
	saleGroup.Put("/:id/status", c.SaleHandler.UpdateStatus)
	saleGroup.Post("/:id/pay-cash", c.SaleHandler.PayCash)
	saleGroup.Post("/:id/pay-split", c.SaleHandler.PaySplit)
	saleGroup.Post("/:id/pay-qris", c.SaleHandler.PayQRIS)
	saleGroup.Post("/:id/pay-qris-static", c.SaleHandler.PayQRISStatic)
	saleGroup.Post("/:id/pay-transfer", c.SaleHandler.PayTransfer)
	saleGroup.Post("/:id/snap", c.SaleHandler.GenerateSnapToken)
	saleGroup.Get("/:id/qris-status", c.SaleHandler.GetQRISStatus)
}

func (c *RouteConfig) SettingRoutes(router fiber.Router) {
	settingGroup := router.Group("/settings")
	settingGroup.Get("/modules", c.SettingHandler.GetModules)
	settingGroup.Put("/modules", middleware.RequireRole("OWNER"), c.SettingHandler.UpdateModules)
	settingGroup.Get("/pos-payment", c.SettingHandler.GetPosPayment)
	settingGroup.Put("/pos-payment", middleware.RequireRole("OWNER"), c.SettingHandler.UpdatePosPayment)
	settingGroup.Post("/upload-qris", middleware.RequireRole("OWNER"), c.SettingHandler.UploadQrisImage)
}

func (c *RouteConfig) UserRoutes(router fiber.Router) {
	userGroup := router.Group("/users")
	userGroup.Get("/", middleware.RequirePermission("users:view"), c.UserHandler.GetAll)
	userGroup.Get("/:id", middleware.RequirePermission("users:view"), c.UserHandler.GetByID)
	userGroup.Post("/", middleware.RequirePermission("users:create"), c.UserHandler.Create)
	userGroup.Put("/:id", middleware.RequirePermission("users:edit"), c.UserHandler.Update)
	userGroup.Delete("/:id", middleware.RequirePermission("users:delete"), c.UserHandler.Delete)
}

func (c *RouteConfig) RoleRoutes(router fiber.Router) {
	roleGroup := router.Group("/roles")
	roleGroup.Get("/", middleware.RequirePermission("roles:view"), c.RoleHandler.GetAll)
	roleGroup.Get("/:role/permissions", middleware.RequirePermission("roles:view"), c.RoleHandler.GetPermissions)
	roleGroup.Put("/:role/permissions", middleware.RequirePermission("roles:edit"), c.RoleHandler.UpdatePermissions)
}

func (c *RouteConfig) ReportRoutes(router fiber.Router) {
	reportGroup := router.Group("/reports")

	// These endpoints require OWNER or OPS role
	adminReportGroup := reportGroup.Group("", middleware.RequireRole("OWNER", "OPS"))
	adminReportGroup.Get("/summary", c.ReportHandler.GetSummary)
	adminReportGroup.Get("/chart", c.ReportHandler.GetChartData)
	adminReportGroup.Get("/sales", c.ReportHandler.GetSalesDetail)
	adminReportGroup.Get("/export", c.ReportHandler.ExportExcel)
	adminReportGroup.Get("/cashiers", c.ReportHandler.GetCashiers)
	adminReportGroup.Get("/profit", c.ReportHandler.GetProfitReport)

	// Top products can be accessed by OWNER, OPS, MANAGER, HR_ADMIN
	reportGroup.Get("/top-products", middleware.RequireRole("OWNER", "OPS", "MANAGER", "HR_ADMIN"), c.ReportHandler.GetTopProducts)
}

func (c *RouteConfig) StockRoutes(router fiber.Router) {
	stockGroup := router.Group("/stock", c.AuthMiddleware)

	// Protected owner/ops routes
	protectedGroup := stockGroup.Group("", middleware.RequireRole("OWNER", "OPS"))
	protectedGroup.Post("/in", c.StockHandler.AddStockIn)
	protectedGroup.Get("/in", c.StockHandler.GetStockIns)
	protectedGroup.Post("/out", c.StockHandler.AddStockOut)
	protectedGroup.Get("/out", c.StockHandler.GetStockOuts)

	// Inventory can be viewed by all authenticated users
	stockGroup.Get("/inventory", c.StockHandler.GetInventory)
}

func (c *RouteConfig) AssetRoutes(router fiber.Router) {
	assetGroup := router.Group("/assets")
	assetGroup.Get("/", c.AssetHandler.FindAllAssets)
	assetGroup.Get("/:id", c.AssetHandler.FindAssetByID)
	assetGroup.Post("/", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.CreateAsset)
	assetGroup.Put("/:id", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.UpdateAsset)
	assetGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.AssetHandler.DeleteAsset)

	assignmentGroup := router.Group("/asset-assignments")
	assignmentGroup.Get("/", c.AssetHandler.FindAllAssignments)
	assignmentGroup.Post("/", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.CreateAssignment)
	assignmentGroup.Put("/:id/return", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.ReturnAssignment)
	assignmentGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.AssetHandler.DeleteAssignment)

	maintenanceGroup := router.Group("/asset-maintenances")
	maintenanceGroup.Get("/", c.AssetHandler.FindAllMaintenances)
	maintenanceGroup.Post("/", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.CreateMaintenance)
	maintenanceGroup.Put("/:id/status", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.UpdateMaintenanceStatus)
	maintenanceGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.AssetHandler.DeleteMaintenance)

	depreciationGroup := router.Group("/asset-depreciations")
	depreciationGroup.Get("/", c.AssetHandler.FindAllDepreciations)
	depreciationGroup.Post("/generate", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.GenerateDepreciations)
	depreciationGroup.Put("/:id/status", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.AssetHandler.UpdateDepreciationStatus)
}

func (c *RouteConfig) LocationRoutes(router fiber.Router) {
	locationGroup := router.Group("/locations")
	locationGroup.Get("/", c.LocationHandler.FindAll)
	locationGroup.Get("/:id", c.LocationHandler.FindByID)
	locationGroup.Post("/", middleware.RequireRole("OWNER", "OPS"), c.LocationHandler.Create)
	locationGroup.Put("/:id", middleware.RequireRole("OWNER", "OPS"), c.LocationHandler.Update)
	locationGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.LocationHandler.Delete)
}

func (c *RouteConfig) SupplierRoutes(router fiber.Router) {
	supplierGroup := router.Group("/suppliers")
	supplierGroup.Get("/", c.SupplierHandler.FindAll)
	supplierGroup.Get("/:id", c.SupplierHandler.FindByID)
	supplierGroup.Post("/", middleware.RequireRole("OWNER", "OPS"), c.SupplierHandler.Create)
	supplierGroup.Put("/:id", middleware.RequireRole("OWNER", "OPS"), c.SupplierHandler.Update)
	supplierGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.SupplierHandler.Delete)
}

func (c *RouteConfig) PurchaseOrderRoutes(router fiber.Router) {
	poGroup := router.Group("/purchase-orders")
	poGroup.Get("/", c.PurchaseOrderHandler.FindAll)
	poGroup.Get("/:id", c.PurchaseOrderHandler.FindByID)
	// Typically MANAGER/OPS could create POs
	poGroup.Post("/", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.PurchaseOrderHandler.Create)
	poGroup.Put("/:id/status", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.PurchaseOrderHandler.UpdateStatus)
	poGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.PurchaseOrderHandler.Delete)
}

func (c *RouteConfig) StockTransferRoutes(router fiber.Router) {
	trGroup := router.Group("/stock-transfers")
	trGroup.Get("/", c.StockTransferHandler.FindAll)
	trGroup.Get("/:id", c.StockTransferHandler.FindByID)
	trGroup.Post("/", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.StockTransferHandler.Create)
	trGroup.Put("/:id/status", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.StockTransferHandler.UpdateStatus)
	trGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.StockTransferHandler.Delete)
}

func (c *RouteConfig) StockOpnameRoutes(router fiber.Router) {
	opGroup := router.Group("/stock-opnames")
	opGroup.Get("/", c.StockOpnameHandler.FindAll)
	opGroup.Get("/:id", c.StockOpnameHandler.FindByID)
	opGroup.Post("/", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.StockOpnameHandler.Create)
	opGroup.Put("/:id/status", middleware.RequireRole("OWNER", "OPS", "MANAGER"), c.StockOpnameHandler.UpdateStatus)
	opGroup.Delete("/:id", middleware.RequireRole("OWNER"), c.StockOpnameHandler.Delete)
}

// ============================================================
// HRIS Routes
// ============================================================

func (c *RouteConfig) EmployeeRoutes(router fiber.Router) {
	empGroup := router.Group("/employees")
	// OWNER and HR_ADMIN can manage all employees
	empGroup.Get("/", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.EmployeeHandler.GetAll)
	empGroup.Get("/me", c.EmployeeHandler.GetMe)
	empGroup.Get("/user/:userId", c.EmployeeHandler.GetByUserID)
	empGroup.Get("/team/:managerId", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.EmployeeHandler.GetTeam)
	empGroup.Get("/team-leaders", middleware.RequireRole("OWNER", "HR_ADMIN"), c.EmployeeHandler.GetTeamLeaderOptions)
	empGroup.Get("/:id", c.EmployeeHandler.GetByID)
	// Only OWNER and HR_ADMIN can create, update, delete employees
	empGroup.Post("/", middleware.RequireRole("OWNER", "HR_ADMIN"), c.EmployeeHandler.Create)
	empGroup.Post("/upload-photo", middleware.RequireRole("OWNER", "HR_ADMIN"), c.EmployeeHandler.UploadPhoto)
	empGroup.Put("/:id", middleware.RequireRole("OWNER", "HR_ADMIN"), c.EmployeeHandler.Update)
	empGroup.Delete("/:id", middleware.RequireRole("OWNER", "HR_ADMIN"), c.EmployeeHandler.Delete)
}

func (c *RouteConfig) AttendanceRoutes(router fiber.Router) {
	attGroup := router.Group("/attendance")
	attGroup.Post("/checkin", c.AttendanceHandler.CheckIn)
	attGroup.Post("/checkout", c.AttendanceHandler.CheckOut)
	attGroup.Post("/approve", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.AttendanceHandler.Approve)
	attGroup.Post("/reject", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.AttendanceHandler.Reject)
	attGroup.Get("/pending", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.AttendanceHandler.GetPendingApprovals)
	attGroup.Get("/history", c.AttendanceHandler.GetHistory)
	attGroup.Get("/my-today", c.AttendanceHandler.GetMyTodayAttendance)
	attGroup.Get("/today", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.AttendanceHandler.GetTodayAttendance)
	attGroup.Get("/late", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.AttendanceHandler.GetLateEmployees)
	attGroup.Get("/stats", middleware.RequireRole("OWNER", "HR_ADMIN"), c.AttendanceHandler.GetTodayStats)
}

func (c *RouteConfig) LeaveRoutes(router fiber.Router) {
	leaveGroup := router.Group("/leave")
	leaveGroup.Post("/", c.LeaveHandler.Create)
	leaveGroup.Get("/pending", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.LeaveHandler.GetPending)
	leaveGroup.Get("/employee/:employeeId", c.LeaveHandler.GetMyLeaves)
	leaveGroup.Get("/team/:managerId", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.LeaveHandler.GetTeamLeaves)
	leaveGroup.Get("/:id", c.LeaveHandler.GetByID)
	leaveGroup.Post("/:id/approve/:approvedBy", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.LeaveHandler.Approve)
	leaveGroup.Post("/:id/cancel", c.LeaveHandler.Cancel)
}

func (c *RouteConfig) DailyReportRoutes(router fiber.Router) {
	drGroup := router.Group("/daily-report")
	drGroup.Post("/", c.DailyReportHandler.Create)
	// TEAM_LEADER can view pending reports from their team
	drGroup.Get("/pending", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.DailyReportHandler.GetPending)
	drGroup.Get("/my", c.DailyReportHandler.GetMyOwnReports)
	drGroup.Get("/employee/:employeeId", c.DailyReportHandler.GetMyReports)
	// TEAM_LEADER can view team reports from their team (STAFF only)
	drGroup.Get("/team/:managerId", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.DailyReportHandler.GetTeamReports)
	drGroup.Get("/:id", c.DailyReportHandler.GetByID)
	drGroup.Put("/:id", c.DailyReportHandler.Update)
	// Approve and reject for all managers, HR_ADMIN, and TEAM_LEADER
	drGroup.Post("/:id/approve/:approvedBy", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.DailyReportHandler.Approve)
	drGroup.Post("/:id/reject/:approvedBy", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"), c.DailyReportHandler.Approve)
}

func (c *RouteConfig) PayrollRoutes(router fiber.Router) {
	payGroup := router.Group("/payroll")
	payGroup.Get("/", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.PayrollHandler.GetAll)
	payGroup.Post("/", middleware.RequireRole("OWNER", "HR_ADMIN", "MANAGER"), c.PayrollHandler.Create)
	payGroup.Get("/my", c.PayrollHandler.GetMyOwnPayrolls)
	payGroup.Get("/employee/:employeeId", c.PayrollHandler.GetMyPayrolls)
	// Calculate for all employees (no employeeId in path)
	payGroup.Post("/calculate", middleware.RequireRole("OWNER", "HR_ADMIN"), c.PayrollHandler.CalculateAll)
	// Calculate for specific employee
	payGroup.Post("/calculate/:employeeId", middleware.RequireRole("OWNER", "HR_ADMIN"), c.PayrollHandler.Calculate)
	payGroup.Get("/:id/slip-pdf", c.PayrollHandler.DownloadSlipPDF)
	payGroup.Get("/:id", c.PayrollHandler.GetByID)
	payGroup.Post("/:id/mark-paid", middleware.RequireRole("OWNER", "HR_ADMIN"), c.PayrollHandler.MarkAsPaid)
}

func (c *RouteConfig) DepartmentRoutes(router fiber.Router) {
	deptGroup := router.Group("/departments")
	deptGroup.Get("/", c.DepartmentHandler.GetAll)
	deptGroup.Get("/:id", c.DepartmentHandler.GetByID)
	deptGroup.Post("/", middleware.RequireRole("OWNER", "HR_ADMIN"), c.DepartmentHandler.Create)
	deptGroup.Put("/:id", middleware.RequireRole("OWNER", "HR_ADMIN"), c.DepartmentHandler.Update)
	deptGroup.Delete("/:id", middleware.RequireRole("OWNER", "HR_ADMIN"), c.DepartmentHandler.Delete)
}

func (c *RouteConfig) PositionRoutes(router fiber.Router) {
	posGroup := router.Group("/positions")
	posGroup.Get("/", c.PositionHandler.GetAll)
	posGroup.Get("/:id", c.PositionHandler.GetByID)
	posGroup.Post("/", middleware.RequireRole("OWNER", "HR_ADMIN"), c.PositionHandler.Create)
	posGroup.Put("/:id", middleware.RequireRole("OWNER", "HR_ADMIN"), c.PositionHandler.Update)
	posGroup.Delete("/:id", middleware.RequireRole("OWNER", "HR_ADMIN"), c.PositionHandler.Delete)
}

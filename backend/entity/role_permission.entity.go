package entity

import (
	"sort"
	"strings"
	"time"
)

type RolePermission struct {
	ID          string    `gorm:"column:id;primaryKey;type:varchar(255);default:gen_random_uuid()" json:"id"`
	Role        Role      `gorm:"column:role;type:varchar(20);not null;index;uniqueIndex:idx_role_resource_action" json:"role"`
	Resource    string    `gorm:"column:resource;type:varchar(100);not null;uniqueIndex:idx_role_resource_action" json:"resource"`
	Action      string    `gorm:"column:action;type:varchar(50);not null;uniqueIndex:idx_role_resource_action" json:"action"`
	IsAllowed   bool      `gorm:"column:is_allowed;not null;default:true" json:"isAllowed"`
	Description string    `gorm:"column:description;type:text" json:"description"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}

type PermissionDefinition struct {
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Description string `json:"description"`
}

var PermissionCatalog = []PermissionDefinition{
	{Resource: "dashboard", Action: "view", Description: "View dashboard"},
	{Resource: "modules", Action: "view", Description: "View enabled modules"},
	{Resource: "modules", Action: "edit", Description: "Update enabled modules"},
	{Resource: "users", Action: "view", Description: "View users"},
	{Resource: "users", Action: "create", Description: "Create users"},
	{Resource: "users", Action: "edit", Description: "Edit users"},
	{Resource: "users", Action: "delete", Description: "Delete users"},
	{Resource: "roles", Action: "view", Description: "View role permissions"},
	{Resource: "roles", Action: "edit", Description: "Manage role permissions"},
	{Resource: "products", Action: "view", Description: "View products"},
	{Resource: "products", Action: "create", Description: "Create products"},
	{Resource: "products", Action: "edit", Description: "Edit products"},
	{Resource: "products", Action: "delete", Description: "Delete products"},
	{Resource: "categories", Action: "view", Description: "View categories"},
	{Resource: "categories", Action: "create", Description: "Create categories"},
	{Resource: "categories", Action: "edit", Description: "Edit categories"},
	{Resource: "categories", Action: "delete", Description: "Delete categories"},
	{Resource: "sales", Action: "view", Description: "View sales"},
	{Resource: "sales", Action: "create", Description: "Create sales"},
	{Resource: "sales", Action: "edit", Description: "Update sales status"},
	{Resource: "sales", Action: "pay", Description: "Execute payment actions"},
	{Resource: "reports", Action: "view", Description: "View reports"},
	{Resource: "reports", Action: "export", Description: "Export reports"},
	{Resource: "stock", Action: "view", Description: "View stock and inventory"},
	{Resource: "stock", Action: "create", Description: "Create stock movement"},
	{Resource: "assets", Action: "view", Description: "View assets"},
	{Resource: "assets", Action: "create", Description: "Create assets"},
	{Resource: "assets", Action: "edit", Description: "Edit assets"},
	{Resource: "assets", Action: "delete", Description: "Delete assets"},
	{Resource: "assets", Action: "assign", Description: "Assign and return assets"},
	{Resource: "assets", Action: "maintain", Description: "Manage asset maintenance"},
	{Resource: "assets", Action: "depreciate", Description: "Manage depreciation"},
	{Resource: "locations", Action: "view", Description: "View locations"},
	{Resource: "locations", Action: "create", Description: "Create locations"},
	{Resource: "locations", Action: "edit", Description: "Edit locations"},
	{Resource: "locations", Action: "delete", Description: "Delete locations"},
	{Resource: "suppliers", Action: "view", Description: "View suppliers"},
	{Resource: "suppliers", Action: "create", Description: "Create suppliers"},
	{Resource: "suppliers", Action: "edit", Description: "Edit suppliers"},
	{Resource: "suppliers", Action: "delete", Description: "Delete suppliers"},
	{Resource: "purchase_orders", Action: "view", Description: "View purchase orders"},
	{Resource: "purchase_orders", Action: "create", Description: "Create purchase orders"},
	{Resource: "purchase_orders", Action: "edit", Description: "Edit purchase order status"},
	{Resource: "purchase_orders", Action: "delete", Description: "Delete purchase orders"},
	{Resource: "stock_transfers", Action: "view", Description: "View stock transfers"},
	{Resource: "stock_transfers", Action: "create", Description: "Create stock transfers"},
	{Resource: "stock_transfers", Action: "edit", Description: "Edit stock transfer status"},
	{Resource: "stock_transfers", Action: "delete", Description: "Delete stock transfers"},
	{Resource: "stock_opnames", Action: "view", Description: "View stock opnames"},
	{Resource: "stock_opnames", Action: "create", Description: "Create stock opnames"},
	{Resource: "stock_opnames", Action: "edit", Description: "Edit stock opname status"},
	{Resource: "stock_opnames", Action: "delete", Description: "Delete stock opnames"},
	{Resource: "employees", Action: "view", Description: "View employees"},
	{Resource: "employees", Action: "create", Description: "Create employees"},
	{Resource: "employees", Action: "edit", Description: "Edit employees"},
	{Resource: "employees", Action: "delete", Description: "Delete employees"},
	{Resource: "attendance", Action: "view", Description: "View attendance"},
	{Resource: "attendance", Action: "create", Description: "Check in and check out"},
	{Resource: "attendance", Action: "approve", Description: "Approve attendance"},
	{Resource: "leave", Action: "view", Description: "View leave"},
	{Resource: "leave", Action: "create", Description: "Create leave request"},
	{Resource: "leave", Action: "approve", Description: "Approve leave"},
	{Resource: "daily_report", Action: "view", Description: "View daily report"},
	{Resource: "daily_report", Action: "create", Description: "Create daily report"},
	{Resource: "daily_report", Action: "approve", Description: "Approve daily report"},
	{Resource: "payroll", Action: "view", Description: "View payroll"},
	{Resource: "payroll", Action: "create", Description: "Create payroll"},
	{Resource: "payroll", Action: "edit", Description: "Edit payroll"},
	{Resource: "payroll", Action: "approve", Description: "Approve payroll payment"},
	{Resource: "departments", Action: "view", Description: "View departments"},
	{Resource: "departments", Action: "create", Description: "Create departments"},
	{Resource: "departments", Action: "edit", Description: "Edit departments"},
	{Resource: "departments", Action: "delete", Description: "Delete departments"},
	{Resource: "positions", Action: "view", Description: "View positions"},
	{Resource: "positions", Action: "create", Description: "Create positions"},
	{Resource: "positions", Action: "edit", Description: "Edit positions"},
	{Resource: "positions", Action: "delete", Description: "Delete positions"},
	{Resource: "settings", Action: "view", Description: "View settings"},
	{Resource: "settings", Action: "edit", Description: "Update settings"},
}

func PermissionCode(resource, action string) string {
	return strings.ToLower(strings.TrimSpace(resource)) + ":" + strings.ToLower(strings.TrimSpace(action))
}

func CatalogPermissionCodes() []string {
	seen := map[string]struct{}{}
	codes := make([]string, 0, len(PermissionCatalog))
	for _, item := range PermissionCatalog {
		code := PermissionCode(item.Resource, item.Action)
		if _, ok := seen[code]; ok {
			continue
		}
		seen[code] = struct{}{}
		codes = append(codes, code)
	}
	sort.Strings(codes)
	return codes
}

func DefaultPermissionCodesByRole(role Role) []string {
	switch role {
	case RoleOwner:
		return CatalogPermissionCodes()
	case RoleOps:
		return []string{
			"dashboard:view",
			"modules:view",
			"users:view",
			"roles:view",
			"products:view", "products:create", "products:edit",
			"categories:view", "categories:create", "categories:edit",
			"sales:view", "sales:create", "sales:edit", "sales:pay",
			"reports:view", "reports:export",
			"stock:view", "stock:create",
			"assets:view", "assets:create", "assets:edit", "assets:assign", "assets:maintain", "assets:depreciate",
			"locations:view", "locations:create", "locations:edit",
			"suppliers:view", "suppliers:create", "suppliers:edit",
			"purchase_orders:view", "purchase_orders:create", "purchase_orders:edit",
			"stock_transfers:view", "stock_transfers:create", "stock_transfers:edit",
			"stock_opnames:view", "stock_opnames:create", "stock_opnames:edit",
			"settings:view",
		}
	case RoleCashier:
		return []string{
			"dashboard:view",
			"products:view",
			"categories:view",
			"sales:view", "sales:create", "sales:pay",
			"stock:view",
			"settings:view",
		}
	case RoleHRAdmin:
		return []string{
			"dashboard:view",
			"users:view", "users:create", "users:edit",
			"roles:view",
			"employees:view", "employees:create", "employees:edit", "employees:delete",
			"attendance:view", "attendance:create", "attendance:approve",
			"leave:view", "leave:create", "leave:approve",
			"daily_report:view", "daily_report:create", "daily_report:approve",
			"payroll:view", "payroll:create", "payroll:edit", "payroll:approve",
			"departments:view", "departments:create", "departments:edit", "departments:delete",
			"positions:view", "positions:create", "positions:edit", "positions:delete",
			"reports:view", "reports:export",
		}
	case RoleManager:
		return []string{
			"dashboard:view",
			"employees:view",
			"attendance:view", "attendance:create", "attendance:approve",
			"leave:view", "leave:create", "leave:approve",
			"daily_report:view", "daily_report:create", "daily_report:approve",
			"payroll:view",
			"reports:view",
		}
	case RoleTeamLeader:
		return []string{
			"dashboard:view",
			"attendance:view", "attendance:create", "attendance:approve",
			"leave:view", "leave:create",
			"daily_report:view", "daily_report:create", "daily_report:approve",
			"payroll:view",
			"reports:view",
		}
	case RoleEmployee, RoleStaff:
		return []string{
			"dashboard:view",
			"attendance:view", "attendance:create",
			"leave:view", "leave:create",
			"daily_report:view", "daily_report:create",
			"payroll:view",
		}
	case RoleBackend, RoleFrontend:
		return []string{
			"dashboard:view",
			"modules:view",
			"products:view", "categories:view",
			"sales:view", "reports:view",
			"stock:view",
			"assets:view",
			"locations:view",
			"suppliers:view",
			"purchase_orders:view",
			"stock_transfers:view",
			"stock_opnames:view",
			"settings:view",
		}
	default:
		return []string{"dashboard:view"}
	}
}

func BuildDefaultRolePermissions() []RolePermission {
	permissions := make([]RolePermission, 0)
	descriptionByCode := map[string]string{}
	for _, def := range PermissionCatalog {
		descriptionByCode[PermissionCode(def.Resource, def.Action)] = def.Description
	}

	for _, role := range AllRoles() {
		defaultCodes := DefaultPermissionCodesByRole(role)
		allowedLookup := map[string]bool{}
		for _, code := range defaultCodes {
			allowedLookup[code] = true
		}

		for _, def := range PermissionCatalog {
			code := PermissionCode(def.Resource, def.Action)
			permissions = append(permissions, RolePermission{
				Role:        role,
				Resource:    def.Resource,
				Action:      def.Action,
				IsAllowed:   allowedLookup[code],
				Description: descriptionByCode[code],
			})
		}
	}
	return permissions
}

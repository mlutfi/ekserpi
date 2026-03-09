package role

type RoleSummaryResponse struct {
	Role      string `json:"role"`
	Label     string `json:"label"`
	UserCount int64  `json:"userCount"`
}

type RolePermissionResponse struct {
	ID          string `json:"id"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Code        string `json:"code"`
	IsAllowed   bool   `json:"isAllowed"`
	Description string `json:"description"`
}

type RolePermissionsResponse struct {
	Role        string                   `json:"role"`
	Label       string                   `json:"label"`
	Permissions []RolePermissionResponse `json:"permissions"`
}

type UpdateRolePermissionItem struct {
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	IsAllowed   bool   `json:"isAllowed"`
	Description string `json:"description"`
}

type UpdateRolePermissionsRequest struct {
	Permissions []UpdateRolePermissionItem `json:"permissions"`
}

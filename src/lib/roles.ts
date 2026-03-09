// Role types for the application
export type Role =
    | 'OWNER'
    | 'OPS'
    | 'CASHIER'
    | 'HR_ADMIN'
    | 'MANAGER'
    | 'TEAM_LEADER'
    | 'EMPLOYEE'
    | 'STAFF'
    | 'BACKEND'
    | 'FRONTEND'

// Role groups for easier access control
export const RoleGroups = {
    // Admin roles (can access admin panel)
    ADMIN: ['OWNER', 'OPS'],
    // HRIS roles
    HRIS: ['HR_ADMIN', 'MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'STAFF'],
    // POS roles
    POS: ['CASHIER', 'OWNER', 'OPS'],
    // Technical roles
    TECHNICAL: ['BACKEND', 'FRONTEND', 'OWNER', 'OPS'],
} as const

// Role labels for display
export const RoleLabels: Record<Role, string> = {
    OWNER: 'Owner',
    OPS: 'Operations',
    CASHIER: 'Cashier',
    HR_ADMIN: 'HR Admin',
    MANAGER: 'Manager',
    TEAM_LEADER: 'Team Leader',
    EMPLOYEE: 'Employee',
    STAFF: 'Staff',
    BACKEND: 'Backend Developer',
    FRONTEND: 'Frontend Developer',
}

// Check if user has any of the specified roles
export function hasRole(userRole: string | undefined, allowedRoles: Role[]): boolean {
    if (!userRole) return false
    return allowedRoles.includes(userRole as Role)
}

// Check if user belongs to a role group
export function hasRoleGroup(userRole: string | undefined, group: readonly string[]): boolean {
    if (!userRole) return false
    return group.includes(userRole)
}

// Get default redirect path based on role
export function getDefaultRoute(role: string): string {
    switch (role) {
        case 'OWNER':
        case 'OPS':
            return '/admin'
        case 'CASHIER':
            return '/pos'
        case 'HR_ADMIN':
        case 'MANAGER':
        case 'TEAM_LEADER':
        case 'EMPLOYEE':
        case 'STAFF':
            return '/hris'
        case 'BACKEND':
        case 'FRONTEND':
            return '/admin' // Technical roles go to admin panel
        default:
            return '/'
    }
}

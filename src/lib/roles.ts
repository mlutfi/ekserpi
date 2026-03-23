// Role types for the application
export type Role =
    | 'OWNER'
    | 'CASHIER'
    | 'HR_ADMIN'
    | 'TEAM_LEADER'
    | 'EMPLOYEE'

// Role groups for easier access control
export const RoleGroups = {
    // Admin roles (can access admin panel)
    ADMIN: ['OWNER'],
    // HRIS roles
    HRIS: ['HR_ADMIN', 'TEAM_LEADER', 'EMPLOYEE'],
    // POS roles
    POS: ['CASHIER', 'OWNER'],
    // Technical roles
    TECHNICAL: ['OWNER'],
} as const

// Role labels for display
export const RoleLabels: Record<Role, string> = {
    OWNER: 'Owner',
    CASHIER: 'Cashier',
    HR_ADMIN: 'HR Admin',
    TEAM_LEADER: 'Team Leader',
    EMPLOYEE: 'Employee',
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
            return '/admin'
        case 'CASHIER':
            return '/pos'
        case 'HR_ADMIN':
        case 'TEAM_LEADER':
        case 'EMPLOYEE':
            return '/hris'
        default:
            return '/'
    }
}

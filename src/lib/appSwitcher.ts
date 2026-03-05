import { ShoppingCart, Building2, LayoutGrid } from "lucide-react"

export interface AppSwitcherItem {
    key: string
    label: string
    description: string
    href: string
    icon: typeof ShoppingCart
    gradient: string
    shadowColor: string
    /** Roles allowed to access this app */
    allowedRoles: string[]
    /** Required active module (if any) */
    requiredModule?: string
}

export const appSwitcherItems: AppSwitcherItem[] = [
    {
        key: "pos",
        label: "POS",
        description: "Point of Sale",
        href: "/pos",
        icon: ShoppingCart,
        gradient: "from-emerald-400 to-teal-500",
        shadowColor: "shadow-emerald-200/50",
        allowedRoles: ["OWNER", "OPS", "CASHIER", "BACKEND", "FRONTEND"],
        requiredModule: "POS",
    },
    {
        key: "hris",
        label: "HRIS",
        description: "HR Management",
        href: "/hris",
        icon: Building2,
        gradient: "from-blue-400 to-indigo-600",
        shadowColor: "shadow-blue-200/50",
        allowedRoles: ["OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER", "EMPLOYEE", "STAFF"],
        requiredModule: "HRIS",
    },
    {
        key: "admin",
        label: "Admin",
        description: "Management Panel",
        href: "/admin",
        icon: LayoutGrid,
        gradient: "from-amber-400 to-orange-500",
        shadowColor: "shadow-amber-200/50",
        allowedRoles: ["OWNER", "OPS", "BACKEND", "FRONTEND"],
    },
]

/**
 * Filter app switcher items based on user role and active modules.
 * Returns only the apps the user is allowed to access.
 */
export function getAccessibleApps(
    role: string | undefined,
    activeModules: string[]
): AppSwitcherItem[] {
    if (!role) return []
    return appSwitcherItems.filter((app) => {
        // Check role access
        if (!app.allowedRoles.includes(role)) return false
        // Check module activation
        if (app.requiredModule && !activeModules.includes(app.requiredModule)) return false
        return true
    })
}

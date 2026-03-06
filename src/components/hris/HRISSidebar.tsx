"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    Clock,
    FileText,
    CalendarDays,
    DollarSign,
    LogOut,
    ChevronRight,
    ChevronDown,
    Building2,
    BarChart3,
    ClipboardList,
    LucideIcon,
    Database,
    Briefcase,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useAuthStore } from "@/lib/store"
import { useSidebarState } from "@/lib/useSidebarState"
import { getAccessibleApps } from "@/lib/appSwitcher"

interface SubNavItem {
    href: string
    label: string
    icon: LucideIcon
}

interface NavItem {
    href: string
    label: string
    icon: LucideIcon
    iconBg: string
    iconColor: string
    activeIconBg: string
    activeBg: string
    activeBorder: string
    activeText: string
    badge: string | null
    subItems?: SubNavItem[]
}

// Navigation items based on role
const getNavItems = (role: string | undefined): NavItem[] => {
    const baseItems: NavItem[] = [
        {
            href: "/hris",
            label: "Dashboard",
            icon: LayoutDashboard,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-500",
            activeIconBg: "bg-blue-500",
            activeBg: "bg-blue-50",
            activeBorder: "bg-blue-500",
            activeText: "text-blue-700",
            badge: null,
        },
    ]

    // OWNER - Full access to all features
    if (role === "OWNER") {
        return [
            ...baseItems,
            {
                href: "/hris/masterdata",
                label: "Master Data",
                icon: Database,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-500",
                activeIconBg: "bg-orange-500",
                activeBg: "bg-orange-50",
                activeBorder: "bg-orange-500",
                activeText: "text-orange-700",
                badge: null,
                subItems: [
                    {
                        href: "/hris/masterdata/departments",
                        label: "Departemen",
                        icon: Building2,
                    },
                    {
                        href: "/hris/masterdata/positions",
                        label: "Posisi",
                        icon: Briefcase,
                    },
                ],
            },
            {
                href: "/hris/employees",
                label: "Data Pegawai",
                icon: Users,
                iconBg: "bg-violet-50",
                iconColor: "text-violet-500",
                activeIconBg: "bg-violet-500",
                activeBg: "bg-violet-50",
                activeBorder: "bg-violet-500",
                activeText: "text-violet-700",
                badge: null,
            },
            {
                href: "/hris/attendance",
                label: "Absensi",
                icon: Clock,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
                activeIconBg: "bg-emerald-500",
                activeBg: "bg-emerald-50",
                activeBorder: "bg-emerald-500",
                activeText: "text-emerald-700",
                badge: null,
            },
            {
                href: "/hris/daily-report",
                label: "Laporan Kerja",
                icon: FileText,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-500",
                activeIconBg: "bg-amber-500",
                activeBg: "bg-amber-50",
                activeBorder: "bg-amber-500",
                activeText: "text-amber-700",
                badge: null,
            },
            {
                href: "/hris/leave",
                label: "Cuti & Izin",
                icon: CalendarDays,
                iconBg: "bg-rose-50",
                iconColor: "text-rose-500",
                activeIconBg: "bg-rose-500",
                activeBg: "bg-rose-50",
                activeBorder: "bg-rose-500",
                activeText: "text-rose-700",
                badge: null,
            },
            {
                href: "/hris/payroll",
                label: "Payroll",
                icon: DollarSign,
                iconBg: "bg-cyan-50",
                iconColor: "text-cyan-500",
                activeIconBg: "bg-cyan-500",
                activeBg: "bg-cyan-50",
                activeBorder: "bg-cyan-500",
                activeText: "text-cyan-700",
                badge: null,
            },
            {
                href: "/hris/reports",
                label: "Report",
                icon: BarChart3,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-500",
                activeIconBg: "bg-indigo-500",
                activeBg: "bg-indigo-50",
                activeBorder: "bg-indigo-500",
                activeText: "text-indigo-700",
                badge: null,
                subItems: [
                    {
                        href: "/hris/reports/attendance",
                        label: "Absensi",
                        icon: ClipboardList,
                    },
                ],
            },
        ]
    }

    // HR Admin - Full access
    if (role === "HR_ADMIN") {
        return [
            ...baseItems,
            {
                href: "/hris/masterdata",
                label: "Master Data",
                icon: Database,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-500",
                activeIconBg: "bg-orange-500",
                activeBg: "bg-orange-50",
                activeBorder: "bg-orange-500",
                activeText: "text-orange-700",
                badge: null,
                subItems: [
                    {
                        href: "/hris/masterdata/departments",
                        label: "Departemen",
                        icon: Building2,
                    },
                    {
                        href: "/hris/masterdata/positions",
                        label: "Posisi",
                        icon: Briefcase,
                    },
                ],
            },
            {
                href: "/hris/employees",
                label: "Data Pegawai",
                icon: Users,
                iconBg: "bg-violet-50",
                iconColor: "text-violet-500",
                activeIconBg: "bg-violet-500",
                activeBg: "bg-violet-50",
                activeBorder: "bg-violet-500",
                activeText: "text-violet-700",
                badge: null,
            },
            {
                href: "/hris/attendance",
                label: "Absensi",
                icon: Clock,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
                activeIconBg: "bg-emerald-500",
                activeBg: "bg-emerald-50",
                activeBorder: "bg-emerald-500",
                activeText: "text-emerald-700",
                badge: null,
            },
            {
                href: "/hris/daily-report",
                label: "Laporan Kerja",
                icon: FileText,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-500",
                activeIconBg: "bg-amber-500",
                activeBg: "bg-amber-50",
                activeBorder: "bg-amber-500",
                activeText: "text-amber-700",
                badge: null,
            },
            {
                href: "/hris/leave",
                label: "Cuti & Izin",
                icon: CalendarDays,
                iconBg: "bg-rose-50",
                iconColor: "text-rose-500",
                activeIconBg: "bg-rose-500",
                activeBg: "bg-rose-50",
                activeBorder: "bg-rose-500",
                activeText: "text-rose-700",
                badge: "3",
            },
            {
                href: "/hris/payroll",
                label: "Payroll",
                icon: DollarSign,
                iconBg: "bg-cyan-50",
                iconColor: "text-cyan-500",
                activeIconBg: "bg-cyan-500",
                activeBg: "bg-cyan-50",
                activeBorder: "bg-cyan-500",
                activeText: "text-cyan-700",
                badge: null,
            },
            {
                href: "/hris/reports",
                label: "Report",
                icon: BarChart3,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-500",
                activeIconBg: "bg-indigo-500",
                activeBg: "bg-indigo-50",
                activeBorder: "bg-indigo-500",
                activeText: "text-indigo-700",
                badge: null,
                subItems: [
                    {
                        href: "/hris/reports/attendance",
                        label: "Absensi",
                        icon: ClipboardList,
                    },
                ],
            },
        ]
    }

    // Manager - Team oversight + personal access
    if (role === "MANAGER") {
        return [
            ...baseItems,
            {
                href: "/hris/attendance",
                label: "Absensi",
                icon: Clock,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
                activeIconBg: "bg-emerald-500",
                activeBg: "bg-emerald-50",
                activeBorder: "bg-emerald-500",
                activeText: "text-emerald-700",
                badge: null,
            },
            {
                href: "/hris/daily-report",
                label: "Laporan Kerja",
                icon: FileText,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-500",
                activeIconBg: "bg-amber-500",
                activeBg: "bg-amber-50",
                activeBorder: "bg-amber-500",
                activeText: "text-amber-700",
                badge: null,
            },
            {
                href: "/hris/leave",
                label: "Cuti & Izin",
                icon: CalendarDays,
                iconBg: "bg-rose-50",
                iconColor: "text-rose-500",
                activeIconBg: "bg-rose-500",
                activeBg: "bg-rose-50",
                activeBorder: "bg-rose-500",
                activeText: "text-rose-700",
                badge: "3",
            },
            {
                href: "/hris/reports",
                label: "Report",
                icon: BarChart3,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-500",
                activeIconBg: "bg-indigo-500",
                activeBg: "bg-indigo-50",
                activeBorder: "bg-indigo-500",
                activeText: "text-indigo-700",
                badge: null,
                subItems: [
                    {
                        href: "/hris/reports/attendance",
                        label: "Absensi",
                        icon: ClipboardList,
                    },
                ],
            },
        ]
    }

    // Team Leader - Team oversight for their team + personal access
    if (role === "TEAM_LEADER") {
        return [
            ...baseItems,
            {
                href: "/hris/attendance",
                label: "Absensi",
                icon: Clock,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
                activeIconBg: "bg-emerald-500",
                activeBg: "bg-emerald-50",
                activeBorder: "bg-emerald-500",
                activeText: "text-emerald-700",
                badge: null,
            },
            {
                href: "/hris/daily-report",
                label: "Laporan Kerja",
                icon: FileText,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-500",
                activeIconBg: "bg-amber-500",
                activeBg: "bg-amber-50",
                activeBorder: "bg-amber-500",
                activeText: "text-amber-700",
                badge: null,
            },
            {
                href: "/hris/leave",
                label: "Cuti & Izin",
                icon: CalendarDays,
                iconBg: "bg-rose-50",
                iconColor: "text-rose-500",
                activeIconBg: "bg-rose-500",
                activeBg: "bg-rose-50",
                activeBorder: "bg-rose-500",
                activeText: "text-rose-700",
                badge: null,
            },
            {
                href: "/hris/reports",
                label: "Report",
                icon: BarChart3,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-500",
                activeIconBg: "bg-indigo-500",
                activeBg: "bg-indigo-50",
                activeBorder: "bg-indigo-500",
                activeText: "text-indigo-700",
                badge: null,
                subItems: [
                    {
                        href: "/hris/reports/attendance",
                        label: "Absensi",
                        icon: ClipboardList,
                    },
                ],
            },
        ]
    }

    // Employee, Staff - Personal access
    return [
        ...baseItems,
        {
            href: "/hris/attendance",
            label: "Absensi",
            icon: Clock,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-500",
            activeIconBg: "bg-emerald-500",
            activeBg: "bg-emerald-50",
            activeBorder: "bg-emerald-500",
            activeText: "text-emerald-700",
            badge: null,
        },
        {
            href: "/hris/daily-report",
            label: "Laporan Kerja",
            icon: FileText,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
            activeIconBg: "bg-amber-500",
            activeBg: "bg-amber-50",
            activeBorder: "bg-amber-500",
            activeText: "text-amber-700",
            badge: null,
        },
        {
            href: "/hris/leave",
            label: "Cuti & Izin",
            icon: CalendarDays,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
            activeIconBg: "bg-rose-500",
            activeBg: "bg-rose-50",
            activeBorder: "bg-rose-500",
            activeText: "text-rose-700",
            badge: null,
        },
        {
            href: "/hris/payroll",
            label: "Slip Gaji",
            icon: DollarSign,
            iconBg: "bg-cyan-50",
            iconColor: "text-cyan-500",
            activeIconBg: "bg-cyan-500",
            activeBg: "bg-cyan-50",
            activeBorder: "bg-cyan-500",
            activeText: "text-cyan-700",
            badge: null,
        },
    ]
}

const getRoleLabel = (role: string | undefined) => {
    switch (role) {
        case "OWNER":
            return "Owner"
        case "HR_ADMIN":
            return "HR Admin"
        case "MANAGER":
            return "Manager"
        case "TEAM_LEADER":
            return "Team Leader"
        case "EMPLOYEE":
            return "Karyawan"
        case "STAFF":
            return "Staff"
        default:
            return "User"
    }
}

export function HRISSidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const activeModules = useAuthStore((state) => state.activeModules)
    const { collapsed } = useSidebarState()
    const [appSwitcherOpen, setAppSwitcherOpen] = useState(false)
    const [expandedMenus, setExpandedMenus] = useState<string[]>([])

    const accessibleApps = getAccessibleApps(user?.role, activeModules)
    const currentApp = accessibleApps.find(item => item.key === "hris")

    const navItems = getNavItems(user?.role)

    const handleLogout = () => {
        logout()
        router.replace("/login")
    }

    const isActive = (href: string) => {
        if (href === "/hris") return pathname === "/hris"
        return pathname.startsWith(href)
    }

    const toggleMenu = (href: string) => {
        setExpandedMenus(prev =>
            prev.includes(href)
                ? prev.filter(h => h !== href)
                : [...prev, href]
        )
    }

    const initials = (name?: string) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    if (!currentApp) return null

    return (
        <aside
            className={cn(
                "flex h-screen flex-col bg-white border-r border-slate-200 shrink-0 shadow-xl transition-all duration-300 ease-in-out",
                collapsed ? "w-[68px]" : "w-64"
            )}
        >
            {/* ── App Switcher ── */}
            <div className={cn(
                "border-b border-slate-200 shrink-0",
                collapsed ? "px-2 py-3" : "px-3 py-3"
            )}>
                {collapsed ? (
                    /* Collapsed: show only current app icon */
                    <button
                        onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
                        className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105"
                    >
                        <Building2 className="h-5 w-5 text-white" />
                    </button>
                ) : (
                    /* Expanded: show app switcher button */
                    <button
                        onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-all hover:bg-slate-50"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-indigo-500/30">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <span className="text-base font-bold text-slate-800 block truncate">{currentApp.label}</span>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase truncate">{currentApp.description}</p>
                        </div>
                        <ChevronDown className={cn(
                            "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200",
                            appSwitcherOpen && "rotate-180"
                        )} />
                    </button>
                )}

                {/* Dropdown */}
                {appSwitcherOpen && (
                    <div className={cn(
                        "mt-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50/80 p-1.5",
                        collapsed && "absolute left-[68px] top-2 z-50 w-52 bg-white shadow-xl border-slate-200"
                    )}>
                        {accessibleApps.map((app) => {
                            const AppIcon = app.icon
                            const isCurrent = app.key === "hris"
                            return (
                                <button
                                    key={app.key}
                                    onClick={() => {
                                        if (!isCurrent) router.push(app.href)
                                        setAppSwitcherOpen(false)
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                                        isCurrent
                                            ? "bg-white shadow-sm border border-slate-200/80 text-slate-800 font-semibold"
                                            : "text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                                        app.gradient
                                    )}>
                                        <AppIcon className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <span className="block text-sm truncate">{app.label}</span>
                                        <span className="block text-[10px] text-slate-400 truncate">{app.description}</span>
                                    </div>
                                    {isCurrent && (
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1">
                <nav className={cn("py-4 space-y-1", collapsed ? "px-2" : "px-3")}>
                    {!collapsed && (
                        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Menu Utama
                        </p>
                    )}

                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        const Icon = item.icon
                        const hasSubItems = item.subItems && item.subItems.length > 0
                        const isExpanded = expandedMenus.includes(item.href)

                        return (
                            <div key={item.href}>
                                {hasSubItems && !collapsed ? (
                                    <>
                                        <button
                                            onClick={() => toggleMenu(item.href)}
                                            className={cn(
                                                "w-full group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 px-3 py-2.5",
                                                active
                                                    ? `${item.activeBg} border border-slate-200/80 ${item.activeText}`
                                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                            )}
                                        >
                                            {/* Active left border accent */}
                                            {active && (
                                                <span className={cn(
                                                    "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full",
                                                    item.activeBorder
                                                )} />
                                            )}

                                            <span className={cn(
                                                "flex items-center justify-center rounded-lg shrink-0 transition-all duration-200 h-7 w-7",
                                                active ? item.activeIconBg : item.iconBg
                                            )}>
                                                <Icon className={cn(
                                                    "h-4 w-4 transition-all",
                                                    active ? "text-white" : item.iconColor
                                                )} />
                                            </span>

                                            <span className="flex-1 truncate text-left">{item.label}</span>
                                            <ChevronDown className={cn(
                                                "h-4 w-4 shrink-0 transition-transform duration-200",
                                                isExpanded && "rotate-180"
                                            )} />
                                        </button>

                                        {/* Submenu */}
                                        {isExpanded && item.subItems && (
                                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                                                {item.subItems.map((subItem) => {
                                                    const SubIcon = subItem.icon
                                                    const subActive = pathname === subItem.href
                                                    return (
                                                        <Link
                                                            key={subItem.href}
                                                            href={subItem.href}
                                                            className={cn(
                                                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                                                                subActive
                                                                    ? "bg-slate-100 text-slate-900 font-medium"
                                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                                            )}
                                                        >
                                                            <SubIcon className="h-4 w-4" />
                                                            <span>{subItem.label}</span>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        title={collapsed ? item.label : undefined}
                                        className={cn(
                                            "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            collapsed ? "justify-center p-2" : "px-3 py-2.5",
                                            active
                                                ? `${item.activeBg} border border-slate-200/80 ${item.activeText}`
                                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                        )}
                                    >
                                        {/* Active left border accent */}
                                        {active && !collapsed && (
                                            <span className={cn(
                                                "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full",
                                                item.activeBorder
                                            )} />
                                        )}

                                        <span className={cn(
                                            "flex items-center justify-center rounded-lg shrink-0 transition-all duration-200",
                                            collapsed ? "h-9 w-9" : "h-7 w-7",
                                            active ? item.activeIconBg : item.iconBg
                                        )}>
                                            <Icon className={cn(
                                                "h-4 w-4 transition-all",
                                                active ? "text-white" : item.iconColor
                                            )} />
                                        </span>

                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 truncate">{item.label}</span>
                                                {item.badge && (
                                                    <Badge className="bg-rose-100 text-rose-500 border-rose-200 text-[9px] px-1.5 py-0 h-4 font-semibold hover:bg-rose-100">
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                                {active && (
                                                    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0", item.iconColor)} />
                                                )}
                                            </>
                                        )}
                                    </Link>
                                )}
                            </div>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Divider */}
            <div className="mx-3 h-px bg-slate-200" />

            {/* User Profile */}
            <div className={cn(
                "shrink-0",
                collapsed ? "p-2" : "p-3"
            )}>
                <div className={cn(
                    "flex items-center gap-3 rounded-xl transition-all",
                    collapsed ? "justify-center p-2" : "px-3 py-2.5 hover:bg-slate-50"
                )}>
                    <Avatar className={cn(
                        "shrink-0 border-2 border-white shadow-sm",
                        collapsed ? "h-9 w-9" : "h-9 w-9"
                    )}>
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-sm font-semibold">
                            {initials(user?.name)}
                        </AvatarFallback>
                    </Avatar>

                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-slate-500 truncate">{getRoleLabel(user?.role)}</p>
                        </div>
                    )}

                    {!collapsed && (
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {collapsed && (
                    <button
                        onClick={handleLogout}
                        className="mt-2 w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                )}
            </div>
        </aside>
    )
}

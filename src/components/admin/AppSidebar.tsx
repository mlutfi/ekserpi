"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { useSidebarState } from "@/lib/useSidebarState"
import { getAccessibleApps } from "@/lib/appSwitcher"
import Link from "next/link"
import {
    LayoutDashboard,
    LogOut,
    ChevronRight,
    ChevronDown,
    ShoppingCart,
    Layers,
    TrendingUp,
    Box,
    Users,
    Package,
    Sparkles,
    LayoutGrid,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        iconBg: "bg-sky-50",
        iconColor: "text-sky-500",
        activeIconBg: "bg-sky-500",
        activeBg: "bg-sky-50",
        activeBorder: "bg-sky-500",
        activeText: "text-sky-700",
        badge: null,
    },
    {
        href: "/admin/products",
        label: "Produk",
        icon: Box,
        iconBg: "bg-violet-50",
        iconColor: "text-violet-500",
        activeIconBg: "bg-violet-500",
        activeBg: "bg-violet-50",
        activeBorder: "bg-violet-500",
        activeText: "text-violet-700",
        badge: null,
    },
    {
        href: "/admin/categories",
        label: "Kategori",
        icon: Layers,
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-500",
        activeIconBg: "bg-indigo-500",
        activeBg: "bg-indigo-50",
        activeBorder: "bg-indigo-500",
        activeText: "text-indigo-700",
        badge: null,
    },
    {
        href: "/admin/stock",
        label: "Stok",
        icon: Package,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        activeIconBg: "bg-emerald-500",
        activeBg: "bg-emerald-50",
        activeBorder: "bg-emerald-500",
        activeText: "text-emerald-700",
        badge: null,
    },
    {
        href: "/admin/users",
        label: "Pengguna",
        icon: Users,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        activeIconBg: "bg-amber-500",
        activeBg: "bg-amber-50",
        activeBorder: "bg-amber-500",
        activeText: "text-amber-700",
        badge: null,
    },
    {
        href: "/admin/reports",
        label: "Laporan",
        icon: TrendingUp,
        iconBg: "bg-rose-50",
        iconColor: "text-rose-500",
        activeIconBg: "bg-rose-500",
        activeBg: "bg-rose-50",
        activeBorder: "bg-rose-500",
        activeText: "text-rose-700",
        badge: "Baru",
    },
    {
        href: "/admin/modules",
        label: "Modul",
        icon: Sparkles,
        iconBg: "bg-cyan-50",
        iconColor: "text-cyan-500",
        activeIconBg: "bg-cyan-500",
        activeBg: "bg-cyan-50",
        activeBorder: "bg-cyan-500",
        activeText: "text-cyan-700",
        badge: null,
        requiredRole: "OWNER",
    },
]



export function AppSidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const activeModules = useAuthStore((state) => state.activeModules)
    const { collapsed } = useSidebarState()
    const [appSwitcherOpen, setAppSwitcherOpen] = useState(false)

    const accessibleApps = getAccessibleApps(user?.role, activeModules)
    const currentApp = accessibleApps.find(item => item.key === "admin")

    const handleLogout = () => {
        logout()
        router.replace("/login")
    }

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin"
        return pathname.startsWith(href)
    }

    const initials = (name?: string) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    // If current app not accessible (shouldn't happen), fallback
    if (!currentApp) return null

    return (
        <aside
            className={cn(
                "flex h-screen flex-col bg-white border-r border-slate-100 shrink-0 shadow-[1px_0_12px_0_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out",
                collapsed ? "w-[68px]" : "w-64"
            )}
        >
            {/* ── App Switcher ── */}
            <div className={cn(
                "border-b border-slate-100 shrink-0",
                collapsed ? "px-2 py-3" : "px-3 py-3"
            )}>
                {collapsed ? (
                    /* Collapsed: show only current app icon */
                    <button
                        onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
                        className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50 transition-transform hover:scale-105"
                    >
                        <LayoutGrid className="h-5 w-5 text-white" />
                    </button>
                ) : (
                    /* Expanded: show app switcher button */
                    <button
                        onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-all hover:bg-slate-50"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <span className="text-sm font-bold text-slate-800 block truncate">{currentApp.label}</span>
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
                            const isCurrent = app.key === "admin"
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
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-orange-400" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Navigation ── */}
            <ScrollArea className="flex-1">
                <nav className={cn("py-4 space-y-1", collapsed ? "px-2" : "px-3")}>
                    {!collapsed && (
                        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Menu Utama
                        </p>
                    )}

                    {navItems.map((item) => {
                        // Skip items that require specific role
                        if (item.requiredRole && user?.role !== item.requiredRole) {
                            return null
                        }
                        const active = isActive(item.href)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    collapsed ? "justify-center p-2" : "px-3 py-2.5",
                                    active
                                        ? `${item.activeBg} border border-slate-200/80 ${item.activeText}`
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                )}
                            >
                                {/* Active left border accent — only in expanded mode */}
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
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* ── Divider ── */}
            <div className="mx-3 h-px bg-slate-100" />

            {/* ── Go to POS ── */}
            <div className={cn("py-3", collapsed ? "px-2" : "px-3")}>
                <button
                    onClick={() => router.push("/pos")}
                    title={collapsed ? "Buka POS" : undefined}
                    className={cn(
                        "flex w-full items-center rounded-xl bg-orange-50 text-orange-700 border border-orange-100 text-sm font-medium transition-all duration-200 hover:bg-orange-100 hover:border-orange-200",
                        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                    )}
                >
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                        <>
                            <span className="flex-1 text-left">Buka POS</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </>
                    )}
                </button>
            </div>

            {/* ── User Footer ── */}
            <div className={cn(
                "border-t border-slate-100 py-4",
                collapsed ? "px-2" : "px-3"
            )}>
                {collapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xs font-bold">
                                {initials(user?.name)}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            onClick={handleLogout}
                            title="Keluar"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xs font-bold">
                                {initials(user?.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                                {user?.name || "User"}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-tight">
                                {user?.role || ""}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Keluar"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </aside >
    )
}

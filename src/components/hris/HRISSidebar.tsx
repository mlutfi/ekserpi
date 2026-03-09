"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { getHrisNavItems } from "@/lib/sidebar"
import {
    LogOut,
    ChevronRight,
    ChevronDown,
    Building2,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/lib/store"
import { useSidebarState } from "@/lib/useSidebarState"
import { getAccessibleApps, getCurrentApp } from "@/lib/appSwitcher"
import { createPortal } from "react-dom"

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
    const [collapsedOpenMenu, setCollapsedOpenMenu] = useState<string | null>(null)
    const [collapsedMenuPosition, setCollapsedMenuPosition] = useState<{ left: number, top: number } | null>(null)
    const closeCollapsedMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const accessibleApps = getAccessibleApps(user?.role, activeModules)
    const currentApp = getCurrentApp("hris")

    const navItems = getHrisNavItems(user?.role)

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

    const clearCollapsedMenuCloseTimer = () => {
        if (!closeCollapsedMenuTimerRef.current) return
        clearTimeout(closeCollapsedMenuTimerRef.current)
        closeCollapsedMenuTimerRef.current = null
    }

    const closeCollapsedMenu = () => {
        clearCollapsedMenuCloseTimer()
        setCollapsedOpenMenu(null)
        setCollapsedMenuPosition(null)
    }

    const scheduleCollapsedMenuClose = () => {
        clearCollapsedMenuCloseTimer()
        closeCollapsedMenuTimerRef.current = setTimeout(() => {
            setCollapsedOpenMenu(null)
            setCollapsedMenuPosition(null)
        }, 140)
    }

    const openCollapsedMenu = (href: string, element: HTMLElement) => {
        clearCollapsedMenuCloseTimer()
        const rect = element.getBoundingClientRect()
        setCollapsedMenuPosition({
            left: rect.right + 8,
            top: rect.top,
        })
        setCollapsedOpenMenu(href)
    }

    useEffect(() => {
        closeCollapsedMenu()
    }, [pathname, collapsed])

    useEffect(() => {
        return () => {
            clearCollapsedMenuCloseTimer()
        }
    }, [])

    const initials = (name?: string) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    if (!currentApp) return null

    return (
        <TooltipProvider delayDuration={0}>
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
                            className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 shadow-sm transition-transform hover:scale-105"
                        >
                            <Building2 className="h-4 w-4 text-white" />
                        </button>
                    ) : (
                        /* Expanded: show app switcher button */
                        <button
                            onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-all hover:bg-zinc-100/80"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
                                <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <span className="text-sm font-semibold text-zinc-900 block truncate">{currentApp.label}</span>
                                <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase truncate">{currentApp.description}</p>
                            </div>
                            <ChevronDown className={cn(
                                "h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200",
                                appSwitcherOpen && "rotate-180"
                            )} />
                        </button>
                    )}

                    {/* Dropdown */}
                    {appSwitcherOpen && (
                        <div className={cn(
                            "mt-2 space-y-1 rounded-md border border-zinc-200 bg-zinc-50 p-1.5",
                            collapsed && "absolute left-[68px] top-2 z-50 w-52 bg-white shadow-xl border-zinc-200"
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
                                            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all",
                                            isCurrent
                                                ? "bg-white shadow-sm border border-zinc-200 text-zinc-900 font-semibold"
                                                : "text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-linear-to-br",
                                            app.gradient
                                        )}>
                                            <AppIcon className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <span className="block text-sm truncate">{app.label}</span>
                                            <span className="block text-[10px] text-zinc-500 truncate">{app.description}</span>
                                        </div>
                                        {isCurrent && (
                                            <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-900" />
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
                            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                Menu Utama
                            </p>
                        )}

                        {navItems.map((item) => {
                            const active = isActive(item.href)
                            const Icon = item.icon
                            const hasSubItems = item.subItems && item.subItems.length > 0
                            const isExpanded = expandedMenus.includes(item.href)
                            const isCollapsedSubmenuOpen = collapsedOpenMenu === item.href

                            return (
                                <div key={item.href} className={cn(collapsed && hasSubItems && "relative")}>
                                    {hasSubItems && !collapsed ? (
                                        <>
                                            <button
                                                onClick={() => toggleMenu(item.href)}
                                                className={cn(
                                                    "w-full group relative flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 px-3 py-2.5",
                                                    active
                                                        ? "bg-zinc-50/80 border border-zinc-200 text-zinc-900"
                                                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                                                )}
                                            >
                                                {/* Active left border accent */}
                                                {active && (
                                                    <span className={cn(
                                                        "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full",
                                                        "bg-zinc-900"
                                                    )} />
                                                )}

                                                <span className={cn(
                                                    "flex items-center justify-center rounded-md shrink-0 transition-all duration-200 h-7 w-7",
                                                    active ? "bg-zinc-100" : "bg-transparent"
                                                )}>
                                                    <Icon className={cn(
                                                        "h-4 w-4 transition-all",
                                                        active ? "text-zinc-900" : "text-zinc-500"
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
                                                <div className="ml-4 mt-1 space-y-1 border-l-2 border-zinc-200 pl-3">
                                                    {item.subItems.map((subItem) => {
                                                        const SubIcon = subItem.icon
                                                        const subActive = pathname === subItem.href
                                                        return (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                className={cn(
                                                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
                                                                    subActive
                                                                        ? "bg-zinc-100 text-zinc-900 font-medium"
                                                                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
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
                                    ) : hasSubItems && collapsed ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    aria-haspopup="menu"
                                                    aria-expanded={isCollapsedSubmenuOpen}
                                                    onClick={(event) => {
                                                        event.preventDefault()
                                                        if (isCollapsedSubmenuOpen) {
                                                            closeCollapsedMenu()
                                                            return
                                                        }
                                                        openCollapsedMenu(item.href, event.currentTarget)
                                                    }}
                                                    onMouseEnter={(event) => {
                                                        openCollapsedMenu(item.href, event.currentTarget)
                                                    }}
                                                    onMouseLeave={scheduleCollapsedMenuClose}
                                                    className={cn(
                                                        "group relative flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 justify-center p-2 w-full",
                                                        active
                                                            ? "bg-zinc-50/80 border border-zinc-200 text-zinc-900"
                                                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "flex items-center justify-center rounded-md shrink-0 transition-all duration-200 h-9 w-9",
                                                        active ? "bg-zinc-100" : "bg-transparent"
                                                    )}>
                                                        <Icon className={cn(
                                                            "h-4 w-4 transition-all",
                                                            active ? "text-zinc-900" : "text-zinc-500"
                                                        )} />
                                                    </span>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                align="start"
                                                alignOffset={90}
                                                sideOffset={5}
                                                className="z-[90] border-zinc-800 bg-zinc-900 text-zinc-50 shadow-lg"
                                            >
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                ) : collapsed ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "group relative flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 justify-center p-2",
                                                    active
                                                        ? "bg-zinc-50/80 border border-zinc-200 text-zinc-900"
                                                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                                                )}
                                            >
                                                <span className={cn(
                                                    "flex items-center justify-center rounded-md shrink-0 transition-all duration-200 h-9 w-9",
                                                    active ? "bg-zinc-100" : "bg-transparent"
                                                )}>
                                                    <Icon className={cn(
                                                        "h-4 w-4 transition-all",
                                                        active ? "text-zinc-900" : "text-zinc-500"
                                                    )} />
                                                </span>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="right"
                                            align="start"
                                            alignOffset={10}
                                            sideOffset={5}
                                            className="z-[90] border-zinc-800 bg-zinc-900 text-zinc-50 shadow-lg"
                                        >
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "group relative flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 px-3 py-2.5",
                                            active
                                                ? "bg-zinc-50/80 border border-zinc-200 text-zinc-900"
                                                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                                        )}
                                    >
                                        {/* Active left border accent */}
                                        {active && (
                                            <span className={cn(
                                                "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full",
                                                "bg-zinc-900"
                                            )} />
                                        )}

                                        <span className={cn(
                                            "flex items-center justify-center rounded-md shrink-0 transition-all duration-200 h-7 w-7",
                                            active ? "bg-zinc-100" : "bg-transparent"
                                        )}>
                                            <Icon className={cn(
                                                "h-4 w-4 transition-all",
                                                active ? "text-zinc-900" : "text-zinc-500"
                                            )} />
                                        </span>

                                        <>
                                            <span className="flex-1 truncate">{item.label}</span>
                                            {item.badge && (
                                                <Badge className="bg-zinc-100 text-zinc-900 border-zinc-200 text-[9px] px-1.5 py-0 h-4 font-semibold hover:bg-zinc-200">
                                                    {item.badge}
                                                </Badge>
                                            )}
                                            {active && (
                                                <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-zinc-400")} />
                                            )}
                                        </>
                                    </Link>
                                )}
                                </div>
                            )
                        })}
                    </nav>
                </ScrollArea>

                {collapsed && collapsedOpenMenu && collapsedMenuPosition && createPortal(
                    (() => {
                        const openItem = navItems.find(
                            (item) => item.href === collapsedOpenMenu && item.subItems && item.subItems.length > 0
                        )
                        if (!openItem?.subItems) return null

                        return (
                            <div
                                className="fixed z-[80] w-56 rounded-md border border-zinc-200 bg-white p-1.5 shadow-lg max-h-[calc(100vh-16px)] overflow-y-auto"
                                style={{
                                    left: collapsedMenuPosition.left,
                                    top: collapsedMenuPosition.top,
                                }}
                                onMouseEnter={clearCollapsedMenuCloseTimer}
                                onMouseLeave={scheduleCollapsedMenuClose}
                            >
                                {openItem.subItems.map((subItem) => {
                                    const SubIcon = subItem.icon
                                    const subActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/")
                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            onClick={closeCollapsedMenu}
                                            className={cn(
                                                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-all",
                                                subActive
                                                    ? "bg-zinc-100 text-zinc-900 font-medium"
                                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                            )}
                                        >
                                            <SubIcon className="h-4 w-4" />
                                            <span>{subItem.label}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        )
                    })(),
                    document.body
                )}

                {/* Divider */}
                <div className="mx-3 h-px bg-zinc-200" />

                {/* User Profile */}
                <div className={cn(
                    "shrink-0",
                    collapsed ? "p-2" : "p-3"
                )}>
                    <div className={cn(
                        "flex items-center gap-3 rounded-md transition-all",
                        collapsed ? "justify-center p-2" : "px-3 py-2.5 hover:bg-zinc-50"
                    )}>
                        <Avatar className={cn(
                            "shrink-0 border border-zinc-200 shadow-sm",
                            collapsed ? "h-9 w-9" : "h-9 w-9"
                        )}>
                            <AvatarFallback className="bg-zinc-900 text-white text-sm font-semibold">
                                {initials(user?.name)}
                            </AvatarFallback>
                        </Avatar>

                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 truncate">{user?.name || "User"}</p>
                                <p className="text-xs text-zinc-500 truncate">{getRoleLabel(user?.role)}</p>
                            </div>
                        )}

                        {!collapsed && (
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {collapsed && (
                        <button
                            onClick={handleLogout}
                            className="mt-2 w-full flex items-center justify-center p-2 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    )
}

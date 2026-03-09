"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store"
import {
    LayoutDashboard,
    Clock,
    FileText,
    CalendarDays,
    User,
    Package,
    ShoppingCart,
    Building2,
    Banknote,
    LucideIcon,
} from "lucide-react"

interface NavItem {
    href: string
    label: string
    icon: LucideIcon
    activeColor: string
    activeBg: string
}

const hrisNavItems: NavItem[] = [
    {
        href: "/hris",
        label: "Home",
        icon: LayoutDashboard,
        activeColor: "text-blue-600",
        activeBg: "bg-blue-50",
    },
    {
        href: "/hris/attendance",
        label: "Absensi",
        icon: Clock,
        activeColor: "text-emerald-600",
        activeBg: "bg-emerald-50",
    },
    {
        href: "/hris/daily-report",
        label: "Laporan",
        icon: FileText,
        activeColor: "text-amber-600",
        activeBg: "bg-amber-50",
    },
    {
        href: "/hris/leave",
        label: "Cuti",
        icon: CalendarDays,
        activeColor: "text-rose-600",
        activeBg: "bg-rose-50",
    },
    {
        href: "/hris/profile",
        label: "Profil",
        icon: User,
        activeColor: "text-violet-600",
        activeBg: "bg-violet-50",
    },
]

const adminNavItems: NavItem[] = [
    {
        href: "/admin",
        label: "Home",
        icon: LayoutDashboard,
        activeColor: "text-sky-600",
        activeBg: "bg-sky-50",
    },
    {
        href: "/admin/sales",
        label: "Sales",
        icon: ShoppingCart,
        activeColor: "text-sky-600",
        activeBg: "bg-sky-50",
    },
    {
        href: "/admin/purchase",
        label: "Purchase",
        icon: ShoppingCart,
        activeColor: "text-indigo-600",
        activeBg: "bg-indigo-50",
    },
    {
        href: "/admin/inventory",
        label: "Inventory",
        icon: Package,
        activeColor: "text-emerald-600",
        activeBg: "bg-emerald-50",
    },
    {
        href: "/admin/production",
        label: "Production",
        icon: Building2,
        activeColor: "text-violet-600",
        activeBg: "bg-violet-50",
    },
    {
        href: "/admin/finance",
        label: "Finance",
        icon: Banknote,
        activeColor: "text-amber-600",
        activeBg: "bg-amber-50",
    },
]

interface FloatingBottomNavProps {
    module: "hris" | "admin"
}

export function FloatingBottomNav({ module }: FloatingBottomNavProps) {
    const pathname = usePathname()
    const user = useAuthStore((state) => state.user)

    const items = module === "hris" ? hrisNavItems : adminNavItems

    const isActive = (href: string) => {
        // Exact match for home pages
        if (href === "/hris" || href === "/admin") return pathname === href
        return pathname.startsWith(href)
    }

    // Replace profile href placeholder with the user initials display
    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Gradient fade above the nav */}
            <div className="h-6 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

            <nav className="mx-3 mb-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] px-1 py-1.5">
                <div className="flex items-center justify-around">
                    {items.map((item) => {
                        const active = isActive(item.href)
                        const Icon = item.icon
                        const isProfile = item.label === "Profil"

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative min-w-[56px]",
                                    active
                                        ? `${item.activeBg} ${item.activeColor}`
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {isProfile && user?.name ? (
                                    <div className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                        active
                                            ? "bg-violet-500 text-white ring-2 ring-violet-200"
                                            : "bg-slate-200 text-slate-500"
                                    )}>
                                        {getInitials(user.name)}
                                    </div>
                                ) : (
                                    <Icon className={cn(
                                        "h-5 w-5 transition-all duration-200",
                                        active && "scale-110"
                                    )} />
                                )}
                                <span className={cn(
                                    "text-[10px] font-medium leading-tight transition-all",
                                    active ? "font-semibold" : ""
                                )}>
                                    {item.label}
                                </span>

                                {/* Active indicator dot */}
                                {active && (
                                    <span className={cn(
                                        "absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full",
                                        item.activeColor.replace("text-", "bg-")
                                    )} />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

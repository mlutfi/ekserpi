"use client"

import React from "react"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Clock,
    FileText,
    CalendarDays,
    DollarSign,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react"
import { useSidebarState } from "@/lib/useSidebarState"

const breadcrumbMap: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    "/hris": { label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500" },
    "/hris/employees": { label: "Data Pegawai", icon: Users, color: "text-violet-500" },
    "/hris/attendance": { label: "Absensi", icon: Clock, color: "text-emerald-500" },
    "/hris/daily-report": { label: "Laporan Kerja", icon: FileText, color: "text-amber-500" },
    "/hris/leave": { label: "Cuti & Izin", icon: CalendarDays, color: "text-rose-500" },
    "/hris/payroll": { label: "Payroll", icon: DollarSign, color: "text-cyan-500" },
}

export function HrisHeader() {
    const pathname = usePathname()
    const { collapsed, toggleCollapsed } = useSidebarState()

    const currentPage = Object.entries(breadcrumbMap).find(([path]) => {
        if (path === "/hris") return pathname === "/hris"
        return pathname.startsWith(path)
    })

    const Icon = currentPage?.[1].icon
    const label = currentPage?.[1].label || "HRIS"
    const color = currentPage?.[1].color || "text-slate-500"

    return (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-6 shadow-sm">
            {/* Sidebar Toggle */}
            <button
                onClick={toggleCollapsed}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
            >
                {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                ) : (
                    <PanelLeftClose className="h-4 w-4" />
                )}
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200" />

            {/* Page Name */}
            <div className="flex items-center gap-2.5">
                {Icon && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                        <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                )}
                <div>
                    <h1 className="text-sm font-semibold text-slate-800">{label}</h1>
                </div>
            </div>
        </header>
    )
}

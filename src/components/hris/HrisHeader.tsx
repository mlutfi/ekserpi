"use client"

import React, { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Clock,
    FileText,
    CalendarDays,
    DollarSign,
    PanelLeftClose,
    PanelLeftOpen,
    KeyRound,
    LogOut,
} from "lucide-react"
import { useSidebarState } from "@/lib/useSidebarState"
import { useAuthStore } from "@/lib/store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal"

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
    const router = useRouter()
    const { collapsed, toggleCollapsed } = useSidebarState()
    const { user, logout } = useAuthStore()
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

    const currentPage = Object.entries(breadcrumbMap).find(([path]) => {
        if (path === "/hris") return pathname === "/hris"
        return pathname.startsWith(path)
    })

    const Icon = currentPage?.[1].icon
    const label = currentPage?.[1].label || "HRIS"
    const color = currentPage?.[1].color || "text-slate-500"

    const handleLogout = () => {
        logout()
        router.replace("/login")
    }

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <>
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-sm w-full">
                <div className="flex items-center gap-3">
                    {/* Sidebar Toggle */}
                    <button
                        onClick={toggleCollapsed}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        {collapsed ? (
                            <PanelLeftOpen className="h-4 w-4" />
                        ) : (
                            <PanelLeftClose className="h-4 w-4" />
                        )}
                    </button>

                    {/* Divider */}
                    <div className="h-5 w-px bg-zinc-200" />

                    {/* Page Name */}
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100">
                                <Icon className="h-4 w-4 text-zinc-600" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-sm font-semibold text-zinc-900">{label}</h1>
                        </div>
                    </div>
                </div>

                {/* Profile Dropdown */}
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-zinc-200 focus:ring-offset-2 rounded-full">
                            <Avatar className="h-8 w-8 transition-transform hover:scale-105 border border-zinc-200 shadow-sm cursor-pointer">
                                <AvatarFallback className="bg-zinc-900 text-white text-xs font-semibold">
                                    {getInitials(user?.name)}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                                    <p className="text-xs leading-none text-zinc-500">
                                        {user?.role || ""}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsChangePasswordOpen(true)}>
                                <KeyRound className="mr-2 h-4 w-4 text-zinc-500" />
                                <span>Ganti Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Keluar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <ChangePasswordModal
                open={isChangePasswordOpen}
                onOpenChange={setIsChangePasswordOpen}
            />
        </>
    )
}

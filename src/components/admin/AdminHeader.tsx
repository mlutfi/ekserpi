"use client"

import React, { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Users,
    Box,
    Layers,
    TrendingUp,
    PanelLeftClose,
    PanelLeftOpen,
    Sparkles,
    User as UserIcon,
    KeyRound,
    LogOut,
    Shield,
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
import { TwoFactorSetupModal } from "@/components/auth/TwoFactorSetupModal"
import { authApi } from "@/lib/api"

const breadcrumbMap: Record<string, { label: string; icon: React.ElementType }> = {
    "/admin": { label: "Dashboard", icon: LayoutDashboard },
    "/admin/products": { label: "Produk", icon: Box },
    "/admin/categories": { label: "Kategori", icon: Layers },
    "/admin/stock": { label: "Stok", icon: Package },
    "/admin/users": { label: "Pengguna", icon: Users },
    "/admin/reports": { label: "Laporan", icon: TrendingUp },
    "/admin/modules": { label: "Modul", icon: Sparkles },
}

export function AdminHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const { collapsed, toggleCollapsed } = useSidebarState()
    const { user, logout, setAuth } = useAuthStore()
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
    const [is2faOpen, setIs2faOpen] = useState(false)

    const currentPage = Object.entries(breadcrumbMap).find(([path]) => {
        if (path === "/admin") return pathname === "/admin"
        return pathname.startsWith(path)
    })

    const Icon = currentPage?.[1].icon
    const label = currentPage?.[1].label || "Admin"

    const handleLogout = () => {
        logout()
        router.replace("/login")
    }

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    const refreshUser = async () => {
        try {
            const data = await authApi.getMe()
            const token = localStorage.getItem('token')
            if (token) setAuth(data, token)
        } catch (error) {
            console.error("Failed to refresh user:", error)
        }
    }

    return (
        <>
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm w-full">
                <div className="flex items-center gap-3">
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
                            <div className="flex h-7 w-7 items-center justify-center text-zinc-500">
                                <Icon className="h-4 w-4" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-sm font-medium text-zinc-900">{label}</h1>
                        </div>
                    </div>
                </div>

                {/* Profile Dropdown */}
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-zinc-200 focus:ring-offset-2 rounded-md">
                            <Avatar className="h-8 w-8 rounded-md transition-transform hover:scale-105 border border-zinc-200 shadow-sm cursor-pointer">
                                <AvatarFallback className="bg-zinc-100 rounded-md text-zinc-600 text-xs font-medium">
                                    {getInitials(user?.name)}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                                    <p className="text-xs leading-none text-slate-500">
                                        {user?.role || ""}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsChangePasswordOpen(true)}>
                                <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
                                <span>Ganti Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setIs2faOpen(true)}>
                                <Shield className="mr-2 h-4 w-4 text-slate-500" />
                                <span>2FA Authentication</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleLogout}>
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

            {user && (
                <TwoFactorSetupModal
                    open={is2faOpen}
                    onOpenChange={setIs2faOpen}
                    user={{ twoFactorEnabled: user.twoFactorEnabled }}
                    onSuccess={refreshUser}
                />
            )}
        </>
    )
}

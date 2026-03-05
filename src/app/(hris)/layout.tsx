"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { HRISSidebar } from "@/components/hris/HRISSidebar"
import { HrisHeader } from "@/components/hris/HrisHeader"
import { FloatingBottomNav } from "@/components/ui/FloatingBottomNav"
import { useAuthStore } from "@/lib/store"
import { Loader2 } from "lucide-react"

export default function HRISLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { user, token, _hasHydrated, activeModules } = useAuthStore()

    const allowedRoles = ["OWNER", "HR_ADMIN", "MANAGER", "EMPLOYEE"]
    const hrisModuleActive = activeModules.includes("HRIS")

    useEffect(() => {
        // Wait until Zustand has rehydrated from localStorage before checking auth
        if (!_hasHydrated) return

        if (!token || !user) {
            router.push("/login")
        } else if (!hrisModuleActive) {
            // HRIS module is not active, redirect to admin or appropriate page
            if (user.role === "CASHIER") {
                router.push("/pos")
            } else if (["OWNER", "OPS"].includes(user.role)) {
                router.push("/admin")
            } else {
                router.push("/login")
            }
        } else if (!allowedRoles.includes(user.role)) {
            if (user.role === "CASHIER") {
                router.push("/pos")
            } else if (user.role === "OPS" || user.role === "OWNER") {
                router.push("/admin")
            } else {
                router.push("/login")
            }
        }
    }, [_hasHydrated, token, user, router, hrisModuleActive])

    // Show loading spinner while store is hydrating or auth check is pending
    if (!_hasHydrated || !token || !user || !hrisModuleActive || !allowedRoles.includes(user.role)) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar: hidden on mobile */}
            <div className="hidden md:flex">
                <HRISSidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header: hidden on mobile */}
                <div className="hidden md:block">
                    <HrisHeader />
                </div>
                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    {children}
                </main>
            </div>
            {/* Floating bottom nav: mobile only */}
            <FloatingBottomNav module="hris" />
        </div>
    )
}

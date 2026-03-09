"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { AppSidebar } from "@/components/admin/AppSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { FloatingBottomNav } from "@/components/ui/FloatingBottomNav"
import { PageLoading } from "@/components/ui/page-loading"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, token, _hasHydrated } = useAuthStore()

  const allowedRoles = ["OWNER", "OPS", "BACKEND", "FRONTEND"]

  useEffect(() => {
    if (!_hasHydrated) return

    if (!token || !user) {
      router.replace("/login")
      return
    }

    if (!allowedRoles.includes(user.role)) {
      if (user.role === "CASHIER") {
        router.replace("/pos")
      } else if (["HR_ADMIN", "MANAGER", "EMPLOYEE"].includes(user.role)) {
        router.replace("/hris")
      } else {
        router.replace("/login")
      }
    }
  }, [_hasHydrated, token, user, router])

  if (!_hasHydrated || !user) {
    return <PageLoading fullScreen label="Memuat..." className="bg-slate-50" />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar: hidden on mobile */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header: hidden on mobile */}
        <div className="hidden md:block">
          <AdminHeader />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      {/* Floating bottom nav: mobile only */}
      <FloatingBottomNav module="admin" />
    </div>
  )
}

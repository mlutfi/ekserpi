"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { PosNavbar } from "@/components/pos/PosNavbar"

export default function PosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, token, _hasHydrated, activeModules } = useAuthStore()

  const posModuleActive = activeModules.includes("POS")

  useEffect(() => {
    if (!_hasHydrated) return

    if (!token || !user) {
      router.replace("/login")
    } else if (!posModuleActive) {
      // POS module is not active, redirect to appropriate page
      if (["OWNER", "HR_ADMIN", "MANAGER", "OPS"].includes(user.role)) {
        router.replace("/admin")
      } else if (["HR_ADMIN", "MANAGER", "EMPLOYEE"].includes(user.role)) {
        router.replace("/hris")
      } else {
        router.replace("/login")
      }
    }
  }, [_hasHydrated, token, user, router, posModuleActive])

  if (!_hasHydrated || !user || !posModuleActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
          <p className="text-sm text-emerald-600/60 animate-pulse">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      <PosNavbar />
      <main className="pb-20 lg:pb-6">{children}</main>
    </div>
  )
}
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { PosNavbar } from "@/components/pos/PosNavbar"
import { PageLoading } from "@/components/ui/page-loading"

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
      if (["OWNER", "OPS", "BACKEND", "FRONTEND"].includes(user.role)) {
        router.replace("/admin")
      } else if (["HR_ADMIN", "MANAGER", "TEAM_LEADER", "EMPLOYEE", "STAFF"].includes(user.role)) {
        router.replace("/hris")
      } else {
        router.replace("/login")
      }
    }
  }, [_hasHydrated, token, user, router, posModuleActive])

  if (!_hasHydrated || !user || !posModuleActive) {
    return <PageLoading fullScreen label="Memuat..." className="bg-slate-50" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      <PosNavbar />
      <main className="pb-20 lg:pb-6">{children}</main>
    </div>
  )
}

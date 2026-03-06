"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { getAccessibleApps } from "@/lib/appSwitcher"
import { LogOut, User, LayoutGrid, BarChart3, Menu, X, Shield, ChevronDown, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function PosNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const activeModules = useAuthStore((state) => state.activeModules)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false)

  const isAdminUser = user?.role === "OWNER" || user?.role === "OPS"
  const accessibleApps = getAccessibleApps(user?.role, activeModules)
  const currentApp = accessibleApps.find(item => item.key === "pos")

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* ===== Top Navbar ===== */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-100/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / App Switcher */}
            <div className="relative">
              <button
                onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all hover:bg-slate-50"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-lg font-bold text-slate-800">Simple POS</span>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Point of Sale</p>
                </div>
                {accessibleApps.length > 1 && (
                  <ChevronDown className={cn(
                    "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200",
                    appSwitcherOpen && "rotate-180"
                  )} />
                )}
              </button>

              {/* App Switcher Dropdown */}
              {appSwitcherOpen && accessibleApps.length > 1 && (
                <div className="absolute left-0 top-full mt-2 w-56 space-y-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  {accessibleApps.map((app) => {
                    const AppIcon = app.icon
                    const isCurrent = app.key === "pos"
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
                            ? "bg-slate-50 shadow-sm border border-slate-200/80 text-slate-800 font-semibold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:shadow-sm"
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
                          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => router.push("/pos")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive("/pos")
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200/60"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Kasir
              </button>
              <button
                onClick={() => router.push("/pos/report")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive("/pos/report")
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200/60"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <BarChart3 className="h-4 w-4" />
                Laporan
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
                  <p className="text-[11px] text-slate-400">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex md:hidden items-center justify-center h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              <div className="flex sm:hidden items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 mb-2 border border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
                  <p className="text-[11px] text-slate-400">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => { router.push("/pos"); setMobileMenuOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive("/pos")
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Kasir
              </button>
              <button
                onClick={() => { router.push("/pos/report"); setMobileMenuOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive("/pos/report")
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <BarChart3 className="h-4 w-4" />
                Laporan
              </button>
              {isAdminUser && (
                <button
                  onClick={() => { router.push("/admin"); setMobileMenuOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/admin")
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ===== Mobile Bottom Navigation ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around px-2 py-2">
            <button
              onClick={() => router.push("/pos")}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-200 ${isActive("/pos")
                ? "text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <LayoutGrid className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Kasir</span>
              {isActive("/pos") && (
                <div className="absolute -top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              )}
            </button>
            <button
              onClick={() => router.push("/pos/report")}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-200 ${isActive("/pos/report")
                ? "text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Laporan</span>
            </button>
            {isAdminUser && (
              <button
                onClick={() => router.push("/admin")}
                className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-200 ${pathname?.startsWith("/admin")
                  ? "text-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <Shield className="h-5 w-5" />
                <span className="text-[10px] font-semibold">Admin</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-slate-400 transition-all duration-200 hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
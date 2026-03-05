"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Settings, Check, X, Loader2 } from "lucide-react"
import { settingsApi } from "@/lib/api"
import { useAuthStore } from "@/lib/store"

interface Module {
  id: string
  key: string
  value: string
}

const AVAILABLE_MODULES = [
  { id: "HRIS", name: "HRIS", description: "Human Resources Information System - Manage employees, attendance, leave, payroll" },
  { id: "POS", name: "POS", description: "Point of Sale - Handle sales, products, inventory" },
]

export default function ModulesPage() {
  // const { toast } = useToast()
  const { user, setActiveModules } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeModules, setLocalActiveModules] = useState<string[]>([])

  // Check if user is OWNER
  const isOwner = user?.role === "OWNER"

  useEffect(() => {
    fetchModules()
  }, [])

  async function fetchModules() {
    try {
      const response = await settingsApi.getModules()
      const value = response.value
      if (value) {
        const modules = JSON.parse(value) as string[]
        setLocalActiveModules(modules)
        setActiveModules(modules)
      } else {
        // Default modules
        setLocalActiveModules(["HRIS", "POS"])
        setActiveModules(["HRIS", "POS"])
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error)
      // Default modules on error
      setLocalActiveModules(["HRIS", "POS"])
      setActiveModules(["HRIS", "POS"])
    } finally {
      setLoading(false)
    }
  }

  async function toggleModule(moduleId: string) {
    if (!isOwner) {
      toast.error("Akses Ditolak", {
        description: "Hanya Owner yang dapat mengubah pengaturan modul",
      })
      return
    }

    setSaving(true)
    try {
      let newModules: string[]
      if (activeModules.includes(moduleId)) {
        // Remove module
        newModules = activeModules.filter(m => m !== moduleId)
      } else {
        // Add module
        newModules = [...activeModules, moduleId]
      }

      await settingsApi.updateModules(newModules)
      setLocalActiveModules(newModules)
      setActiveModules(newModules)

      toast.success("Berhasil", {
        description: "Pengaturan modul berhasil diperbarui",
      })
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.message || "Gagal memperbarui modul",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  // Access check
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <X className="h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Akses Ditolak</h2>
        <p className="mt-2 text-sm text-slate-500">
          Hanya Owner yang dapat mengakses halaman pengaturan modul
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Modul</h1>
          <p className="text-sm text-slate-500">
            Aktifkan atau nonaktifkan modul aplikasi
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Settings className="h-4 w-4" />
          <span>Hanya Owner</span>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-medium text-blue-900">Informasi Modul</h3>
        <p className="mt-1 text-sm text-blue-700">
          Mengaktifkan atau menonaktifkan modul akan mempengaruhi menu sidebar dan akses aplikasi.
          Modul yang dinonaktifkan tidak akan muncul di menu navigasi.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {AVAILABLE_MODULES.map((module) => {
          const isActive = activeModules.includes(module.id)

          return (
            <div
              key={module.id}
              className={`relative rounded-xl border-2 p-6 transition ${isActive
                ? "border-green-200 bg-green-50"
                : "border-slate-200 bg-white"
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {module.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {module.description}
                  </p>
                </div>

                <button
                  onClick={() => toggleModule(module.id)}
                  disabled={saving}
                  className={`ml-4 flex h-10 w-10 items-center justify-center rounded-full transition ${isActive
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isActive ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Active Modules Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-medium text-slate-900">Ringkasan Modul Aktif</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeModules.length > 0 ? (
            activeModules.map((moduleId) => {
              const module = AVAILABLE_MODULES.find(m => m.id === moduleId)
              return (
                <span
                  key={moduleId}
                  className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                >
                  <Check className="mr-1 h-3 w-3" />
                  {module?.name || moduleId}
                </span>
              )
            })
          ) : (
            <span className="text-sm text-slate-500">
              Tidak ada modul yang aktif
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

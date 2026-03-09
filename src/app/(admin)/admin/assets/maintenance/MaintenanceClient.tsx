"use client"

import { useEffect, useState } from "react"
import { Asset, AssetMaintenance, assetMaintenancesApi, assetsApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, RefreshCw, Trash2 } from "lucide-react"

export default function MaintenanceClient() {
  const [view, setView] = useState<"list" | "form">("list")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [maintenances, setMaintenances] = useState<AssetMaintenance[]>([])
  const [assets, setAssets] = useState<Asset[]>([])

  const [formData, setFormData] = useState({
    assetId: "",
    maintenanceDate: new Date().toISOString().slice(0, 10),
    type: "PREVENTIVE" as "PREVENTIVE" | "CORRECTIVE" | "INSPECTION",
    vendor: "",
    cost: 0,
    description: "",
    status: "SCHEDULED" as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED",
  })

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [maintenanceData, assetData] = await Promise.all([assetMaintenancesApi.getAll(), assetsApi.getAll()])
      setMaintenances(maintenanceData ?? [])
      setAssets((assetData ?? []).filter((asset) => asset.status !== "DISPOSED"))
    } catch (_error) {
      toast.error("Gagal memuat data maintenance")
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setFormData({
      assetId: "",
      maintenanceDate: new Date().toISOString().slice(0, 10),
      type: "PREVENTIVE",
      vendor: "",
      cost: 0,
      description: "",
      status: "SCHEDULED",
    })
    setView("form")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await assetMaintenancesApi.create({
        assetId: formData.assetId,
        maintenanceDate: formData.maintenanceDate,
        type: formData.type,
        vendor: formData.vendor || undefined,
        cost: formData.cost,
        description: formData.description || undefined,
        status: formData.status,
      })
      toast.success("Maintenance berhasil dibuat")
      setView("list")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal membuat maintenance")
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(item: AssetMaintenance, status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED") {
    try {
      await assetMaintenancesApi.updateStatus(item.id, status)
      toast.success("Status maintenance diperbarui")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memperbarui status")
    }
  }

  async function handleDelete(item: AssetMaintenance) {
    const confirmed = confirm(`Hapus maintenance ${item.assetCode}?`)
    if (!confirmed) return
    try {
      await assetMaintenancesApi.delete(item.id)
      toast.success("Maintenance dihapus")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus maintenance")
    }
  }

  if (loading && view === "list") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Maintenance</h1>
          <p className="text-sm text-zinc-500">
            {view === "list" ? "Kelola jadwal dan progres perawatan aset" : "Form maintenance"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchData()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {view === "list" ? (
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Maintenance
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setView("list")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          )}
        </div>
      </div>

      {view === "form" && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Aset *</label>
              <select
                required
                value={formData.assetId}
                onChange={(e) => setFormData((prev) => ({ ...prev, assetId: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="" disabled>
                  Pilih aset
                </option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetCode} - {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tanggal *</label>
              <input
                type="date"
                required
                value={formData.maintenanceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, maintenanceDate: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Type *</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as "PREVENTIVE" | "CORRECTIVE" | "INSPECTION",
                  }))
                }
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="PREVENTIVE">PREVENTIVE</option>
                <option value="CORRECTIVE">CORRECTIVE</option>
                <option value="INSPECTION">INSPECTION</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED",
                  }))
                }
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendor: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Cost</label>
              <input
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData((prev) => ({ ...prev, cost: Number.parseInt(e.target.value, 10) || 0 }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Deskripsi</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Maintenance"}
            </Button>
          </div>
        </form>
      )}

      {view === "list" && (
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Aset</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {maintenances.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-zinc-500">{item.assetCode}</p>
                      <p className="font-medium text-zinc-900">{item.assetName}</p>
                    </td>
                    <td className="px-4 py-3">{new Date(item.maintenanceDate).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3">{item.type}</td>
                    <td className="px-4 py-3">{item.vendor || "-"}</td>
                    <td className="px-4 py-3 text-right">Rp {item.cost.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === "COMPLETED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : item.status === "IN_PROGRESS"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {item.status !== "SCHEDULED" && (
                          <Button size="sm" variant="outline" onClick={() => void updateStatus(item, "SCHEDULED")}>
                            Schedule
                          </Button>
                        )}
                        {item.status !== "IN_PROGRESS" && (
                          <Button size="sm" variant="outline" onClick={() => void updateStatus(item, "IN_PROGRESS")}>
                            Progress
                          </Button>
                        )}
                        {item.status !== "COMPLETED" && (
                          <Button size="sm" variant="outline" onClick={() => void updateStatus(item, "COMPLETED")}>
                            Complete
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {maintenances.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                      Belum ada data maintenance
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Asset, assetsApi, Location, locationsApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Plus, RefreshCw, Trash2 } from "lucide-react"

export default function AssetRegisterClient() {
  const [view, setView] = useState<"list" | "form">("list")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  const [formData, setFormData] = useState({
    assetCode: "",
    name: "",
    category: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    acquisitionCost: 0,
    residualValue: 0,
    usefulLifeMonths: 60,
    locationId: "",
    note: "",
    status: "AVAILABLE" as "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "DISPOSED",
  })

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [assetData, locationData] = await Promise.all([assetsApi.getAll(), locationsApi.getAll()])
      setAssets(assetData ?? [])
      setLocations(locationData ?? [])
    } catch (_error) {
      toast.error("Gagal memuat data aset")
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingAsset(null)
    setFormData({
      assetCode: "",
      name: "",
      category: "",
      purchaseDate: new Date().toISOString().slice(0, 10),
      acquisitionCost: 0,
      residualValue: 0,
      usefulLifeMonths: 60,
      locationId: "",
      note: "",
      status: "AVAILABLE",
    })
    setView("form")
  }

  function openEditForm(asset: Asset) {
    setEditingAsset(asset)
    setFormData({
      assetCode: asset.assetCode,
      name: asset.name,
      category: asset.category,
      purchaseDate: asset.purchaseDate.slice(0, 10),
      acquisitionCost: asset.acquisitionCost,
      residualValue: asset.residualValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      locationId: asset.locationId || "",
      note: asset.note || "",
      status: asset.status,
    })
    setView("form")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingAsset) {
        await assetsApi.update(editingAsset.id, {
          assetCode: formData.assetCode,
          name: formData.name,
          category: formData.category,
          purchaseDate: formData.purchaseDate,
          acquisitionCost: formData.acquisitionCost,
          residualValue: formData.residualValue,
          usefulLifeMonths: formData.usefulLifeMonths,
          locationId: formData.locationId || undefined,
          note: formData.note || undefined,
          status: formData.status,
        })
        toast.success("Aset berhasil diperbarui")
      } else {
        await assetsApi.create({
          assetCode: formData.assetCode,
          name: formData.name,
          category: formData.category,
          purchaseDate: formData.purchaseDate,
          acquisitionCost: formData.acquisitionCost,
          residualValue: formData.residualValue,
          usefulLifeMonths: formData.usefulLifeMonths,
          locationId: formData.locationId || undefined,
          note: formData.note || undefined,
        })
        toast.success("Aset berhasil ditambahkan")
      }

      setView("list")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan aset")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(asset: Asset) {
    const confirmed = confirm(`Hapus aset "${asset.name}"?`)
    if (!confirmed) return

    try {
      await assetsApi.delete(asset.id)
      toast.success("Aset berhasil dihapus")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus aset")
    }
  }

  function statusStyle(status: Asset["status"]) {
    if (status === "AVAILABLE") return "bg-emerald-50 border-emerald-200 text-emerald-700"
    if (status === "ASSIGNED") return "bg-blue-50 border-blue-200 text-blue-700"
    if (status === "MAINTENANCE") return "bg-amber-50 border-amber-200 text-amber-700"
    return "bg-red-50 border-red-200 text-red-700"
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
          <h1 className="text-2xl font-bold text-zinc-900">Asset Register</h1>
          <p className="text-sm text-zinc-500">
            {view === "list" ? "Kelola master data aset perusahaan" : "Form aset"}
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
              Tambah Aset
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
              <label className="mb-1 block text-sm font-medium">Asset Code *</label>
              <input
                type="text"
                required
                value={formData.assetCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, assetCode: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Nama Aset *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Kategori *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Contoh: Laptop, Mesin, Kendaraan"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tanggal Pembelian *</label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Acquisition Cost *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.acquisitionCost}
                onChange={(e) => setFormData((prev) => ({ ...prev, acquisitionCost: Number.parseInt(e.target.value, 10) || 0 }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Residual Value</label>
              <input
                type="number"
                min="0"
                value={formData.residualValue}
                onChange={(e) => setFormData((prev) => ({ ...prev, residualValue: Number.parseInt(e.target.value, 10) || 0 }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Useful Life (bulan) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.usefulLifeMonths}
                onChange={(e) => setFormData((prev) => ({ ...prev, usefulLifeMonths: Number.parseInt(e.target.value, 10) || 1 }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Lokasi</label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationId: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="">-</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {editingAsset && (
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "DISPOSED",
                    }))
                  }
                  className="w-full rounded-md border p-2 text-sm"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="DISPOSED">DISPOSED</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Catatan</label>
              <textarea
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : editingAsset ? "Perbarui Aset" : "Simpan Aset"}
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
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Acquisition</th>
                  <th className="px-4 py-3 text-right">Book Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs">{asset.assetCode}</td>
                    <td className="px-4 py-3 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{asset.category}</td>
                    <td className="px-4 py-3 text-right">Rp {asset.acquisitionCost.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">Rp {asset.currentBookValue.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{asset.locationName || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditForm(asset)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void handleDelete(asset)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {assets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                      Belum ada data aset
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

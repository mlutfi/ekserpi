"use client"

import { useEffect, useState } from "react"
import { Asset, AssetAssignment, assetAssignmentsApi, assetsApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

export default function AssetAssignmentsClient() {
  const [view, setView] = useState<"list" | "form">("list")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assignments, setAssignments] = useState<AssetAssignment[]>([])
  const [assets, setAssets] = useState<Asset[]>([])

  const [formData, setFormData] = useState({
    assetId: "",
    assigneeType: "USER" as "USER" | "DEPARTMENT" | "LOCATION" | "OTHER",
    assigneeRef: "",
    assigneeName: "",
    assignedAt: new Date().toISOString().slice(0, 10),
    conditionOut: "",
    note: "",
  })

  const [returnState, setReturnState] = useState<Record<string, { conditionIn: string; note: string }>>({})

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [assignmentData, assetData] = await Promise.all([assetAssignmentsApi.getAll(), assetsApi.getAll()])
      setAssignments(assignmentData ?? [])
      setAssets((assetData ?? []).filter((asset) => asset.status !== "DISPOSED"))
    } catch (_error) {
      toast.error("Gagal memuat data assignment")
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setFormData({
      assetId: "",
      assigneeType: "USER",
      assigneeRef: "",
      assigneeName: "",
      assignedAt: new Date().toISOString().slice(0, 10),
      conditionOut: "",
      note: "",
    })
    setView("form")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await assetAssignmentsApi.create({
        assetId: formData.assetId,
        assigneeType: formData.assigneeType,
        assigneeRef: formData.assigneeRef || undefined,
        assigneeName: formData.assigneeName,
        assignedAt: formData.assignedAt,
        conditionOut: formData.conditionOut || undefined,
        note: formData.note || undefined,
      })
      toast.success("Asset assignment berhasil dibuat")
      setView("list")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan assignment")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReturn(assignment: AssetAssignment) {
    const payload = returnState[assignment.id] || { conditionIn: "", note: "" }
    const confirmed = confirm(`Kembalikan aset ${assignment.assetCode} dari ${assignment.assigneeName}?`)
    if (!confirmed) return

    setSubmitting(true)
    try {
      await assetAssignmentsApi.returnAsset(assignment.id, {
        returnedAt: new Date().toISOString().slice(0, 10),
        conditionIn: payload.conditionIn || undefined,
        note: payload.note || undefined,
      })
      toast.success("Aset berhasil dikembalikan")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memproses pengembalian")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(assignment: AssetAssignment) {
    const confirmed = confirm(`Hapus assignment ${assignment.assetCode}?`)
    if (!confirmed) return
    try {
      await assetAssignmentsApi.delete(assignment.id)
      toast.success("Assignment berhasil dihapus")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus assignment")
    }
  }

  const availableAssets = assets.filter((asset) => asset.status === "AVAILABLE")

  if (loading && view === "list") {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Asset Assignment</h1>
          <p className="text-sm text-zinc-500">
            {view === "list" ? "Kelola distribusi aset ke user/divisi" : "Form assignment aset"}
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
              Buat Assignment
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
                  Pilih aset available
                </option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetCode} - {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Assignee Type *</label>
              <select
                value={formData.assigneeType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assigneeType: e.target.value as "USER" | "DEPARTMENT" | "LOCATION" | "OTHER",
                  }))
                }
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="USER">USER</option>
                <option value="DEPARTMENT">DEPARTMENT</option>
                <option value="LOCATION">LOCATION</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Assignee Name *</label>
              <input
                required
                type="text"
                value={formData.assigneeName}
                onChange={(e) => setFormData((prev) => ({ ...prev, assigneeName: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Assignee Ref</label>
              <input
                type="text"
                value={formData.assigneeRef}
                onChange={(e) => setFormData((prev) => ({ ...prev, assigneeRef: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Opsional, ID referensi"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Assigned Date *</label>
              <input
                required
                type="date"
                value={formData.assignedAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, assignedAt: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Condition Out</label>
              <input
                type="text"
                value={formData.conditionOut}
                onChange={(e) => setFormData((prev) => ({ ...prev, conditionOut: e.target.value }))}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Contoh: Good condition"
              />
            </div>

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
              {submitting ? "Menyimpan..." : "Simpan Assignment"}
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
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Returned</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-zinc-500">{assignment.assetCode}</p>
                      <p className="font-medium text-zinc-900">{assignment.assetName}</p>
                    </td>
                    <td className="px-4 py-3">{assignment.assigneeName}</td>
                    <td className="px-4 py-3">{assignment.assigneeType}</td>
                    <td className="px-4 py-3">{new Date(assignment.assignedAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3">
                      {assignment.returnedAt ? new Date(assignment.returnedAt).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          assignment.status === "ACTIVE"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {assignment.status === "ACTIVE" && (
                          <>
                            <input
                              type="text"
                              placeholder="Condition in"
                              value={returnState[assignment.id]?.conditionIn || ""}
                              onChange={(e) =>
                                setReturnState((prev) => ({
                                  ...prev,
                                  [assignment.id]: {
                                    conditionIn: e.target.value,
                                    note: prev[assignment.id]?.note || "",
                                  },
                                }))
                              }
                              className="w-32 rounded-md border px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Note"
                              value={returnState[assignment.id]?.note || ""}
                              onChange={(e) =>
                                setReturnState((prev) => ({
                                  ...prev,
                                  [assignment.id]: {
                                    conditionIn: prev[assignment.id]?.conditionIn || "",
                                    note: e.target.value,
                                  },
                                }))
                              }
                              className="w-32 rounded-md border px-2 py-1 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleReturn(assignment)}
                              disabled={submitting}
                            >
                              <RotateCcw className="mr-1 h-3.5 w-3.5" />
                              Return
                            </Button>
                          </>
                        )}
                        {assignment.status !== "ACTIVE" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => void handleDelete(assignment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                      Belum ada assignment aset
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

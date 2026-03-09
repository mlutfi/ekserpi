"use client"

import { useEffect, useMemo, useState } from "react"
import { AssetDepreciation, assetDepreciationsApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Calculator, RefreshCw } from "lucide-react"

function currentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export default function DepreciationClient() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [period, setPeriod] = useState(currentPeriod())
  const [entries, setEntries] = useState<AssetDepreciation[]>([])

  useEffect(() => {
    void fetchEntries(period)
  }, [period])

  async function fetchEntries(targetPeriod: string) {
    setLoading(true)
    try {
      const data = await assetDepreciationsApi.getAll(targetPeriod)
      setEntries(data ?? [])
    } catch (_error) {
      toast.error("Gagal memuat data depresiasi")
    } finally {
      setLoading(false)
    }
  }

  async function generateEntries() {
    setSubmitting(true)
    try {
      const generated = await assetDepreciationsApi.generate(period)
      toast.success(`Generate depresiasi selesai (${generated.length} entry baru)`)
      await fetchEntries(period)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal generate depresiasi")
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(entry: AssetDepreciation, status: "DRAFT" | "POSTED") {
    try {
      await assetDepreciationsApi.updateStatus(entry.id, status)
      toast.success("Status depresiasi diperbarui")
      await fetchEntries(period)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal update status")
    }
  }

  const summary = useMemo(() => {
    const totalOpening = entries.reduce((sum, entry) => sum + entry.openingBookValue, 0)
    const totalDep = entries.reduce((sum, entry) => sum + entry.depreciationValue, 0)
    const totalClosing = entries.reduce((sum, entry) => sum + entry.closingBookValue, 0)
    return { totalOpening, totalDep, totalClosing }
  }, [entries])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Depreciation</h1>
          <p className="text-sm text-zinc-500">Kelola perhitungan depresiasi aset per periode</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchEntries(period)} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => void generateEntries()} disabled={submitting}>
            <Calculator className="mr-2 h-4 w-4" />
            {submitting ? "Generating..." : "Generate Period"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Periode</label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-md border p-2 text-sm"
            />
          </div>
          <div className="rounded-md border bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Opening Book Value</p>
            <p className="text-lg font-semibold text-zinc-900">Rp {summary.totalOpening.toLocaleString("id-ID")}</p>
          </div>
          <div className="rounded-md border bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Depreciation</p>
            <p className="text-lg font-semibold text-zinc-900">Rp {summary.totalDep.toLocaleString("id-ID")}</p>
          </div>
          <div className="rounded-md border bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Closing Book Value</p>
            <p className="text-lg font-semibold text-zinc-900">Rp {summary.totalClosing.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Aset</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3 text-right">Opening</th>
                <th className="px-4 py-3 text-right">Depreciation</th>
                <th className="px-4 py-3 text-right">Closing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                    Memuat...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                    Belum ada data depresiasi pada periode ini
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-zinc-500">{entry.assetCode}</p>
                      <p className="font-medium text-zinc-900">{entry.assetName}</p>
                    </td>
                    <td className="px-4 py-3">{entry.period}</td>
                    <td className="px-4 py-3 text-right">Rp {entry.openingBookValue.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">Rp {entry.depreciationValue.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">Rp {entry.closingBookValue.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          entry.status === "POSTED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {entry.status !== "POSTED" && (
                          <Button size="sm" variant="outline" onClick={() => void updateStatus(entry, "POSTED")}>
                            Post
                          </Button>
                        )}
                        {entry.status !== "DRAFT" && (
                          <Button size="sm" variant="outline" onClick={() => void updateStatus(entry, "DRAFT")}>
                            Draft
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { purchaseOrdersApi, PurchaseOrder, stockApi, StockIn } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, ClipboardCheck, Eye, RefreshCw } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { formatDate } from "@/lib/utils"

export default function GoodsReceiptsClient() {
  const [view, setView] = useState<"list" | "detail" | "adjust">("list")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
   const [stockIns, setStockIns] = useState<StockIn[]>([])
   const [stockOuts, setStockOuts] = useState<any[]>([])
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [adjustmentItems, setAdjustmentItems] = useState<{
    productId: string;
    productName: string;
    qtyOrdered: number;
    qtyReceived: number;
    reason: string;
  }[]>([])

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [poData, stockInData, stockOutData] = await Promise.all([
        purchaseOrdersApi.getAll(),
        stockApi.getStockIns(1, 100),
        stockApi.getStockOuts(1, 100),
      ])

      const candidatePOs = (poData ?? []).filter((po) =>
        ["SENT", "COMPLETED", "DRAFT"].includes(po.status)
      )

      setPurchaseOrders(candidatePOs)
      setStockIns(stockInData.data ?? [])
      setStockOuts(stockOutData.data ?? [])
    } catch (_error) {
      toast.error("Gagal memuat data penerimaan barang")
    } finally {
      setLoading(false)
    }
  }

  async function handleViewDetail(po: PurchaseOrder) {
    setLoading(true)
    try {
      const fullPO = await purchaseOrdersApi.getById(po.id)
      setSelectedPO(fullPO)
      setView("detail")
    } catch (_error) {
      toast.error("Gagal memuat detail purchase order")
    } finally {
      setLoading(false)
    }
  }

  async function handleReceiveAll(po: PurchaseOrder) {
    const confirmed = confirm(
      `Terima semua barang untuk ${po.poNumber}? Sistem akan menambahkan stok masuk sesuai qty order.`
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      await purchaseOrdersApi.updateStatus(po.id, "COMPLETED")
      const updated = await purchaseOrdersApi.getById(po.id)
      setSelectedPO(updated)
      toast.success("Penerimaan barang berhasil diproses")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memproses penerimaan barang")
    } finally {
      setSubmitting(false)
    }
  }

  function handleStartAdjustment(po: PurchaseOrder) {
    const items = po.items.map(item => ({
      productId: item.productId,
      productName: item.productName || "",
      qtyOrdered: item.qtyOrdered,
      qtyReceived: item.qtyOrdered,
      reason: ""
    }))
    setAdjustmentItems(items)
    setSelectedPO(po)
    setView("adjust")
  }

  function handleUpdateAdjustmentItem(index: number, field: "qtyReceived" | "reason", value: any) {
    const newItems = [...adjustmentItems]
    if (field === "qtyReceived") {
      newItems[index].qtyReceived = Math.max(0, Math.min(newItems[index].qtyOrdered, Number(value) || 0))
    } else {
      newItems[index].reason = value
    }
    setAdjustmentItems(newItems)
  }

  async function handleSubmitAdjustment() {
    if (!selectedPO) return

    // Validate reasons
    const missingReason = adjustmentItems.some(item => item.qtyReceived < item.qtyOrdered && !item.reason.trim())
    if (missingReason) {
      toast.error("Alasan wajib diisi untuk barang yang tidak diterima penuh")
      return
    }

    const confirmed = confirm("Simpan penyesuaian penerimaan? Sistem akan otomatis mencatat retur untuk selisih barang.")
    if (!confirmed) return

    setSubmitting(true)
    try {
      // 1. Complete PO (triggers full receipt in backend)
      await purchaseOrdersApi.updateStatus(selectedPO.id, "COMPLETED")
      
      // 2. Create Returns for missing items
      const returnPromises = adjustmentItems
        .filter(item => item.qtyReceived < item.qtyOrdered)
        .map(item => {
          const diff = item.qtyOrdered - item.qtyReceived
          return stockApi.addStockOut({
            productId: item.productId,
            locationId: selectedPO.locationId,
            qty: diff,
            reason: "REFUND",
            note: `Otomatis dari Penerimaan ${selectedPO.poNumber}. Alasan: ${item.reason}`
          })
        })

      if (returnPromises.length > 0) {
        await Promise.all(returnPromises)
        toast.success(`Berhasil memproses penerimaan dan mencatat ${returnPromises.length} retur barang.`)
      } else {
        toast.success("Penerimaan barang berhasil diproses (Full Receipt)")
      }

      await fetchData()
      const updated = await purchaseOrdersApi.getById(selectedPO.id)
      setSelectedPO(updated)
      setView("detail")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan penyesuaian")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedReceiptHistory = useMemo(() => {
    if (!selectedPO) return []
    const ins = stockIns
      .filter((si) => si.purchaseOrderId === selectedPO.id)
      .map(si => ({ ...si, historyType: 'IN' as const }));
    
    const outs = stockOuts
      .filter((so) => so.reason === "REFUND" && so.note?.includes(selectedPO.poNumber))
      .map(so => ({ ...so, historyType: 'OUT' as const }));

    return [...ins, ...outs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [stockIns, stockOuts, selectedPO])

  function getStatusStyle(status: string) {
    if (status === "DRAFT") return "bg-zinc-100 text-zinc-600 border-zinc-200"
    if (status === "SENT") return "bg-blue-50 text-blue-600 border-blue-200"
    if (status === "COMPLETED") return "bg-emerald-50 text-emerald-600 border-emerald-200"
    return "bg-zinc-100 text-zinc-600 border-zinc-200"
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Penerimaan Barang</h1>
          <p className="text-sm text-zinc-500">
            {view === "list" && "Proses penerimaan barang dari purchase order"}
            {view === "detail" && `Penerimaan untuk ${selectedPO?.poNumber}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchData()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {view === "detail" && (
            <Button variant="outline" onClick={() => setView("list")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          )}
          {view === "adjust" && (
            <Button variant="outline" onClick={() => setView("detail")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Detail
            </Button>
          )}
        </div>
      </div>

      {view === "list" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {purchaseOrders.map((po) => (
            <div
              key={po.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-semibold">{po.poNumber}</span>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(po.status)}`}
                >
                  {po.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-zinc-600">
                <p>
                  <strong>Supplier:</strong> {po.supplierName || "-"}
                </p>
                <p>
                  <strong>Lokasi:</strong> {po.locationName || "-"}
                </p>
                <p>
                  <strong>Total:</strong> Rp {po.totalAmount.toLocaleString("id-ID")}
                </p>
                <p className="pt-1 text-xs text-zinc-400">
                  {formatDate(po.createdAt)}
                </p>
              </div>

              <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewDetail(po)}
                >
                  <Eye className="mr-2 h-3 w-3" />
                  Detail
                </Button>
              </div>
            </div>
          ))}

          {purchaseOrders.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-zinc-300 bg-white py-12 text-center text-zinc-500">
              Belum ada data purchase order untuk penerimaan barang
            </div>
          )}
        </div>
      )}

      {view === "detail" && selectedPO && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 rounded-lg border bg-white p-6 md:col-span-1">
            <div>
              <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-zinc-900">
                Informasi Dokumen
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Nomor PO</span>
                  <span className="text-right font-semibold">{selectedPO.poNumber}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Status</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(selectedPO.status)}`}
                  >
                    {selectedPO.status}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Supplier</span>
                  <span className="text-right">{selectedPO.supplierName || "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Gudang</span>
                  <span className="text-right">{selectedPO.locationName || "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Total</span>
                  <span className="text-right font-semibold">
                    Rp {selectedPO.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Aksi Penerimaan
              </div>

              {selectedPO.status === "COMPLETED" ? (
                <div className="rounded border border-emerald-100 bg-emerald-50 p-3 text-center text-sm text-emerald-700">
                  <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
                  Penerimaan sudah selesai diproses.
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={submitting}
                    onClick={() => void handleReceiveAll(selectedPO)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {submitting ? "Memproses..." : "Terima Semua"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={submitting}
                    onClick={() => handleStartAdjustment(selectedPO)}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Terima dg Penyesuaian
                  </Button>
                </div>
              )}

              <p className="mt-3 text-xs text-zinc-500">
                Catatan: sistem saat ini memproses penerimaan full quantity sesuai PO.
              </p>
            </div>
          </div>

          <div className="space-y-6 md:col-span-2">
            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-zinc-50 p-4">
                <h3 className="font-semibold text-zinc-900">Item PO</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3 text-right">Harga Beli</th>
                    <th className="px-4 py-3 text-center">Qty Order</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedPO.items.map((item, idx) => {
                    const netReceived = (item.qtyReceived || 0) - selectedReceiptHistory
                      .filter(h => h.historyType === 'OUT' && h.productId === item.productId)
                      .reduce((acc, curr) => acc + curr.qty, 0)

                    return (
                      <tr key={`${item.productId}-${idx}`} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{item.productName}</td>
                        <td className="px-4 py-3 text-right text-zinc-600">
                          Rp {item.costPerUnit.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{item.qtyOrdered}</td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-900">
                          Rp {(item.qtyOrdered * item.costPerUnit).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-zinc-50 p-4">
                <h3 className="font-semibold text-zinc-900">Riwayat Penerimaan Barang</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3 text-center">Qty Order</th>
                      <th className="px-4 py-3 text-right">Qty Receive</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedReceiptHistory.map((receipt) => {
                      const poItem = selectedPO.items.find(i => i.productId === receipt.productId)
                      const qtyOrdered = poItem?.qtyOrdered || 0

                      return (
                        <tr key={receipt.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-3 text-zinc-500">
                            {new Date(receipt.createdAt).toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-900">{receipt.productName}</td>
                          <td className="px-4 py-3 text-center text-zinc-600">{qtyOrdered}</td>
                          <td className={`px-4 py-3 text-right font-bold ${receipt.historyType === 'IN' ? 'text-emerald-700' : 'text-red-600'}`}>
                            {receipt.historyType === 'IN' ? (
                              `+${receipt.qty}`
                            ) : (
                              <div className="flex flex-col items-end">
                                <span>-{receipt.qty}</span>
                                <span className="text-[10px] bg-red-100 px-1 rounded font-normal">Kurang {receipt.qty}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-600">
                            {receipt.historyType === 'IN' ? `Rp ${receipt.costPerUnit.toLocaleString("id-ID")}` : "-"}
                          </td>
                        </tr>
                      )
                    })}

                    {selectedReceiptHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                          Belum ada histori penerimaan barang untuk PO ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "adjust" && selectedPO && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-zinc-900 border-b pb-2">
              Penyesuaian Barang Diterima: {selectedPO.poNumber}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3 text-center w-24">Qty PO</th>
                    <th className="px-4 py-3 text-center w-32">Diterima</th>
                    <th className="px-4 py-3 text-center w-24">Selisih</th>
                    <th className="px-4 py-3">Alasan (Jika bermasalah)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {adjustmentItems.map((item, idx) => (
                    <tr key={item.productId} className={item.qtyReceived < item.qtyOrdered ? "bg-amber-50/50" : ""}>
                      <td className="px-4 py-4 font-medium text-zinc-900">{item.productName}</td>
                      <td className="px-4 py-4 text-center text-zinc-600">{item.qtyOrdered}</td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          value={item.qtyReceived}
                          onChange={(e) => handleUpdateAdjustmentItem(idx, "qtyReceived", e.target.value)}
                          className="w-20 rounded border border-zinc-300 p-1 text-center font-bold focus:ring-2 focus:ring-zinc-100 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-red-600">
                        {item.qtyOrdered - item.qtyReceived > 0 ? `-${item.qtyOrdered - item.qtyReceived}` : "-"}
                      </td>
                      <td className="px-4 py-4">
                        {item.qtyReceived < item.qtyOrdered && (
                          <input
                            type="text"
                            placeholder="Alasan (Wajib: Rusak/Kurang/dll)"
                            value={item.reason}
                            onChange={(e) => handleUpdateAdjustmentItem(idx, "reason", e.target.value)}
                            className="w-full rounded border border-zinc-300 p-1 px-2 text-xs focus:ring-2 focus:ring-zinc-100 outline-none"
                            required
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex items-center justify-between border-t pt-6 bg-zinc-50 -mx-6 -mb-6 p-6 rounded-b-lg">
              <div className="text-sm text-zinc-500 italic max-w-md">
                Barang yang tidak diterima akan otomatis dicatat sebagai retur pembelian (Purchase Return) untuk menyesuaikan nilai inventory dan hutang.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setView("detail")} disabled={submitting}>
                  Batal
                </Button>
                <Button 
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-8" 
                  onClick={handleSubmitAdjustment}
                  disabled={submitting}
                >
                  {submitting ? "Memproses..." : "Simpan & Proses Penyesuaian"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

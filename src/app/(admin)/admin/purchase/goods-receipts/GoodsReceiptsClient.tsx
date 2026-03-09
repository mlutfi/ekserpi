"use client"

import { useEffect, useMemo, useState } from "react"
import { purchaseOrdersApi, PurchaseOrder, stockApi, StockIn } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, ClipboardCheck, Eye, RefreshCw } from "lucide-react"

export default function GoodsReceiptsClient() {
  const [view, setView] = useState<"list" | "detail">("list")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [stockIns, setStockIns] = useState<StockIn[]>([])
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [poData, stockInData] = await Promise.all([
        purchaseOrdersApi.getAll(),
        stockApi.getStockIns(1, 100),
      ])

      const candidatePOs = (poData ?? []).filter((po) =>
        ["SENT", "COMPLETED", "DRAFT"].includes(po.status)
      )

      setPurchaseOrders(candidatePOs)
      setStockIns(stockInData.data ?? [])
    } catch (_error) {
      toast.error("Gagal memuat data goods receipt")
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
      toast.success("Goods receipt berhasil diproses")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memproses goods receipt")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedReceiptHistory = useMemo(() => {
    if (!selectedPO) return []
    return stockIns.filter((stockIn) => stockIn.purchaseOrderId === selectedPO.id)
  }, [stockIns, selectedPO])

  function getStatusStyle(status: string) {
    if (status === "DRAFT") return "bg-zinc-100 text-zinc-600 border-zinc-200"
    if (status === "SENT") return "bg-blue-50 text-blue-600 border-blue-200"
    if (status === "COMPLETED") return "bg-emerald-50 text-emerald-600 border-emerald-200"
    return "bg-zinc-100 text-zinc-600 border-zinc-200"
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold text-zinc-900">Goods Receipt</h1>
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
                  {new Date(po.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>

              <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedPO(po)
                    setView("detail")
                  }}
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
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={submitting}
                  onClick={() => void handleReceiveAll(selectedPO)}
                >
                  {submitting ? "Memproses..." : "Terima Semua Barang"}
                </Button>
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
                    <th className="px-4 py-3 text-center">Qty Received</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedPO.items.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium">{item.productName}</td>
                      <td className="px-4 py-3 text-right">
                        Rp {item.costPerUnit.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-center">{item.qtyOrdered}</td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                        {item.qtyReceived || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        Rp {(item.subtotal || 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-zinc-50 p-4">
                <h3 className="font-semibold text-zinc-900">Riwayat Goods Receipt</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3">Lokasi</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedReceiptHistory.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-zinc-500">
                          {new Date(receipt.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 font-medium">{receipt.productName}</td>
                        <td className="px-4 py-3">{receipt.locationName || "-"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                          +{receipt.qty}
                        </td>
                        <td className="px-4 py-3 text-right">
                          Rp {receipt.costPerUnit.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}

                    {selectedReceiptHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                          Belum ada histori goods receipt untuk PO ini.
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
    </div>
  )
}

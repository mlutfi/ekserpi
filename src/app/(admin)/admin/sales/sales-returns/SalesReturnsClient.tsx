"use client"

import { useEffect, useMemo, useState } from "react"
import { Product, Sale, StockIn, productsApi, salesApi, stockApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RefreshCw, RotateCcw } from "lucide-react"

export default function SalesReturnsClient() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [paidSales, setPaidSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [salesReturnHistory, setSalesReturnHistory] = useState<StockIn[]>([])

  const [selectedSaleId, setSelectedSaleId] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState("")

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [saleData, productData, stockInData] = await Promise.all([
        salesApi.getAll("PAID"),
        productsApi.getAll(),
        stockApi.getStockIns(1, 200),
      ])

      setPaidSales(saleData ?? [])
      setProducts((productData ?? []).filter((product) => product.isActive))
      setSalesReturnHistory(
        (stockInData.data ?? []).filter((entry) => (entry.note || "").includes("[SALES_RETURN]"))
      )
    } catch (_error) {
      toast.error("Gagal memuat data sales return")
    } finally {
      setLoading(false)
    }
  }

  const selectedSale = useMemo(
    () => paidSales.find((sale) => sale.id === selectedSaleId),
    [paidSales, selectedSaleId]
  )

  const selectedSaleItems = useMemo(() => selectedSale?.items ?? [], [selectedSale])

  const selectedItem = useMemo(
    () => selectedSaleItems.find((item) => item.productId === selectedProductId),
    [selectedSaleItems, selectedProductId]
  )

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedSale) {
      toast.error("Pilih transaksi penjualan terlebih dahulu")
      return
    }
    if (!selectedItem) {
      toast.error("Pilih item produk yang akan diretur")
      return
    }
    if (qty <= 0) {
      toast.error("Qty retur harus lebih dari 0")
      return
    }
    if (qty > selectedItem.qty) {
      toast.error("Qty retur melebihi qty item pada transaksi")
      return
    }

    setSubmitting(true)
    try {
      const costPerUnit = selectedProduct?.cost || 0
      const note = `[SALES_RETURN] sale=${selectedSale.id} customer=${selectedSale.customerName || "walk-in"} reason=${reason || "tidak disebutkan"}`

      await stockApi.addStockIn({
        productId: selectedItem.productId,
        locationId: selectedSale.locationId,
        qty,
        costPerUnit,
        note,
      })

      toast.success("Sales return berhasil diproses")
      setQty(1)
      setReason("")
      setSelectedProductId("")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memproses sales return")
    } finally {
      setSubmitting(false)
    }
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
          <h1 className="text-2xl font-bold text-zinc-900">Sales Return</h1>
          <p className="text-sm text-zinc-500">Proses pengembalian barang dari customer ke stok</p>
        </div>
        <Button variant="outline" onClick={() => void fetchData()} disabled={submitting}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Transaksi Penjualan (PAID) *</label>
            <select
              required
              value={selectedSaleId}
              onChange={(e) => {
                setSelectedSaleId(e.target.value)
                setSelectedProductId("")
              }}
              className="w-full rounded-md border p-2 text-sm"
            >
              <option value="" disabled>
                Pilih transaksi
              </option>
              {paidSales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.id.slice(0, 8).toUpperCase()} - {sale.customerName || "Walk-in"} - Rp{" "}
                  {sale.total.toLocaleString("id-ID")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Item Produk *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-md border p-2 text-sm"
              disabled={!selectedSale}
            >
              <option value="" disabled>
                Pilih produk dari transaksi
              </option>
              {selectedSaleItems.map((item, index) => (
                <option key={`${item.productId}-${index}`} value={item.productId}>
                  {item.productName} (Sold: {item.qty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Qty Return *</label>
            <input
              type="number"
              min="1"
              required
              value={qty}
              onChange={(e) => setQty(Number.parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-md border p-2 text-sm"
            />
            {selectedItem && (
              <p className="mt-1 text-xs text-zinc-500">Maksimal return: {selectedItem.qty} unit</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Lokasi Retur</label>
            <div className="rounded-md border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {selectedSale?.locationName || "-"}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Alasan Retur</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border p-2 text-sm"
              placeholder="Contoh: Kemasan rusak / salah item / barang cacat"
            />
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Proses ini akan menambahkan stok kembali ke inventory lokasi transaksi penjualan.
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {submitting ? "Memproses..." : "Proses Sales Return"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b bg-zinc-50 p-4">
          <h3 className="font-semibold text-zinc-900">Riwayat Sales Return</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {salesReturnHistory.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(entry.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.productName}</td>
                  <td className="px-4 py-3">{entry.locationName || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">+{entry.qty}</td>
                  <td className="px-4 py-3 text-zinc-600">{entry.note || "-"}</td>
                  <td className="px-4 py-3 text-zinc-600">{entry.createdBy || "-"}</td>
                </tr>
              ))}

              {salesReturnHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    Belum ada histori sales return
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

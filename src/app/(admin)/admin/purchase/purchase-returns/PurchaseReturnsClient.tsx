"use client"

import { useEffect, useMemo, useState } from "react"
import { Inventory, locationsApi, Location, productsApi, Product, stockApi, StockOut } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRightLeft, Plus, RefreshCw } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

export default function PurchaseReturnsClient() {
  const [view, setView] = useState<"list" | "form">("list")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [returns, setReturns] = useState<StockOut[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])

  const [productId, setProductId] = useState("")
  const [locationId, setLocationId] = useState("")
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState("")

  useEffect(() => {
    void fetchData()
  }, [])

  useEffect(() => {
    if (!locationId) return
    void fetchInventory(locationId)
  }, [locationId])

  async function fetchData() {
    setLoading(true)
    try {
      const [stockOutData, productData, locationData] = await Promise.all([
        stockApi.getStockOuts(1, 100),
        productsApi.getAll(),
        locationsApi.getAll(),
      ])

      const refunds = (stockOutData.data ?? []).filter((item) => item.reason === "REFUND")
      setReturns(refunds)
      setProducts((productData ?? []).filter((p) => p.isActive))
      setLocations(locationData ?? [])

      const defaultLocation = locationData.find((loc) => loc.isDefault)
      if (defaultLocation) setLocationId(defaultLocation.id)
      else if (locationData.length > 0) setLocationId(locationData[0].id)
    } catch (_error) {
      toast.error("Gagal memuat data purchase return")
    } finally {
      setLoading(false)
    }
  }

  async function fetchInventory(targetLocationId: string) {
    try {
      const inventoryData = await stockApi.getInventory(targetLocationId)
      setInventory(inventoryData ?? [])
    } catch (_error) {
      setInventory([])
    }
  }

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId]
  )

  const currentStock = useMemo(() => {
    if (!productId || !locationId) return 0
    const item = inventory.find(
      (inv) => inv.productId === productId && inv.locationId === locationId
    )
    return item?.qtyOnHand || 0
  }, [inventory, productId, locationId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!productId || !locationId) {
      toast.error("Pilih produk dan lokasi terlebih dahulu")
      return
    }
    if (qty <= 0) {
      toast.error("Qty harus lebih dari 0")
      return
    }
    if (qty > currentStock) {
      toast.error("Qty return melebihi stok tersedia")
      return
    }

    setSubmitting(true)
    try {
      await stockApi.addStockOut({
        productId,
        locationId,
        qty,
        reason: "REFUND",
        note: note || `Purchase return ${selectedProduct?.name || ""}`.trim(),
      })

      toast.success("Purchase return berhasil dicatat")
      setQty(1)
      setProductId("")
      setNote("")
      setView("list")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan purchase return")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Purchase Return</h1>
          <p className="text-sm text-zinc-500">
            {view === "list" && "Kelola retur pembelian ke supplier"}
            {view === "form" && "Input transaksi retur pembelian"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchData()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {view === "list" ? (
            <Button onClick={() => setView("form")}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Return
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
              <label className="mb-1 block text-sm font-medium">Lokasi *</label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="" disabled>
                  Pilih lokasi
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} {location.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Produk *</label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="" disabled>
                  Pilih produk
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ""}
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
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Stok Tersedia</label>
              <div className="rounded-md border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                {currentStock} unit
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Catatan</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Contoh: Barang rusak dari supplier, retur invoice INV-..."
              />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Proses ini akan mengurangi stok inventory dengan reason <strong>REFUND</strong>.
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Purchase Return"}
            </Button>
          </div>
        </form>
      )}

      {view === "list" && (
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="border-b bg-zinc-50 p-4">
            <h3 className="font-semibold text-zinc-900">Riwayat Purchase Return</h3>
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
                {returns.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className="px-4 py-3">{item.locationName || "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      <span className="inline-flex items-center gap-1">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        -{item.qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{item.note || "-"}</td>
                    <td className="px-4 py-3 text-zinc-600">{item.createdBy || "-"}</td>
                  </tr>
                ))}

                {returns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                      Belum ada transaksi purchase return
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

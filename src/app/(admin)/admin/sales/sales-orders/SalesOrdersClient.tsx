"use client"

import { useEffect, useMemo, useState } from "react"
import { locationsApi, Location, productsApi, Product, Sale, salesApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react"

type SalesFilter = "ALL" | "PENDING" | "PAID" | "CANCELLED"

export default function SalesOrdersClient() {
  const [view, setView] = useState<"list" | "form" | "detail">("list")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<SalesFilter>("ALL")

  const [salesOrders, setSalesOrders] = useState<Sale[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const [customerName, setCustomerName] = useState("")
  const [locationId, setLocationId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [transferReference, setTransferReference] = useState("")
  const [orderItems, setOrderItems] = useState<{ productId: string; qty: number; product?: Product }[]>(
    []
  )

  useEffect(() => {
    void fetchSales()
  }, [statusFilter])

  useEffect(() => {
    if (view === "form") {
      void fetchDependencies()
    }
  }, [view])

  async function fetchSales() {
    setLoading(true)
    try {
      const status = statusFilter === "ALL" ? undefined : statusFilter
      const data = await salesApi.getAll(status)
      setSalesOrders(data ?? [])
    } catch (_error) {
      toast.error("Gagal memuat sales order")
    } finally {
      setLoading(false)
    }
  }

  async function fetchDependencies() {
    try {
      const [productData, locationData] = await Promise.all([productsApi.getAll(), locationsApi.getAll()])
      setProducts((productData ?? []).filter((p) => p.isActive))
      setLocations(locationData ?? [])

      const defaultLocation = locationData.find((location) => location.isDefault)
      if (defaultLocation) setLocationId(defaultLocation.id)
      else if (locationData.length > 0) setLocationId(locationData[0].id)
    } catch (_error) {
      toast.error("Gagal memuat produk/lokasi")
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return []
    const needle = searchQuery.toLowerCase()
    return products.filter((product) => {
      const hitName = product.name.toLowerCase().includes(needle)
      const hitSku = product.sku?.toLowerCase().includes(needle)
      return hitName || !!hitSku
    })
  }, [products, searchQuery])

  function addProductToOrder(product: Product) {
    const existing = orderItems.find((item) => item.productId === product.id)
    if (existing) {
      setOrderItems((prev) =>
        prev.map((item) => (item.productId === product.id ? { ...item, qty: item.qty + 1 } : item))
      )
    } else {
      setOrderItems((prev) => [...prev, { productId: product.id, qty: 1, product }])
    }
    setSearchQuery("")
  }

  function updateOrderItem(index: number, qty: string) {
    const parsed = Number.parseInt(qty, 10)
    const safeQty = Number.isNaN(parsed) ? 0 : parsed
    setOrderItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], qty: safeQty }
      return copy
    })
  }

  function removeOrderItem(index: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateSalesOrder(e: React.FormEvent) {
    e.preventDefault()

    if (!locationId) {
      toast.error("Pilih lokasi terlebih dahulu")
      return
    }
    if (orderItems.length === 0) {
      toast.error("Tambahkan minimal 1 item")
      return
    }
    if (orderItems.some((item) => item.qty <= 0)) {
      toast.error("Qty item harus lebih dari 0")
      return
    }

    setSubmitting(true)
    try {
      const sale = await salesApi.create(
        locationId,
        orderItems.map((item) => ({ productId: item.productId, qty: item.qty })),
        customerName || undefined
      )
      toast.success("Sales order berhasil dibuat")

      setSelectedSale(sale)
      setView("detail")
      setOrderItems([])
      setCustomerName("")
      setTransferReference("")
      await fetchSales()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal membuat sales order")
    } finally {
      setSubmitting(false)
    }
  }

  async function refreshSelectedSale(id: string) {
    try {
      const sale = await salesApi.getById(id)
      setSelectedSale(sale)
    } catch (_error) {
      // no-op
    }
  }

  async function handlePayCash(sale: Sale) {
    const confirmed = confirm("Proses pembayaran tunai untuk order ini?")
    if (!confirmed) return

    setSubmitting(true)
    try {
      await salesApi.payCash(sale.id, sale.total)
      toast.success("Pembayaran tunai berhasil")
      await fetchSales()
      await refreshSelectedSale(sale.id)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal proses pembayaran tunai")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayTransfer(sale: Sale) {
    if (!transferReference.trim()) {
      toast.error("Isi keterangan transfer terlebih dahulu")
      return
    }

    setSubmitting(true)
    try {
      await salesApi.payTransfer(sale.id, transferReference.trim())
      toast.success("Pembayaran transfer berhasil")
      setTransferReference("")
      await fetchSales()
      await refreshSelectedSale(sale.id)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal proses transfer")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayQRISStatic(sale: Sale) {
    const confirmed = confirm("Tandai order ini sebagai pembayaran QRIS static?")
    if (!confirmed) return

    setSubmitting(true)
    try {
      await salesApi.payQRISStatic(sale.id)
      toast.success("Pembayaran QRIS static berhasil")
      await fetchSales()
      await refreshSelectedSale(sale.id)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal proses QRIS static")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(sale: Sale) {
    const confirmed = confirm("Batalkan sales order ini?")
    if (!confirmed) return

    setSubmitting(true)
    try {
      await salesApi.updateStatus(sale.id, "CANCELLED")
      toast.success("Sales order dibatalkan")
      await fetchSales()
      await refreshSelectedSale(sale.id)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal membatalkan sales order")
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusStyle(status: string) {
    if (status === "PENDING") return "bg-amber-50 border-amber-200 text-amber-700"
    if (status === "PAID") return "bg-emerald-50 border-emerald-200 text-emerald-700"
    if (status === "CANCELLED") return "bg-red-50 border-red-200 text-red-700"
    return "bg-zinc-50 border-zinc-200 text-zinc-700"
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
          <h1 className="text-2xl font-bold text-zinc-900">Sales Order</h1>
          <p className="text-sm text-zinc-500">
            {view === "list" && "Kelola pesanan penjualan pelanggan"}
            {view === "form" && "Buat sales order baru"}
            {view === "detail" && `Detail ${selectedSale?.id?.slice(0, 8) || "Sales Order"}`}
          </p>
        </div>

        {view === "list" ? (
          <Button onClick={() => setView("form")}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Sales Order
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setView("list")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        )}
      </div>

      {view === "list" && (
        <>
          <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3">
            {(["ALL", "PENDING", "PAID", "CANCELLED"] as SalesFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {salesOrders.map((sale) => (
              <div
                key={sale.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-semibold">{sale.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(sale.status)}`}>
                    {sale.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-zinc-600">
                  <p>
                    <strong>Customer:</strong> {sale.customerName || "Walk-in Customer"}
                  </p>
                  <p>
                    <strong>Lokasi:</strong> {sale.locationName || "-"}
                  </p>
                  <p>
                    <strong>Item:</strong> {sale.items.length}
                  </p>
                  <p>
                    <strong>Total:</strong> Rp {sale.total.toLocaleString("id-ID")}
                  </p>
                  <p className="pt-1 text-xs text-zinc-400">
                    {new Date(sale.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedSale(sale)
                      setTransferReference("")
                      setView("detail")
                    }}
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    Detail
                  </Button>
                </div>
              </div>
            ))}

            {salesOrders.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-zinc-300 bg-white py-12 text-center text-zinc-500">
                Tidak ada sales order untuk filter ini
              </div>
            )}
          </div>
        </>
      )}

      {view === "form" && (
        <form onSubmit={handleCreateSalesOrder} className="space-y-6 rounded-lg border bg-white p-6">
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
              <label className="mb-1 block text-sm font-medium">Nama Customer</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Opsional (walk-in jika kosong)"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-4 border-b pb-2 font-semibold text-zinc-900">Item Sales Order</h3>

            <div className="relative mb-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk berdasarkan nama atau SKU..."
                className="block w-full rounded-md border py-2 pl-10 pr-3 text-sm placeholder-zinc-400"
              />

              {searchQuery && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProductToOrder(product)}
                      className="flex w-full items-center justify-between border-b p-3 text-left last:border-0 hover:bg-zinc-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{product.name}</div>
                        <div className="text-xs text-zinc-500">{product.sku || "No SKU"}</div>
                      </div>
                      <div className="text-sm font-medium text-zinc-700">
                        Rp {product.price.toLocaleString("id-ID")}
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-3 text-center text-sm text-zinc-500">Produk tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border bg-zinc-50">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-zinc-100 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="w-32 px-4 py-3">Qty</th>
                    <th className="px-4 py-3 text-right">Harga</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`} className="border-b bg-white">
                      <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateOrderItem(idx, e.target.value)}
                          className="w-20 rounded border p-1.5 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        Rp {(item.product?.price || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        Rp {((item.product?.price || 0) * item.qty).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeOrderItem(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {orderItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                        Belum ada item
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg border bg-zinc-50 p-4">
              <div className="font-semibold text-zinc-600">Total Order</div>
              <div className="text-xl font-bold">
                Rp{" "}
                {orderItems
                  .reduce((total, item) => total + (item.product?.price || 0) * item.qty, 0)
                  .toLocaleString("id-ID")}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={submitting || orderItems.length === 0}>
                {submitting ? "Menyimpan..." : "Simpan Sales Order"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {view === "detail" && selectedSale && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 rounded-lg border bg-white p-6 md:col-span-1">
            <div>
              <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-zinc-900">Informasi Sales Order</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">ID</span>
                  <span className="font-semibold">{selectedSale.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Status</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(selectedSale.status)}`}>
                    {selectedSale.status}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Customer</span>
                  <span className="text-right">{selectedSale.customerName || "Walk-in Customer"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Lokasi</span>
                  <span className="text-right">{selectedSale.locationName || "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Total</span>
                  <span className="text-right font-semibold">
                    Rp {selectedSale.total.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Tindakan</div>

              {selectedSale.status === "PENDING" ? (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => void handlePayCash(selectedSale)}
                    disabled={submitting}
                  >
                    Bayar Tunai
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-zinc-300"
                    onClick={() => void handlePayQRISStatic(selectedSale)}
                    disabled={submitting}
                  >
                    Bayar QRIS Static
                  </Button>

                  <div className="space-y-2 rounded-lg border p-3">
                    <label className="block text-xs font-medium text-zinc-600">Referensi Transfer</label>
                    <input
                      type="text"
                      value={transferReference}
                      onChange={(e) => setTransferReference(e.target.value)}
                      className="w-full rounded-md border p-2 text-sm"
                      placeholder="No. rekening / nama bank / referensi"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => void handlePayTransfer(selectedSale)}
                      disabled={submitting}
                    >
                      Bayar Transfer
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:bg-red-50"
                    onClick={() => void handleCancel(selectedSale)}
                    disabled={submitting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Batalkan Order
                  </Button>
                </div>
              ) : selectedSale.status === "PAID" ? (
                <div className="rounded border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Sales order sudah dibayar.
                </div>
              ) : (
                <div className="rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                  Sales order ini dibatalkan.
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-white md:col-span-2">
            <div className="border-b bg-zinc-50 p-4">
              <h3 className="font-semibold text-zinc-900">Rincian Item</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Harga</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedSale.items.map((item, index) => (
                  <tr key={`${item.productId}-${index}`} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-center">{item.qty}</td>
                    <td className="px-4 py-3 text-right">Rp {item.price.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">Rp {item.subtotal.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-zinc-50">
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right font-bold text-zinc-600">
                    TOTAL
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-bold">
                    Rp {selectedSale.total.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

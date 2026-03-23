"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  purchaseOrdersApi,
  PurchaseOrder,
  suppliersApi,
  Supplier,
  locationsApi,
  Location,
  productsApi,
  Product,
} from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ClipboardList, Eye, Plus, Search, Trash2, X } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { formatDate } from "@/lib/utils"

export default function PurchaseRequestsClient() {
  const router = useRouter()
  const [view, setView] = useState<"list" | "form" | "detail">("list")
  const [requests, setRequests] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PurchaseOrder | null>(null)

  const [supplierId, setSupplierId] = useState("")
  const [locationId, setLocationId] = useState("")
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split("T")[0])
  const [note, setNote] = useState("")
  const [orderItems, setOrderItems] = useState<
    { productId: string; qty: number; cost: number; product?: Product }[]
  >([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (view === "list") {
      void fetchRequests()
    }
  }, [view])

  useEffect(() => {
    if (view === "form") {
      void fetchDependencies()
    }
  }, [view])

  async function fetchRequests() {
    setLoading(true)
    try {
      const data = await purchaseOrdersApi.getAll()
      const filtered = (data ?? []).filter((po) => po.status !== "COMPLETED")
      setRequests(filtered)
    } catch (_error) {
      toast.error("Gagal memuat purchase request")
    } finally {
      setLoading(false)
    }
  }

  async function fetchDependencies() {
    try {
      const [supplierData, locationData, productData] = await Promise.all([
        suppliersApi.getAll(),
        locationsApi.getAll(),
        productsApi.getAll(),
      ])

      setSuppliers(supplierData ?? [])
      setLocations(locationData ?? [])
      setProducts((productData ?? []).filter((p) => p.isActive))

      const defaultLocation = locationData.find((loc) => loc.isDefault)
      if (defaultLocation) setLocationId(defaultLocation.id)
      else if (locationData.length > 0) setLocationId(locationData[0].id)

      if (supplierData.length > 0) setSupplierId(supplierData[0].id)
    } catch (_error) {
      toast.error("Gagal memuat data master")
    }
  }

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault()

    if (orderItems.length === 0) {
      toast.error("Tambahkan minimal 1 item")
      return
    }

    setIsSubmitting(true)
    try {
      await purchaseOrdersApi.create({
        supplierId,
        locationId,
        orderDate: `${orderDate}T00:00:00Z`,
        note: note || undefined,
        items: orderItems.map((item) => ({
          productId: item.productId,
          qtyOrdered: item.qty,
          costPerUnit: item.cost,
        })),
      })

      toast.success("Purchase request berhasil dibuat")
      resetForm()
      setView("list")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal membuat purchase request")
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setOrderItems([])
    setSupplierId("")
    setLocationId("")
    setNote("")
    setSearchQuery("")
    setOrderDate(new Date().toISOString().split("T")[0])
  }

  async function handleUpdateStatus(id: string, status: string) {
    const confirmed = confirm(`Ubah status menjadi ${status}?`)
    if (!confirmed) return

    try {
      await purchaseOrdersApi.updateStatus(id, status)
      toast.success("Status purchase request diperbarui")

      if (selectedRequest?.id === id) {
        const updated = await purchaseOrdersApi.getById(id)
        setSelectedRequest(updated)
      }

      await fetchRequests()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memperbarui status")
    }
  }

  async function handleViewDetail(request: PurchaseOrder) {
    setLoading(true)
    try {
      const fullRequest = await purchaseOrdersApi.getById(request.id)
      setSelectedRequest(fullRequest)
      setView("detail")
    } catch (_error) {
      toast.error("Gagal memuat detail purchase request")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Hapus draft request ini?")
    if (!confirmed) return

    try {
      await purchaseOrdersApi.delete(id)
      toast.success("Draft request dihapus")
      setSelectedRequest(null)
      setView("list")
      await fetchRequests()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus request")
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return []
    const needle = searchQuery.toLowerCase()
    return products.filter((product) => {
      const nameHit = product.name.toLowerCase().includes(needle)
      const skuHit = product.sku?.toLowerCase().includes(needle)
      return nameHit || !!skuHit
    })
  }, [products, searchQuery])

  function addProductToRequest(product: Product) {
    const existing = orderItems.find((item) => item.productId === product.id)
    if (existing) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      )
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          productId: product.id,
          qty: 1,
          cost: product.cost || product.price,
          product,
        },
      ])
    }
    setSearchQuery("")
  }

  function updateOrderItem(index: number, field: "qty" | "cost", value: string) {
    const parsed = Number.parseInt(value, 10)
    const safeValue = Number.isNaN(parsed) ? 0 : parsed
    setOrderItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: safeValue }
      return copy
    })
  }

  function removeOrderItem(index: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  function getStatusStyle(status: string) {
    if (status === "DRAFT") return "bg-zinc-100 text-zinc-600 border-zinc-200"
    if (status === "SENT") return "bg-blue-50 text-blue-600 border-blue-200"
    if (status === "CANCELLED") return "bg-red-50 text-red-600 border-red-200"
    return "bg-zinc-100 text-zinc-600 border-zinc-200"
  }

  if (loading && view === "list") {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Purchase Request</h1>
          <p className="text-sm text-zinc-500">
            {view === "list" && "Buat dan kelola permintaan pembelian internal"}
            {view === "form" && "Input purchase request baru"}
            {view === "detail" && `Detail ${selectedRequest?.poNumber || "Request"}`}
          </p>
        </div>

        {view === "list" && (
          <Button onClick={() => setView("form")}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Request
          </Button>
        )}

        {view !== "list" && (
          <Button variant="outline" onClick={() => setView("list")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        )}
      </div>

      {view === "list" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-semibold">{request.poNumber}</span>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(request.status)}`}
                >
                  {request.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-zinc-600">
                <p>
                  <strong>Supplier:</strong> {request.supplierName || "-"}
                </p>
                <p>
                  <strong>Lokasi:</strong> {request.locationName || "-"}
                </p>
                <p>
                  <strong>Total:</strong> Rp {request.totalAmount.toLocaleString("id-ID")}
                </p>
                <p className="pt-1 text-xs text-zinc-400">
                  {formatDate(request.createdAt)}
                </p>
              </div>

              <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewDetail(request)}
                >
                  <Eye className="mr-2 h-3 w-3" />
                  Detail
                </Button>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-zinc-300 bg-white py-12 text-center text-zinc-500">
              Belum ada purchase request
            </div>
          )}
        </div>
      )}

      {view === "form" && (
        <form onSubmit={handleCreateRequest} className="space-y-6 rounded-lg border bg-white p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              >
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Lokasi Gudang *</label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} {location.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tanggal Request *</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Catatan</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Keterangan tambahan kebutuhan pembelian..."
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-4 border-b pb-2 font-semibold text-zinc-900">Item Request</h3>

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
                      onClick={() => addProductToRequest(product)}
                      className="flex w-full items-center justify-between border-b p-3 text-left last:border-0 hover:bg-zinc-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{product.name}</div>
                        <div className="text-xs text-zinc-500">{product.sku || "No SKU"}</div>
                      </div>
                      <div className="text-sm font-medium text-zinc-600">
                        Rp {(product.cost || product.price).toLocaleString("id-ID")}
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
                    <th className="w-40 px-4 py-3">Cost @</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="border-b bg-white">
                      <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateOrderItem(idx, "qty", e.target.value)}
                          className="w-20 rounded border p-1.5 text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={item.cost}
                          onChange={(e) => updateOrderItem(idx, "cost", e.target.value)}
                          className="w-28 rounded border p-1.5"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        Rp {(item.qty * item.cost).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => removeOrderItem(idx)}
                          className="h-8 w-8 text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {orderItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                        Belum ada item yang ditambahkan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg border bg-zinc-50 p-4">
              <div className="font-semibold text-zinc-600">Total Request</div>
              <div className="text-xl font-bold">
                Rp{" "}
                {orderItems
                  .reduce((total, item) => total + item.qty * item.cost, 0)
                  .toLocaleString("id-ID")}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting || orderItems.length === 0}>
                {isSubmitting ? "Menyimpan..." : "Simpan Purchase Request"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {view === "detail" && selectedRequest && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 rounded-lg border bg-white p-6 md:col-span-1">
            <div>
              <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-zinc-900">Informasi Request</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Nomor</span>
                  <span className="text-right font-semibold">{selectedRequest.poNumber}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Status</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(selectedRequest.status)}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Supplier</span>
                  <span className="text-right">{selectedRequest.supplierName || "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Lokasi</span>
                  <span className="text-right">{selectedRequest.locationName || "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Total</span>
                  <span className="text-right font-semibold">
                    Rp {selectedRequest.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Tindakan
              </div>
              <div className="flex flex-col gap-2">
                {selectedRequest.status === "DRAFT" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      onClick={() => void handleUpdateStatus(selectedRequest.id, "SENT")}
                    >
                      Ajukan Menjadi Purchase Order
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={() => void handleUpdateStatus(selectedRequest.id, "CANCELLED")}
                    >
                      Batalkan Request
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-red-600 hover:bg-red-50"
                      onClick={() => void handleDelete(selectedRequest.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Draft
                    </Button>
                  </>
                )}

                {selectedRequest.status === "SENT" && (
                  <>
                    <div className="rounded border border-blue-100 bg-blue-50 p-3 text-center text-sm text-blue-700">
                      Request sudah diajukan sebagai PO.
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/purchase/purchase-orders")}
                    >
                      Buka Modul Purchase Order
                    </Button>
                  </>
                )}

                {selectedRequest.status === "CANCELLED" && (
                  <div className="rounded border border-red-100 bg-red-50 p-3 text-center text-sm text-red-700">
                    Purchase request ini dibatalkan.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-white md:col-span-2">
            <div className="border-b bg-zinc-50 p-4">
              <h3 className="font-semibold text-zinc-900">Rincian Item Request</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-right">Harga Beli</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedRequest.items.map((item, idx) => (
                  <tr key={`${item.productId}-${idx}`} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-right">
                      Rp {item.costPerUnit.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-center">{item.qtyOrdered}</td>
                    <td className="px-4 py-3 text-right">
                      Rp {(item.subtotal || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-zinc-50">
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right font-bold text-zinc-600">
                    TOTAL
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-bold">
                    Rp {selectedRequest.totalAmount.toLocaleString("id-ID")}
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

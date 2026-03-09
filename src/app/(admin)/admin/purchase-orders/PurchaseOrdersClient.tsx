"use client"

import { useState, useEffect } from "react"
import { purchaseOrdersApi, PurchaseOrder, suppliersApi, Supplier, locationsApi, Location, productsApi, Product } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus, Eye, ShoppingCart, ArrowLeft, Trash2, Search, X } from "lucide-react"

export default function PurchaseOrdersClient() {
    const [view, setView] = useState<"list" | "form" | "detail">("list")
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Dependencies
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [locations, setLocations] = useState<Location[]>([])
    const [products, setProducts] = useState<Product[]>([])

    // Selected PO for detail view
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

    // Form State
    const [supplierId, setSupplierId] = useState("")
    const [locationId, setLocationId] = useState("")
    const [orderDate, setOrderDate] = useState(() => {
        const now = new Date()
        return now.toISOString().split('T')[0]
    })
    const [note, setNote] = useState("")
    const [orderItems, setOrderItems] = useState<{ productId: string; qty: number; cost: number; product?: Product }[]>([])

    // Product Search State
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchPOs()
    }, [view])

    useEffect(() => {
        if (view === "form") {
            fetchDependencies()
        }
    }, [view])

    async function fetchPOs() {
        setLoading(true)
        try {
            const data = await purchaseOrdersApi.getAll()
            setPurchaseOrders(data ?? [])
        } catch (error) {
            toast.error("Gagal memuat Purchase Orders")
        } finally {
            setLoading(false)
        }
    }

    async function fetchDependencies() {
        try {
            const [supData, locData, prodData] = await Promise.all([
                suppliersApi.getAll(),
                locationsApi.getAll(),
                productsApi.getAll()
            ])
            setSuppliers(supData ?? [])
            setLocations(locData ?? [])
            setProducts(prodData ?? [])

            // Auto-select default location
            const defLoc = locData.find(loc => loc.isDefault)
            if (defLoc) setLocationId(defLoc.id)
            else if (locData.length > 0) setLocationId(locData[0].id)

            if (supData.length > 0) setSupplierId(supData[0].id)
        } catch (error) {
            toast.error("Gagal memuat dependensi formulir")
        }
    }

    async function handleCreatePO(e: React.FormEvent) {
        e.preventDefault()
        if (orderItems.length === 0) {
            toast.error("Pesan", { description: "Tambahkan setidaknya satu item ke PO" })
            return
        }

        setIsSubmitting(true)
        try {
            await purchaseOrdersApi.create({
                supplierId,
                locationId,
                orderDate: orderDate + "T00:00:00Z",
                note,
                items: orderItems.map(i => ({
                    productId: i.productId,
                    qtyOrdered: i.qty,
                    costPerUnit: i.cost
                }))
            })
            toast.success("Berhasil membuat Purchase Order")
            setView("list")
            // Reset form
            setSupplierId("")
            setNote("")
            setOrderItems([])
            setOrderDate(new Date().toISOString().split('T')[0])
        } catch (error: any) {
            toast.error("Gagal", { description: error.response?.data?.message || "Kesalahan server" })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleUpdateStatus(poId: string, status: string) {
        if (!confirm(`Tandai PO sebagai ${status}?`)) return
        try {
            await purchaseOrdersApi.updateStatus(poId, status)
            toast.success(`PO berhasil diperbarui ke ${status}`)
            if (view === "detail" && selectedPO) {
                // Refresh detail
                const updated = await purchaseOrdersApi.getById(poId)
                setSelectedPO(updated)
            } else {
                fetchPOs()
            }
        } catch (error: any) {
            toast.error("Gagal", { description: error.response?.data?.message || "Kesalahan server" })
        }
    }

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))

    const addProductToOrder = (product: Product) => {
        const existing = orderItems.find(i => i.productId === product.id)
        if (existing) {
            setOrderItems(orderItems.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
        } else {
            setOrderItems([...orderItems, { productId: product.id, qty: 1, cost: product.cost || product.price, product }])
        }
        setSearchQuery("")
    }

    const removeOrderItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index))
    }

    const updateOrderItem = (index: number, field: "qty" | "cost", value: string) => {
        const val = parseInt(value) || 0
        const newItems = [...orderItems]
        newItems[index] = { ...newItems[index], [field]: val }
        setOrderItems(newItems)
    }

    function getStatusStyle(status: string) {
        switch (status) {
            case "DRAFT": return "bg-zinc-100 text-zinc-600 border-zinc-200"
            case "SENT": return "bg-blue-50 text-blue-600 border-blue-200"
            case "COMPLETED": return "bg-emerald-50 text-emerald-600 border-emerald-200"
            case "CANCELLED": return "bg-red-50 text-red-600 border-red-200"
            default: return "bg-zinc-100 text-zinc-600"
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
                    <h1 className="text-2xl font-bold text-zinc-900">Purchase Order</h1>
                    <p className="text-sm text-zinc-500">
                        {view === "list" && "Kelola pemesanan barang ke supplier"}
                        {view === "form" && "Buat pemesanan baru"}
                        {view === "detail" && `Detail Pemesanan ${selectedPO?.poNumber}`}
                    </p>
                </div>

                {view === "list" && (
                    <Button onClick={() => setView("form")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Buat PO
                    </Button>
                )}

                {view !== "list" && (
                    <Button variant="outline" onClick={() => setView("list")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                )}
            </div>

            {/* LIST VIEW */}
            {view === "list" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {purchaseOrders.map((po) => (
                        <div key={po.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-zinc-500" />
                                    <span className="font-semibold text-sm">{po.poNumber}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(po.status)}`}>
                                    {po.status}
                                </span>
                            </div>
                            <div className="text-sm space-y-1 text-zinc-600 mb-4">
                                <p><strong>Supplier:</strong> {po.supplierName}</p>
                                <p><strong>Lokasi:</strong> {po.locationName}</p>
                                <p><strong>Total:</strong> Rp {po.totalAmount.toLocaleString()}</p>
                                <p className="text-xs text-zinc-400 mt-2">{new Date(po.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex justify-end pt-3 border-t border-zinc-100 gap-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedPO(po); setView("detail"); }}>
                                    <Eye className="w-3 h-3 mr-2" /> Detail
                                </Button>
                            </div>
                        </div>
                    ))}
                    {purchaseOrders.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500 bg-white border border-dashed rounded-lg">
                            Belum ada Purchase Order
                        </div>
                    )}
                </div>
            )}

            {/* CREATE FORM VIEW */}
            {view === "form" && (
                <form onSubmit={handleCreatePO} className="bg-white border rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Supplier *</label>
                            <select
                                required
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full border rounded-md p-2 text-sm"
                            >
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Penerima (Lokasi Gudang) *</label>
                            <select
                                required
                                value={locationId}
                                onChange={e => setLocationId(e.target.value)}
                                className="w-full border rounded-md p-2 text-sm"
                            >
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name} {l.isDefault ? '(Default)' : ''}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tanggal Order *</label>
                            <input
                                type="date"
                                required
                                value={orderDate}
                                onChange={e => setOrderDate(e.target.value)}
                                className="w-full border rounded-md p-2 text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Catatan Tambahan</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={2}
                                className="w-full border rounded-md p-2 text-sm"
                                placeholder="Catatan untuk pemesanan..."
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-4 text-zinc-900 border-b pb-2">Item Pemesanan</h3>

                        {/* Product Search */}
                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk berdasarkan nama atau SKU lalu klik untuk menambahkan..."
                                className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
                            />
                            {searchQuery && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => addProductToOrder(p)}
                                            className="p-3 hover:bg-zinc-50 cursor-pointer border-b last:border-0 flex justify-between"
                                        >
                                            <div>
                                                <div className="font-medium text-sm text-zinc-900">{p.name}</div>
                                                <div className="text-xs text-zinc-500">{p.sku || 'No SKU'}</div>
                                            </div>
                                            <div className="text-sm text-zinc-600 font-medium">Auto-Cost: Rp {(p.cost || p.price).toLocaleString()}</div>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && <div className="p-3 text-sm text-zinc-500 text-center">Produk tidak ditemukan</div>}
                                </div>
                            )}
                        </div>

                        {/* Order Items Table */}
                        <div className="bg-zinc-50 border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3 w-32">Qty Order</th>
                                        <th className="px-4 py-3 w-40">Cost @ (Rp)</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems.map((item, idx) => (
                                        <tr key={idx} className="border-b bg-white">
                                            <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                                            <td className="px-4 py-3">
                                                <input type="number" min="1" value={item.qty} onChange={e => updateOrderItem(idx, 'qty', e.target.value)} className="w-20 border rounded p-1.5 text-center" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="number" min="0" value={item.cost} onChange={e => updateOrderItem(idx, 'cost', e.target.value)} className="w-28 border rounded p-1.5" />
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {(item.qty * item.cost).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="icon" type="button" onClick={() => removeOrderItem(idx)} className="h-8 w-8 text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orderItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 bg-white">Belum ada produk yang ditambahkan</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-between items-center bg-zinc-50 p-4 border rounded-lg">
                            <div className="font-semibold text-zinc-600">Total Pembelian</div>
                            <div className="text-xl font-bold">Rp {orderItems.reduce((acc, curr) => acc + (curr.qty * curr.cost), 0).toLocaleString()}</div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button type="submit" size="lg" disabled={isSubmitting || orderItems.length === 0}>
                                {isSubmitting ? "Menyimpan..." : "Buat Purchase Order"}
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {/* DETAIL VIEW */}
            {view === "detail" && selectedPO && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-lg p-6 space-y-6 md:col-span-1 h-fit">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2 mb-4">Informasi Dokumen</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Nomor PO</span>
                                    <span className="font-semibold">{selectedPO.poNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Status</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(selectedPO.status)}`}>
                                        {selectedPO.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Tanggal Transaksi</span>
                                    <span>{new Date(selectedPO.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Supplier</span>
                                    <span className="font-medium text-right">{selectedPO.supplierName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Penerima</span>
                                    <span className="text-right">{selectedPO.locationName}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tindakan Cepat</div>
                            <div className="flex flex-col gap-2">
                                {selectedPO.status === "DRAFT" && (
                                    <>
                                        <Button variant="outline" className="w-full text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={() => handleUpdateStatus(selectedPO.id, "SENT")}>Tandai Dikirim ke Supplier</Button>
                                        <Button variant="outline" className="w-full text-red-600 border-red-200 bg-red-50 hover:bg-red-100" onClick={() => handleUpdateStatus(selectedPO.id, "CANCELLED")}>Batalkan PO</Button>
                                    </>
                                )}
                                {selectedPO.status === "SENT" && (
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(selectedPO.id, "COMPLETED")}>Barang Diterima & Selesai</Button>
                                )}
                                {selectedPO.status === "COMPLETED" && (
                                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 text-sm text-center">
                                        Purchase order ini sudah selesai dan stok telah masuk (HPP Diperbarui).
                                    </div>
                                )}
                                {selectedPO.status === "CANCELLED" && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded border border-red-100 text-sm text-center">
                                        Purchase order dibatalkan.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg overflow-hidden md:col-span-2">
                        <div className="p-4 border-b bg-zinc-50">
                            <h3 className="font-semibold text-zinc-900">Rincian Barang</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b">
                                <tr>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3 text-right">Harga Beli</th>
                                    <th className="px-4 py-3 text-center">Qty Pesan</th>
                                    <th className="px-4 py-3 text-center">Qty Terima</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {selectedPO.items.map((item, idx) => (
                                    <tr key={idx} className="bg-white hover:bg-zinc-50">
                                        <td className="px-4 py-3 font-medium">{item.productName}</td>
                                        <td className="px-4 py-3 text-right">Rp {item.costPerUnit.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">{item.qtyOrdered}</td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-600">
                                            {item.qtyReceived || (selectedPO.status === "COMPLETED" ? item.qtyOrdered : "-")}
                                        </td>
                                        <td className="px-4 py-3 text-right">Rp {(item.subtotal || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-zinc-50 border-t">
                                <tr>
                                    <td colSpan={4} className="px-4 py-4 text-right font-bold text-zinc-600">TOTAL (Rp)</td>
                                    <td className="px-4 py-4 text-right font-bold text-lg">{selectedPO.totalAmount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

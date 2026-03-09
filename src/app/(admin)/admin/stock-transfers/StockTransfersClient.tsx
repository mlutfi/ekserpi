"use client"

import { useState, useEffect } from "react"
import { stockTransfersApi, StockTransfer, locationsApi, Location, productsApi, Product, stockApi, Inventory } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus, Eye, ArrowLeft, Trash2, Search, ArrowRightLeft } from "lucide-react"

export default function StockTransfersClient() {
    const [view, setView] = useState<"list" | "form" | "detail">("list")
    const [transfers, setTransfers] = useState<StockTransfer[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [locations, setLocations] = useState<Location[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [inventory, setInventory] = useState<Inventory[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null)

    // Form State
    const [sourceLocationId, setSourceLocationId] = useState("")
    const [destLocationId, setDestLocationId] = useState("")
    const [note, setNote] = useState("")
    const [transferItems, setTransferItems] = useState<{ productId: string; qty: number; product?: Product; availableStock?: number }[]>([])

    useEffect(() => {
        fetchTransfers()
    }, [view])

    useEffect(() => {
        if (view === "form") fetchDependencies()
    }, [view])

    useEffect(() => {
        if (view === "form" && sourceLocationId) {
            fetchInventory()
        }
    }, [view, sourceLocationId])

    async function fetchTransfers() {
        setLoading(true)
        try {
            const data = await stockTransfersApi.getAll()
            setTransfers(data ?? [])
        } catch (error) {
            toast.error("Gagal memuat data transfer stok")
        } finally {
            setLoading(false)
        }
    }

    async function fetchDependencies() {
        try {
            const [locData, prodData] = await Promise.all([
                locationsApi.getAll(),
                productsApi.getAll()
            ])
            setLocations(locData ?? [])
            setProducts(prodData ?? [])

            if (locData.length >= 2) {
                setSourceLocationId(locData[0].id)
                setDestLocationId(locData[1].id)
            } else if (locData.length === 1) {
                setSourceLocationId(locData[0].id)
            }
        } catch (error) {
            toast.error("Gagal memuat dependensi")
        }
    }

    async function fetchInventory() {
        try {
            const data = await stockApi.getInventory(sourceLocationId)
            setInventory(data ?? [])
        } catch (error) {
            console.error("Failed to fetch inventory", error)
        }
    }

    async function handleCreateTransfer(e: React.FormEvent) {
        e.preventDefault()
        if (sourceLocationId === destLocationId) {
            toast.error("Lokasi asal dan tujuan tidak boleh sama")
            return
        }
        if (transferItems.length === 0) {
            toast.error("Tambahkan setidaknya satu item ke daftar transfer")
            return
        }

        setIsSubmitting(true)
        try {
            await stockTransfersApi.create({
                sourceLocationId,
                destLocationId,
                note,
                items: transferItems.map(i => ({
                    productId: i.productId,
                    qty: i.qty
                }))
            })
            toast.success("Berhasil membuat form transfer stok")
            setView("list")
            setNote("")
            setTransferItems([])
        } catch (error: any) {
            toast.error("Gagal", { description: error.response?.data?.message || "Kesalahan server" })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleUpdateStatus(id: string, status: string) {
        if (!confirm(`Ubah status transfer menjadi ${status}?`)) return
        try {
            await stockTransfersApi.updateStatus(id, status)
            toast.success(`Transfer berhasil diperbarui ke status ${status}`)
            if (view === "detail" && selectedTransfer) {
                const updated = await stockTransfersApi.getById(id)
                setSelectedTransfer(updated)
            } else {
                fetchTransfers()
            }
        } catch (error: any) {
            toast.error("Gagal", { description: error.response?.data?.message || "Kesalahan server" })
        }
    }

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))

    // Map products with their available stock at source location
    const productsWithStock = filteredProducts.map(p => {
        const inv = inventory.find(i => i.productId === p.id)
        return { ...p, availableStock: inv?.qtyOnHand ?? 0 }
    })

    const addProductToTransfer = (product: Product & { availableStock?: number }) => {
        const existing = transferItems.find(i => i.productId === product.id)
        if (existing) {
            setTransferItems(transferItems.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
        } else {
            setTransferItems([...transferItems, { productId: product.id, qty: 1, product, availableStock: product.availableStock }])
        }
        setSearchQuery("")
    }

    function getStatusStyle(status: string) {
        switch (status) {
            case "PENDING": return "bg-amber-50 text-amber-600 border-amber-200"
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
                    <h1 className="text-2xl font-bold text-zinc-900">Transfer Stok</h1>
                    <p className="text-sm text-zinc-500">
                        {view === "list" && "Pantau mutasi barang antar outlet atau gudang"}
                        {view === "form" && "Buat permintaan pemindahan barang"}
                        {view === "detail" && `Detail Transfer ${selectedTransfer?.transferNumber}`}
                    </p>
                </div>

                {view === "list" && (
                    <Button onClick={() => setView("form")}>
                        <Plus className="h-4 w-4 mr-2" /> Buat Transfer
                    </Button>
                )}

                {view !== "list" && (
                    <Button variant="outline" onClick={() => setView("list")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
                    </Button>
                )}
            </div>

            {view === "list" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {transfers.map((t) => (
                        <div key={t.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="h-4 w-4 text-zinc-500" />
                                    <span className="font-semibold text-sm">{t.transferNumber}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(t.status)}`}>
                                    {t.status}
                                </span>
                            </div>
                            <div className="text-sm space-y-1.5 text-zinc-600 mb-4 bg-zinc-50 p-3 rounded border">
                                <div className="flex flex-col">
                                    <span className="text-xs text-zinc-400">Asal:</span>
                                    <span className="font-medium text-zinc-800">{t.sourceLocationName}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-zinc-400">Tujuan:</span>
                                    <span className="font-medium text-zinc-800">{t.destLocationName}</span>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 mb-3">{new Date(t.createdAt).toLocaleDateString()}</p>
                            <div className="flex justify-end pt-3 border-t border-zinc-100">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedTransfer(t); setView("detail"); }}>
                                    <Eye className="w-3 h-3 mr-2" /> Detail
                                </Button>
                            </div>
                        </div>
                    ))}
                    {transfers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500 bg-white border border-dashed rounded-lg">
                            Tidak ada data transfer stok
                        </div>
                    )}
                </div>
            )}

            {view === "form" && (
                <form onSubmit={handleCreateTransfer} className="bg-white border rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Gudang / Outlet Asal *</label>
                            <select
                                required
                                value={sourceLocationId}
                                onChange={e => setSourceLocationId(e.target.value)}
                                className="w-full border rounded-md p-2 text-sm"
                            >
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Gudang / Outlet Tujuan *</label>
                            <select
                                required
                                value={destLocationId}
                                onChange={e => setDestLocationId(e.target.value)}
                                className={`w-full border rounded-md p-2 text-sm ${sourceLocationId === destLocationId ? 'border-red-500' : ''}`}
                            >
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                            {sourceLocationId === destLocationId && (
                                <p className="text-xs text-red-500 mt-1">Lokasi tujuan tidak boleh sama dengan lokasi asal.</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Catatan</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={2}
                                className="w-full border rounded-md p-2 text-sm"
                                placeholder="Alasan pemindahan..."
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-4 text-zinc-900 border-b pb-2">Daftar Barang yang Dipindah</h3>
                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari produk..." className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm" />
                            {searchQuery && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {productsWithStock.map(p => (
                                        <div key={p.id} onClick={() => addProductToTransfer(p)} className="p-3 hover:bg-zinc-50 cursor-pointer border-b">
                                            <div className="font-medium text-sm text-zinc-900">{p.name}</div>
                                            <div className={`text-xs mt-1 ${p.availableStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                Stok tersedia: {p.availableStock}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-50 border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3 w-32 text-center">Stok Tersedia</th>
                                        <th className="px-4 py-3 w-32 text-center">Qty Transfer</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transferItems.map((item, idx) => (
                                        <tr key={idx} className="border-b bg-white">
                                            <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                                            <td className="px-4 py-3 text-center text-sm">
                                                <span className={item.availableStock && item.availableStock > 0 ? 'text-emerald-600' : 'text-red-500'}>
                                                    {item.availableStock ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input type="number" min="1" value={item.qty} onChange={e => {
                                                    const newItems = [...transferItems];
                                                    newItems[idx].qty = parseInt(e.target.value) || 0;
                                                    setTransferItems(newItems);
                                                }} className="w-20 border rounded p-1.5 text-center" />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="icon" type="button" onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))} className="h-8 w-8 text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {transferItems.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400 bg-white">Belum ada barang dipilih</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button type="submit" size="lg" disabled={isSubmitting || transferItems.length === 0 || sourceLocationId === destLocationId}>
                                {isSubmitting ? "Menyimpan..." : "Buat Dokumen Transfer"}
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {view === "detail" && selectedTransfer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-lg p-6 space-y-6 md:col-span-1 h-fit">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2 mb-4">Informasi Dokumen</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">No. Transfer</span>
                                    <span className="font-semibold">{selectedTransfer.transferNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Status</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(selectedTransfer.status)}`}>
                                        {selectedTransfer.status}
                                    </span>
                                </div>
                                <div className="mt-4 p-3 bg-zinc-50 rounded border flex flex-col gap-2">
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Gudang Asal:</span>
                                        <span className="font-medium text-zinc-900">{selectedTransfer.sourceLocationName}</span>
                                    </div>
                                    <div className="flex justify-center text-zinc-300 py-1">⬇️</div>
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Gudang Tujuan:</span>
                                        <span className="font-medium text-zinc-900">{selectedTransfer.destLocationName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tindakan Cepat</div>
                            <div className="flex flex-col gap-2">
                                {selectedTransfer.status === "PENDING" && (
                                    <>
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(selectedTransfer.id, "COMPLETED")}>Selesaikan Transfer (Stok Masuk Tujuan)</Button>
                                        <Button variant="outline" className="w-full text-red-600 border-red-200 bg-red-50 hover:bg-red-100" onClick={() => handleUpdateStatus(selectedTransfer.id, "CANCELLED")}>Batalkan Transfer</Button>
                                    </>
                                )}
                                {selectedTransfer.status === "COMPLETED" && (
                                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 text-sm text-center">
                                        Transfer selesai. Stok telah dimutasi.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg overflow-hidden md:col-span-2 h-fit">
                        <div className="p-4 border-b bg-zinc-50">
                            <h3 className="font-semibold text-zinc-900">Rincian Barang yang Ditransfer</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b">
                                <tr>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3 text-center">Jumlah Dipindah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {selectedTransfer.items.map((item, idx) => (
                                    <tr key={idx} className="bg-white hover:bg-zinc-50">
                                        <td className="px-4 py-3 font-medium">{item.productName}</td>
                                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{item.qty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

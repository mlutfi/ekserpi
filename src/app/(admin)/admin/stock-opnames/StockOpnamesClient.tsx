"use client"

import { useState, useEffect } from "react"
import { stockOpnamesApi, StockOpname, locationsApi, Location, productsApi, Product, stockApi, Inventory } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus, Eye, ArrowLeft, Trash2, Search, ClipboardCheck } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { formatDate } from "@/lib/utils"

export default function StockOpnamesClient() {
    const [view, setView] = useState<"list" | "form" | "detail">("list")
    const [opnames, setOpnames] = useState<StockOpname[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [locations, setLocations] = useState<Location[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [inventory, setInventory] = useState<Inventory[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    const [selectedOpname, setSelectedOpname] = useState<StockOpname | null>(null)

    // Form State
    const [locationId, setLocationId] = useState("")
    const [note, setNote] = useState("")
    const [opnameItems, setOpnameItems] = useState<{ productId: string; qtySystem: number; qtyActual: number; product?: Product }[]>([])

    useEffect(() => {
        fetchOpnames()
    }, [view])

    useEffect(() => {
        if (view === "form") fetchDependencies()
    }, [view])

    async function fetchOpnames() {
        setLoading(true)
        try {
            const data = await stockOpnamesApi.getAll()
            setOpnames(data ?? [])
        } catch (error) {
            toast.error("Gagal memuat data Stock Opname")
        } finally {
            setLoading(false)
        }
    }

    async function fetchDependencies() {
        try {
            const [locData, prodData, invData] = await Promise.all([
                locationsApi.getAll(),
                productsApi.getAll(),
                stockApi.getInventory()
            ])
            setLocations(locData ?? [])
            setProducts(prodData ?? [])
            setInventory(invData ?? [])

            const defLoc = locData.find(l => l.isDefault)
            if (defLoc) setLocationId(defLoc.id)
            else if (locData.length > 0) setLocationId(locData[0].id)
        } catch (error) {
            toast.error("Gagal memuat dependensi form")
        }
    }

    async function handleCreateOpname(e: React.FormEvent) {
        e.preventDefault()
        if (opnameItems.length === 0) {
            toast.error("Tambahkan setidaknya satu produk untuk dihitung valuasinya")
            return
        }

        setIsSubmitting(true)
        try {
            await stockOpnamesApi.create({
                locationId,
                note,
                items: opnameItems.map(i => ({
                    productId: i.productId,
                    qtySystem: i.qtySystem,
                    qtyActual: i.qtyActual
                }))
            })
            toast.success("Berhasil membuat draft Stock Opname")
            setView("list")
            setNote("")
            setOpnameItems([])
        } catch (error: any) {
            toast.error("Gagal", { description: error.response?.data?.message || "Kesalahan server" })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleUpdateStatus(id: string, status: string) {
        if (!confirm(`Tandai Stock Opname sebagai ${status}?`)) return
        try {
            await stockOpnamesApi.updateStatus(id, status)
            toast.success(`Opname berhasil diperbarui ke status ${status}`)
            if (view === "detail" && selectedOpname) {
                const updated = await stockOpnamesApi.getById(id)
                setSelectedOpname(updated)
            } else {
                fetchOpnames()
            }
        } catch (error: any) {
            toast.error("Gagal", { description: error.response?.data?.message || "Kesalahan server" })
        }
    }

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))

    const getSystemQty = (productId: string, locId: string) => {
        const inv = inventory.find(i => i.productId === productId && i.locationId === locId)
        return inv ? inv.qtyOnHand : 0
    }

    const addProductToOpname = (product: Product) => {
        const existing = opnameItems.find(i => i.productId === product.id)
        if (!existing) {
            const sysQty = getSystemQty(product.id, locationId)
            setOpnameItems([...opnameItems, { productId: product.id, qtySystem: sysQty, qtyActual: sysQty, product }])
        }
        setSearchQuery("")
    }

    function getStatusStyle(status: string) {
        switch (status) {
            case "DRAFT": return "bg-zinc-100 text-zinc-600 border-zinc-200"
            case "COMPLETED": return "bg-emerald-50 text-emerald-600 border-emerald-200"
            case "CANCELLED": return "bg-red-50 text-red-600 border-red-200"
            default: return "bg-zinc-100 text-zinc-600"
        }
    }

    if (loading && view === "list") {
      return <PageLoading />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Stock Opname</h1>
                    <p className="text-sm text-zinc-500">
                        {view === "list" && "Pencatatan dan penyesuaian perhitungan fisik stok"}
                        {view === "form" && "Buat Form Perhitungan Stok (Opname)"}
                        {view === "detail" && `Detail Perhitungan ${selectedOpname?.opnameNumber}`}
                    </p>
                </div>

                {view === "list" && (
                    <Button onClick={() => setView("form")}>
                        <Plus className="h-4 w-4 mr-2" /> Buat Opname
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
                    {opnames.map((o) => (
                        <div key={o.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4 text-zinc-500" />
                                        <span className="font-semibold text-sm">{o.opnameNumber}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(o.status)}`}>
                                        {o.status}
                                    </span>
                                </div>
                                <div className="text-sm space-y-1.5 text-zinc-600 mb-4 bg-zinc-50 p-2 rounded border">
                                    <span className="text-xs text-zinc-400 block mb-0.5">Lokasi Hitung:</span>
                                    <span className="font-medium text-zinc-800">{o.locationName}</span>
                                </div>
                                {o.note && (
                                    <p className="text-xs text-zinc-500 mb-2 italic">&quot;{o.note}&quot;</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 mb-3">{formatDate(o.createdAt)}</p>
                                <div className="flex justify-end pt-3 border-t border-zinc-100">
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedOpname(o); setView("detail"); }}>
                                        <Eye className="w-3 h-3 mr-2" /> Detail Perhitungan
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {opnames.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500 bg-white border border-dashed rounded-lg">
                            Tidak ada data Stock Opname
                        </div>
                    )}
                </div>
            )}

            {view === "form" && (
                <form onSubmit={handleCreateOpname} className="bg-white border rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Pilih Lokasi yang Dihitung *</label>
                            <select
                                required
                                value={locationId}
                                onChange={e => {
                                    setLocationId(e.target.value);
                                    // Reset items when location changes, because system qty depends on location!
                                    setOpnameItems([]);
                                }}
                                className="w-full border rounded-md p-2 text-sm"
                            >
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                            <p className="text-xs text-zinc-400 mt-1">Mengganti lokasi akan mereset barang di tabel.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Catatan Opname</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={2}
                                className="w-full border rounded-md p-2 text-sm"
                                placeholder="Misal: Opname Bulanan Desember..."
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-4 text-zinc-900 border-b pb-2">Barang yang Dihitung Fisik</h3>

                        <div className="relative mb-6 leading-none">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama produk untuk dimasukkan..." className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm" />
                            {searchQuery && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {filteredProducts.map(p => {
                                        const sysQty = getSystemQty(p.id, locationId);
                                        return (
                                            <div key={p.id} onClick={() => addProductToOpname(p)} className="p-3 hover:bg-zinc-50 cursor-pointer border-b flex justify-between items-center text-sm">
                                                <span className="font-medium text-zinc-900">{p.name}</span>
                                                <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded border">Stok Sistem: {sysQty}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-50 border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3 w-32 text-center text-zinc-400">Tercatat Sistem</th>
                                        <th className="px-4 py-3 w-40 text-center text-blue-600 font-semibold bg-blue-50/50">Fisik (Opname)</th>
                                        <th className="px-4 py-3 w-28 text-center text-amber-500">Selisih</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {opnameItems.map((item, idx) => {
                                        const selisih = item.qtyActual - item.qtySystem;
                                        return (
                                            <tr key={idx} className="border-b bg-white hover:bg-zinc-50">
                                                <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                                                <td className="px-4 py-3 text-center text-zinc-500 bg-zinc-50/30">
                                                    {item.qtySystem}
                                                </td>
                                                <td className="px-4 py-3 text-center bg-blue-50/10">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.qtyActual}
                                                        onChange={e => {
                                                            const newItems = [...opnameItems];
                                                            newItems[idx].qtyActual = parseInt(e.target.value) || 0;
                                                            setOpnameItems(newItems);
                                                        }}
                                                        className="w-24 border-2 border-blue-200 focus:border-blue-400 rounded p-1.5 text-center font-bold outline-none ring-0"
                                                    />
                                                </td>
                                                <td className={`px-4 py-3 text-center font-bold ${selisih > 0 ? "text-emerald-500" : selisih < 0 ? "text-red-500" : "text-zinc-300"}`}>
                                                    {selisih > 0 ? `+${selisih}` : selisih}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="ghost" size="icon" type="button" onClick={() => setOpnameItems(opnameItems.filter((_, i) => i !== idx))} className="h-8 w-8 text-zinc-400 hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {opnameItems.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400 bg-white">Belum ada barang dipilih</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button type="submit" size="lg" disabled={isSubmitting || opnameItems.length === 0}>
                                {isSubmitting ? "Menyimpan..." : "Simpan Form Hasil Opname"}
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {view === "detail" && selectedOpname && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-lg p-6 space-y-6 md:col-span-1 h-fit">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2 mb-4">Informasi Dokumen</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">No. Opname</span>
                                    <span className="font-semibold">{selectedOpname.opnameNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Status</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(selectedOpname.status)}`}>
                                        {selectedOpname.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Lokasi</span>
                                    <span className="font-medium text-right">{selectedOpname.locationName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Tanggal</span>
                                    <span className="text-right">{new Date(selectedOpname.createdAt).toLocaleString()}</span>
                                </div>
                                {selectedOpname.note && (
                                    <div className="bg-zinc-50 p-3 mt-4 rounded border text-zinc-600">
                                        &quot;{selectedOpname.note}&quot;
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tindakan Khusus</div>
                            <div className="flex flex-col gap-2">
                                {selectedOpname.status === "DRAFT" && (
                                    <>
                                        <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => handleUpdateStatus(selectedOpname.id, "COMPLETED")}>
                                            Terapkan Penyesuaian (Adjust Stok)
                                        </Button>
                                        <p className="text-xs text-center text-amber-600 mb-2">Tindakan ini akan memutasi stok database agar sama dengan qty fisik yang dimasukkan.</p>

                                        <Button variant="outline" className="w-full text-red-600 border-red-200 bg-red-50 hover:bg-red-100 mt-4" onClick={() => handleUpdateStatus(selectedOpname.id, "CANCELLED")}>
                                            Batalkan Opname
                                        </Button>
                                    </>
                                )}
                                {selectedOpname.status === "COMPLETED" && (
                                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 text-sm text-center">
                                        Opname telah disahkan. Stok di database telah disesuaikan (Adjusted).
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg overflow-hidden md:col-span-2 h-fit">
                        <div className="p-4 border-b bg-zinc-50">
                            <h3 className="font-semibold text-zinc-900">Hasil Penyesuaian Stok</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b">
                                <tr>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3 text-center">Tercatat Sistem</th>
                                    <th className="px-4 py-3 text-center bg-blue-50/30 text-blue-600">Jumlah Fisik</th>
                                    <th className="px-4 py-3 text-center bg-amber-50/30 text-amber-600">Selisih Mutasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {selectedOpname.items.map((item, idx) => {
                                    const selisih = item.qtyDelta !== undefined ? item.qtyDelta : (item.qtyActual - item.qtySystem);
                                    return (
                                        <tr key={idx} className="bg-white hover:bg-zinc-50">
                                            <td className="px-4 py-3 font-medium">{item.productName}</td>
                                            <td className="px-4 py-3 text-center text-zinc-500">{item.qtySystem}</td>
                                            <td className="px-4 py-3 text-center bg-blue-50/10 font-bold text-blue-700">{item.qtyActual}</td>
                                            <td className={`px-4 py-3 text-center font-bold bg-amber-50/10 ${selisih > 0 ? "text-emerald-500" : selisih < 0 ? "text-red-500" : "text-zinc-300"}`}>
                                                {selisih > 0 ? `+${selisih}` : selisih === 0 ? "-" : selisih}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

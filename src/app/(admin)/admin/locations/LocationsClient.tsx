"use client"

import { useState, useEffect } from "react"
import { locationsApi, Location } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, MapPin, CheckCircle2 } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

export default function LocationsClient() {
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingLocation, setEditingLocation] = useState<Location | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        address: "",
        isDefault: false
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const data = await locationsApi.getAll()
            setLocations(data ?? [])
        } catch (error) {
            toast.error("Error", {
                description: "Gagal memuat data",
            })
        } finally {
            setLoading(false)
        }
    }

    function openCreateModal() {
        setEditingLocation(null)
        setFormData({ name: "", address: "", isDefault: false })
        setShowModal(true)
    }

    function openEditModal(location: Location) {
        setEditingLocation(location)
        setFormData({
            name: location.name,
            address: location.address || "",
            isDefault: location.isDefault
        })
        setShowModal(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (editingLocation) {
                await locationsApi.update(editingLocation.id, formData)
                toast.success("Berhasil", {
                    description: "Lokasi berhasil diperbarui",
                })
            } else {
                await locationsApi.create(formData)
                toast.success("Berhasil", {
                    description: "Lokasi berhasil dibuat",
                })
            }
            setShowModal(false)
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menyimpan lokasi",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete(location: Location) {
        if (!confirm(`Hapus lokasi "${location.name}"?`)) return

        try {
            await locationsApi.delete(location.id)
            toast.success("Berhasil", {
                description: "Lokasi berhasil dihapus",
            })
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menghapus lokasi",
            })
        }
    }

    if (loading) {
      return <PageLoading />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Lokasi & Gudang</h1>
                    <p className="text-sm text-zinc-500">
                        Kelola cabang toko dan gudang penyimpanan Anda
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Lokasi
                </Button>
            </div>

            {/* Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                    <div
                        key={location.id}
                        className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md h-full relative"
                    >
                        {location.isDefault && (
                            <div className="absolute top-4 right-14" title="Lokasi Utama / Default">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            </div>
                        )}
                        <div className="flex items-start justify-between flex-1">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 border border-zinc-200 mt-1">
                                    <MapPin className="h-4 w-4 text-zinc-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-900">
                                        {location.name}
                                    </h3>
                                    {location.address && (
                                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                            {location.address}
                                        </p>
                                    )}
                                    <p className="text-xs text-zinc-400 mt-2 font-mono">ID: {location.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditModal(location)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(location)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    disabled={location.isDefault}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {locations.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white py-12">
                    <MapPin className="h-10 w-10 text-zinc-300" />
                    <p className="mt-2 text-sm text-zinc-500">Tidak ada lokasi</p>
                    <Button
                        variant="link"
                        onClick={openCreateModal}
                        className="mt-4 text-zinc-900 font-medium hover:text-zinc-700 hover:bg-zinc-100 px-4 rounded-md no-underline"
                    >
                        Tambah lokasi pertama
                    </Button>
                </div>
            )}

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingLocation ? "Edit Lokasi" : "Tambah Lokasi"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingLocation ? "Perbarui informasi lokasi / gudang" : "Tambahkan lokasi toko atau gudang baru"}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">
                                Nama Lokasi *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                                placeholder="Contoh: Gudang Pusat"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">
                                Alamat
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                                rows={3}
                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                                placeholder="Jl. Raya Utama No. 123..."
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <label htmlFor="isDefault" className="text-sm font-medium text-zinc-700 cursor-pointer">
                                Jadikan Lokasi Utama (Default)
                            </label>
                        </div>
                        <p className="text-xs text-zinc-500 pl-5">
                            Lokasi utama akan dipilih otomatis pada halaman POS dan default penerimaan stok.
                        </p>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? "Menyimpan..." : (editingLocation ? "Perbarui" : "Simpan")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

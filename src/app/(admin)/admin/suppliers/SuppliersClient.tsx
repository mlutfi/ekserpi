"use client"

import { useState, useEffect } from "react"
import { suppliersApi, Supplier } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Truck, Phone, UserRound } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

export default function SuppliersClient() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        contactName: "",
        phone: "",
        address: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const data = await suppliersApi.getAll()
            setSuppliers(data ?? [])
        } catch (error) {
            toast.error("Error", {
                description: "Gagal memuat data supplier",
            })
        } finally {
            setLoading(false)
        }
    }

    function openCreateModal() {
        setEditingSupplier(null)
        setFormData({ name: "", contactName: "", phone: "", address: "" })
        setShowModal(true)
    }

    function openEditModal(supplier: Supplier) {
        setEditingSupplier(supplier)
        setFormData({
            name: supplier.name,
            contactName: supplier.contactName || supplier.contactPerson || "",
            phone: supplier.phone || "",
            address: supplier.address || ""
        })
        setShowModal(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (editingSupplier) {
                await suppliersApi.update(editingSupplier.id, formData)
                toast.success("Berhasil", {
                    description: "Supplier berhasil diperbarui",
                })
            } else {
                await suppliersApi.create(formData)
                toast.success("Berhasil", {
                    description: "Supplier berhasil ditambahkan",
                })
            }
            setShowModal(false)
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menyimpan supplier",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete(supplier: Supplier) {
        if (!confirm(`Hapus supplier "${supplier.name}"?`)) return

        try {
            await suppliersApi.delete(supplier.id)
            toast.success("Berhasil", {
                description: "Supplier berhasil dihapus",
            })
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menghapus supplier",
            })
        }
    }

    if (loading) {
      return <PageLoading />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Supplier</h1>
                    <p className="text-sm text-zinc-500">
                        Kelola data pemasok barang atau vendor Anda
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Supplier
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((supplier) => (
                    <div
                        key={supplier.id}
                        className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md h-full"
                    >
                        <div className="flex items-start justify-between flex-1">
                            <div className="flex items-start gap-3 w-full">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 border border-zinc-200 mt-1">
                                    <Truck className="h-4 w-4 text-zinc-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-zinc-900 truncate">
                                        {supplier.name}
                                    </h3>

                                    <div className="mt-2 space-y-1.5">
                                        {(supplier.contactName || supplier.contactPerson) && (
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                                <UserRound className="h-3 w-3" />
                                                <span className="truncate">{supplier.contactName || supplier.contactPerson}</span>
                                            </div>
                                        )}
                                        {supplier.phone && (
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                                <Phone className="h-3 w-3" />
                                                <span>{supplier.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {supplier.address && (
                                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                                            {supplier.address}
                                        </p>
                                    )}

                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 shrink-0 ml-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditModal(supplier)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {suppliers.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white py-12">
                    <Truck className="h-10 w-10 text-zinc-300" />
                    <p className="mt-2 text-sm text-zinc-500">Tidak ada supplier</p>
                    <Button
                        variant="link"
                        onClick={openCreateModal}
                        className="mt-4 text-zinc-900 font-medium hover:text-zinc-700 hover:bg-zinc-100 px-4 rounded-md no-underline"
                    >
                        Tambah supplier pertama
                    </Button>
                </div>
            )}

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSupplier ? "Edit Supplier" : "Tambah Supplier"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSupplier ? "Perbarui informasi supplier" : "Tambahkan vendor atau supplier baru"}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">
                                Nama Perusahaan / Supplier *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                                placeholder="Contoh: PT. Sumber Makmur"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Nama Kontak (PIC)
                                </label>
                                <input
                                    type="text"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                                    placeholder="Contoh: Budi"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Nomor HP / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                                    placeholder="0812..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">
                                Alamat Lengkap
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                                placeholder="Jl. Pahlawan No. 45..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting} className="flex-1">
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? "Menyimpan..." : (editingSupplier ? "Perbarui" : "Simpan")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

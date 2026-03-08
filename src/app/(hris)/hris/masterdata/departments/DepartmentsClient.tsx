"use client"

import { useEffect, useState } from "react"
import { departmentsApi, Department } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    Building2,
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    AlertTriangle
} from "lucide-react"

export default function DepartmentsClient() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
    const [saving, setSaving] = useState(false)
    // const { toast } = useToast()

    interface FormDataType {
        name: string
        description: string
    }

    const [formData, setFormData] = useState<FormDataType>({
        name: "",
        description: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)
            const data = await departmentsApi.getAll()
            setDepartments(data ?? [])
        } catch (error) {
            toast.error("Error", {
                description: "Gagal memuat data departemen",
            })
        } finally {
            setLoading(false)
        }
    }

    function openCreateDialog() {
        setEditingDepartment(null)
        setFormData({ name: "", description: "" })
        setIsDialogOpen(true)
    }

    function openEditDialog(department: Department) {
        setEditingDepartment(department)
        setFormData({
            name: department.name,
            description: department.description || ""
        })
        setIsDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            if (editingDepartment) {
                await departmentsApi.update(editingDepartment.id, formData)
                toast.success("Berhasil", {
                    description: "Departemen berhasil diperbarui",
                })
            } else {
                await departmentsApi.create(formData)
                toast.success("Berhasil", {
                    description: "Departemen berhasil dibuat",
                })
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menyimpan departemen",
            })
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(department: Department) {
        if (!confirm(`Hapus departemen "${department.name}"?`)) return

        try {
            await departmentsApi.delete(department.id)
            toast.success("Berhasil", {
                description: "Departemen berhasil dihapus",
            })
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menghapus departemen",
            })
        }
    }

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Data Departemen</h1>
                    <p className="text-zinc-500">Kelola departemen perusahaan</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Departemen
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingDepartment ? "Edit Departemen" : "Tambah Departemen"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama Departemen</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: Human Resources"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Contoh: Mengelola SDM perusahaan"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" className="border-zinc-200" onClick={() => setIsDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingDepartment ? "Simpan" : "Buat"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-900">
                        <Building2 className="h-5 w-5 text-zinc-500" />
                        Daftar Departemen
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                placeholder="Cari departemen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-zinc-200 focus-visible:ring-zinc-900"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
                        </div>
                    ) : filteredDepartments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                            <AlertTriangle className="h-12 w-12 mb-2 text-zinc-400" />
                            <p>Tidak ada departemen ditemukan</p>
                        </div>
                    ) : (
                        <div className="border border-zinc-200 rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                                        <TableHead className="font-semibold text-zinc-900">Nama</TableHead>
                                        <TableHead className="font-semibold text-zinc-900">Deskripsi</TableHead>
                                        <TableHead className="text-right font-semibold text-zinc-900">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDepartments.map((department) => (
                                        <TableRow key={department.id}>
                                            <TableCell className="font-medium text-zinc-900">{department.name}</TableCell>
                                            <TableCell className="text-zinc-600">{department.description || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-zinc-100 text-zinc-500"
                                                        onClick={() => openEditDialog(department)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-red-50 hover:text-red-600 text-zinc-500"
                                                        onClick={() => handleDelete(department)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { positionsApi, Position } from "@/lib/hris"
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
    Briefcase,
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    AlertTriangle
} from "lucide-react"

export default function PositionsClient() {
    const [positions, setPositions] = useState<Position[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPosition, setEditingPosition] = useState<Position | null>(null)
    const [saving, setSaving] = useState(false)
    // const { toast } = useToast()

    interface FormDataType {
        name: string
        level: number
    }

    const [formData, setFormData] = useState<FormDataType>({
        name: "",
        level: 1
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)
            const data = await positionsApi.getAll()
            setPositions(data ?? [])
        } catch (error) {
            toast.error("Error", {
                description: "Gagal memuat data posisi",
            })
        } finally {
            setLoading(false)
        }
    }

    function openCreateDialog() {
        setEditingPosition(null)
        setFormData({ name: "", level: 1 })
        setIsDialogOpen(true)
    }

    function openEditDialog(position: Position) {
        setEditingPosition(position)
        setFormData({
            name: position.name,
            level: position.level
        })
        setIsDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            if (editingPosition) {
                await positionsApi.update(editingPosition.id, formData)
                toast.success("Berhasil", {
                    description: "Posisi berhasil diperbarui",
                })
            } else {
                await positionsApi.create(formData)
                toast.success("Berhasil", {
                    description: "Posisi berhasil dibuat",
                })
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menyimpan posisi",
            })
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(position: Position) {
        if (!confirm(`Hapus posisi "${position.name}"?`)) return

        try {
            await positionsApi.delete(position.id)
            toast.success("Berhasil", {
                description: "Posisi berhasil dihapus",
            })
            fetchData()
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.message || "Gagal menghapus posisi",
            })
        }
    }

    const filteredPositions = positions.filter(pos =>
        pos.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getLevelLabel = (level: number) => {
        const labels: { [key: number]: string } = {
            1: "Staff",
            2: "Junior",
            3: "Senior",
            4: "Lead",
            5: "Manager",
            6: "Director",
            7: "VP",
            8: "C-Level"
        }
        return labels[level] || `Level ${level}`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Data Posisi</h1>
                    <p className="text-zinc-500">Kelola posisi/jabatan perusahaan</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Posisi
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingPosition ? "Edit Posisi" : "Tambah Posisi"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama Posisi</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: Software Engineer"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="level">Level</Label>
                                    <Input
                                        id="level"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                    <p className="text-xs text-gray-500">
                                        Level 1 = Staff, 5 = Manager, 8 = C-Level
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" className="border-zinc-200" onClick={() => setIsDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingPosition ? "Simpan" : "Buat"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-900">
                        <Briefcase className="h-5 w-5 text-zinc-500" />
                        Daftar Posisi
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                placeholder="Cari posisi..."
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
                    ) : filteredPositions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                            <AlertTriangle className="h-12 w-12 mb-2 text-zinc-400" />
                            <p>Tidak ada posisi ditemukan</p>
                        </div>
                    ) : (
                        <div className="border border-zinc-200 rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                                        <TableHead className="font-semibold text-zinc-900">Nama</TableHead>
                                        <TableHead className="font-semibold text-zinc-900">Level</TableHead>
                                        <TableHead className="text-right font-semibold text-zinc-900">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPositions.map((position) => (
                                        <TableRow key={position.id}>
                                            <TableCell className="font-medium text-zinc-900">{position.name}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                                                    {getLevelLabel(position.level)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-zinc-100 text-zinc-500"
                                                        onClick={() => openEditDialog(position)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-red-50 hover:text-red-600 text-zinc-500"
                                                        onClick={() => handleDelete(position)}
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

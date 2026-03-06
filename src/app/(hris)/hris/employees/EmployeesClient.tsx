"use client"

import { useEffect, useState, ChangeEvent } from "react"
import { employeesApi, departmentsApi, positionsApi, Employee, Department, Position } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    MoreVertical,
    Loader2,
    AlertTriangle,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Building2,
    Calendar
} from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function EmployeesClient() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [positions, setPositions] = useState<Position[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [saving, setSaving] = useState(false)
    // const { toast } = useToast()

    // Form state type
    interface FormDataType {
        nip: string
        name: string
        email: string
        phone: string
        address: string
        departmentId: string
        positionId: string
        joinDate: string
        status: "active" | "inactive"
        baseSalary: number
    }

    // Form state
    const [formData, setFormData] = useState<FormDataType>({
        nip: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        departmentId: "",
        positionId: "",
        joinDate: "",
        status: "active",
        baseSalary: 0,
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            setError("")

            const [employeesData, departmentsData, positionsData] = await Promise.all([
                employeesApi.getAll(),
                departmentsApi.getAll(),
                positionsApi.getAll(),
            ])

            setEmployees(employeesData)
            setDepartments(departmentsData)
            setPositions(positionsData)
        } catch (err: any) {
            console.error("Failed to load data:", err)
            setError("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleOpenDialog = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee)
            setFormData({
                nip: employee.nip,
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                address: employee.address,
                departmentId: employee.departmentId,
                positionId: employee.positionId,
                joinDate: employee.joinDate.split("T")[0],
                status: employee.status,
                baseSalary: employee.baseSalary || 0,
            })
        } else {
            setEditingEmployee(null)
            setFormData({
                nip: "",
                name: "",
                email: "",
                phone: "",
                address: "",
                departmentId: "",
                positionId: "",
                joinDate: "",
                status: "active",
                baseSalary: 0,
            })
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            if (editingEmployee) {
                await employeesApi.update(editingEmployee.id, formData)
                toast.success("Berhasil", {
                    description: "Datapegawai berhasil diperbarui",
                })
            } else {
                await employeesApi.create(formData)
                toast.success("Berhasil", {
                    description: "Pegawai baru berhasil ditambahkan",
                })
            }

            setIsDialogOpen(false)
            loadData()
        } catch (err: any) {
            console.error("Failed to save:", err)
            toast.error("Gagal", {
                description: err.response?.data?.message || "Gagal menyimpan data",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return

        try {
            await employeesApi.delete(id)
            toast.success("Berhasil", {
                description: "Datapegawai berhasil dihapus",
            })
            loadData()
        } catch (err: any) {
            console.error("Failed to delete:", err)
            toast.error("Gagal", {
                description: "Gagal menghapus data",
            })
        }
    }

    const initials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-slate-500">Memuat data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Pegawai</h1>
                    <p className="text-slate-500">Kelola data karyawan perusahaan</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Pegawai
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingEmployee ? "Edit Pegawai" : "Tambah Pegawai Baru"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nip">NIP</Label>
                                <Input
                                    id="nip"
                                    value={formData.nip}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nip: e.target.value })}
                                    placeholder="Contoh: EMP001"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Budi Santoso"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Contoh: budi@email.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">No. HP</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Contoh: 081234567890"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Alamat lengkap"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Departemen</Label>
                                    <Select
                                        value={formData.departmentId}
                                        onValueChange={(value: string) => setFormData({ ...formData, departmentId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih departemen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Jabatan</Label>
                                    <Select
                                        value={formData.positionId}
                                        onValueChange={(value: string) => setFormData({ ...formData, positionId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jabatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positions.map((pos) => (
                                                <SelectItem key={pos.id} value={pos.id}>
                                                    {pos.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="joinDate">Tanggal Masuk</Label>
                                    <Input
                                        id="joinDate"
                                        type="date"
                                        value={formData.joinDate}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, joinDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Aktif</SelectItem>
                                            <SelectItem value="inactive">Nonaktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="baseSalary">Gaji Pokok</Label>
                                <Input
                                    id="baseSalary"
                                    type="number"
                                    value={formData.baseSalary}
                                    onChange={(e) => setFormData({ ...formData, baseSalary: parseInt(e.target.value) || 0 })}
                                    placeholder="Contoh: 5000000"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Cari nama, NIP, atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Departemen</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Tanggal Masuk</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                                                        {initials(employee.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-slate-900">{employee.name}</p>
                                                    <p className="text-xs text-slate-500">{employee.nip}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{employee.department?.name || "-"}</TableCell>
                                        <TableCell>{employee.position?.name || "-"}</TableCell>
                                        <TableCell>{employee.joinDate ? new Date(employee.joinDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                employee.status === "active"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-700"
                                            )}>
                                                {employee.status === "active" ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(employee)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(employee.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-slate-300" />
                                            <p className="text-slate-500">Tidak ada data</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

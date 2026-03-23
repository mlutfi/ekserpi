"use client"

import { useEffect, useState, ChangeEvent, useRef } from "react"
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
    Eye,
    Loader2,
    AlertTriangle,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Building2,
    Calendar,
    Upload,
    X,
    User,
    CreditCard,
    Image as ImageIcon
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { PageLoading } from "@/components/ui/page-loading"

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4001'

function getImageUrl(path?: string) {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `${API_BASE}${path}`
}

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

    // View dialog state
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [viewEmployee, setViewEmployee] = useState<Employee | null>(null)

    // Photo upload state
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [uploadingKtp, setUploadingKtp] = useState(false)
    const photoInputRef = useRef<HTMLInputElement>(null)
    const ktpInputRef = useRef<HTMLInputElement>(null)

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
        employeeType: "FREELANCE_BURUH" | "PKWT" | "KARYAWAN_TETAP"
        status: "ACTIVE" | "INACTIVE" | "RESIGNED"
        basicSalary: number
        allowance: number
        dailyRate: number
        photo: string
        ktpPhoto: string
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
        employeeType: "KARYAWAN_TETAP",
        status: "ACTIVE",
        basicSalary: 0,
        allowance: 0,
        dailyRate: 0,
        photo: "",
        ktpPhoto: "",
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
                departmentId: employee.departmentId || "",
                positionId: employee.positionId || "",
                joinDate: (employee.joinDate || "").split("T")[0],
                employeeType: normalizeEmployeeType(employee.employeeType),
                status: normalizeEmployeeStatus(employee.status),
                basicSalary: employee.basicSalary || employee.baseSalary || 0,
                allowance: employee.allowance || 0,
                dailyRate: employee.dailyRate || 0,
                photo: employee.photo || "",
                ktpPhoto: employee.ktpPhoto || "",
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
                employeeType: "KARYAWAN_TETAP",
                status: "ACTIVE",
                basicSalary: 0,
                allowance: 0,
                dailyRate: 0,
                photo: "",
                ktpPhoto: "",
            })
        }
        setIsDialogOpen(true)
    }

    const handlePhotoUpload = async (file: File, type: 'photo' | 'ktp') => {
        try {
            if (type === 'photo') setUploadingPhoto(true)
            else setUploadingKtp(true)

            const imageUrl = await employeesApi.uploadPhoto(file)

            if (type === 'photo') {
                setFormData(prev => ({ ...prev, photo: imageUrl }))
            } else {
                setFormData(prev => ({ ...prev, ktpPhoto: imageUrl }))
            }

            toast.success("Berhasil", {
                description: `${type === 'photo' ? 'Pas foto' : 'Foto KTP'} berhasil diupload`,
            })
        } catch (err: any) {
            console.error("Failed to upload:", err)
            toast.error("Gagal", {
                description: "Gagal mengupload foto",
            })
        } finally {
            if (type === 'photo') setUploadingPhoto(false)
            else setUploadingKtp(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const payload = {
                ...formData,
                departmentId: formData.departmentId || undefined,
                positionId: formData.positionId || undefined,
                basicSalary: formData.employeeType === "FREELANCE_BURUH" ? 0 : formData.basicSalary,
                allowance: formData.employeeType === "FREELANCE_BURUH" ? 0 : formData.allowance,
                dailyRate: formData.employeeType === "FREELANCE_BURUH" ? formData.dailyRate : 0,
                salary: formData.employeeType === "FREELANCE_BURUH"
                    ? formData.dailyRate
                    : formData.basicSalary + formData.allowance,
            }

            if (editingEmployee) {
                await employeesApi.update(editingEmployee.id, payload)
                toast.success("Berhasil", {
                    description: "Data pegawai berhasil diperbarui",
                })
            } else {
                await employeesApi.create(payload)
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
                description: "Data pegawai berhasil dihapus",
            })
            loadData()
        } catch (err: any) {
            console.error("Failed to delete:", err)
            toast.error("Gagal", {
                description: "Gagal menghapus data",
            })
        }
    }

    const handleViewEmployee = (employee: Employee) => {
        setViewEmployee(employee)
        setIsViewDialogOpen(true)
    }

    const initials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    const normalizeEmployeeType = (value?: string): "FREELANCE_BURUH" | "PKWT" | "KARYAWAN_TETAP" => {
        switch ((value || "").toUpperCase()) {
            case "FREELANCE_BURUH":
            case "HARIAN_LEPAS":
                return "FREELANCE_BURUH"
            case "PKWT":
                return "PKWT"
            default:
                return "KARYAWAN_TETAP"
        }
    }

    const normalizeEmployeeStatus = (value?: string): "ACTIVE" | "INACTIVE" | "RESIGNED" => {
        switch ((value || "").toUpperCase()) {
            case "INACTIVE":
                return "INACTIVE"
            case "RESIGNED":
                return "RESIGNED"
            default:
                return "ACTIVE"
        }
    }

    const employeeTypeLabel = (value?: string) => {
        switch (normalizeEmployeeType(value)) {
            case "FREELANCE_BURUH":
                return "Freelance / Buruh"
            case "PKWT":
                return "PKWT"
            default:
                return "Karyawan Tetap"
        }
    }

    const statusLabel = (value?: string) => {
        switch (normalizeEmployeeStatus(value)) {
            case "ACTIVE":
                return "Aktif"
            case "RESIGNED":
                return "Resign"
            default:
                return "Nonaktif"
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Data Pegawai</h1>
                    <p className="text-zinc-500">Kelola data karyawan perusahaan</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Pegawai
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
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
                                    <Label>Jenis Karyawan</Label>
                                    <Select
                                        value={formData.employeeType}
                                        onValueChange={(value: "FREELANCE_BURUH" | "PKWT" | "KARYAWAN_TETAP") => setFormData({ ...formData, employeeType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FREELANCE_BURUH">Freelance / Buruh</SelectItem>
                                            <SelectItem value="PKWT">PKWT</SelectItem>
                                            <SelectItem value="KARYAWAN_TETAP">Karyawan Tetap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: "ACTIVE" | "INACTIVE" | "RESIGNED") => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Aktif</SelectItem>
                                            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                                            <SelectItem value="RESIGNED">Resign</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.employeeType === "FREELANCE_BURUH" ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="dailyRate">Upah Harian</Label>
                                        <Input
                                            id="dailyRate"
                                            type="number"
                                            value={formData.dailyRate}
                                            onChange={(e) => setFormData({ ...formData, dailyRate: parseInt(e.target.value) || 0 })}
                                            placeholder="Contoh: 150000"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="allowance">Tunjangan</Label>
                                        <Input
                                            id="allowance"
                                            type="number"
                                            value={formData.allowance}
                                            onChange={(e) => setFormData({ ...formData, allowance: parseInt(e.target.value) || 0 })}
                                            placeholder="Contoh: 1000000"
                                        />
                                    </div>
                                )}
                            </div>
                            {formData.employeeType !== "FREELANCE_BURUH" && (
                                <div className="grid gap-2">
                                    <Label htmlFor="basicSalary">Gaji Pokok</Label>
                                    <Input
                                        id="basicSalary"
                                        type="number"
                                        value={formData.basicSalary}
                                        onChange={(e) => setFormData({ ...formData, basicSalary: parseInt(e.target.value) || 0 })}
                                        placeholder="Contoh: 5000000"
                                    />
                                </div>
                            )}

                            {/* Photo Upload Section */}
                            <div className="border-t border-zinc-200 pt-4 mt-2">
                                <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Upload Foto
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Pas Foto */}
                                    <div className="grid gap-2">
                                        <Label>Pas Foto</Label>
                                        <input
                                            ref={photoInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handlePhotoUpload(file, 'photo')
                                            }}
                                        />
                                        {formData.photo ? (
                                            <div className="relative group">
                                                <div className="w-full h-40 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50">
                                                    <img
                                                        src={getImageUrl(formData.photo)}
                                                        alt="Pas Foto"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => photoInputRef.current?.click()}
                                                        disabled={uploadingPhoto}
                                                    >
                                                        {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                        <span className="ml-1">Ganti</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setFormData(prev => ({ ...prev, photo: "" }))}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => photoInputRef.current?.click()}
                                                disabled={uploadingPhoto}
                                                className="w-full h-40 rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2 text-zinc-500"
                                            >
                                                {uploadingPhoto ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                                                ) : (
                                                    <>
                                                        <User className="h-8 w-8 text-zinc-400" />
                                                        <span className="text-xs">Klik untuk upload pas foto</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Foto KTP */}
                                    <div className="grid gap-2">
                                        <Label>Foto KTP</Label>
                                        <input
                                            ref={ktpInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handlePhotoUpload(file, 'ktp')
                                            }}
                                        />
                                        {formData.ktpPhoto ? (
                                            <div className="relative group">
                                                <div className="w-full h-40 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50">
                                                    <img
                                                        src={getImageUrl(formData.ktpPhoto)}
                                                        alt="Foto KTP"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => ktpInputRef.current?.click()}
                                                        disabled={uploadingKtp}
                                                    >
                                                        {uploadingKtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                        <span className="ml-1">Ganti</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setFormData(prev => ({ ...prev, ktpPhoto: "" }))}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => ktpInputRef.current?.click()}
                                                disabled={uploadingKtp}
                                                className="w-full h-40 rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2 text-zinc-500"
                                            >
                                                {uploadingKtp ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-8 w-8 text-zinc-400" />
                                                        <span className="text-xs">Klik untuk upload foto KTP</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" className="border-zinc-200" onClick={() => setIsDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                    placeholder="Cari nama, NIP, atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-zinc-200 focus-visible:ring-zinc-900"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Table */}
            <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Departemen</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Tanggal Masuk</TableHead>
                                <TableHead>Jenis Karyawan</TableHead>
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
                                                <Avatar className="h-10 w-10 border border-zinc-200">
                                                    {employee.photo ? (
                                                        <AvatarImage src={getImageUrl(employee.photo)} alt={employee.name} />
                                                    ) : null}
                                                    <AvatarFallback className="bg-zinc-100 text-zinc-900 font-medium">
                                                        {initials(employee.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-zinc-900">{employee.name}</p>
                                                    <p className="text-xs text-zinc-500">{employee.nip}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-zinc-600">{employee.department?.name || "-"}</TableCell>
                                        <TableCell className="text-zinc-600">{employee.position?.name || "-"}</TableCell>
                                        <TableCell className="text-zinc-600">{formatDate(employee.joinDate)}</TableCell>
                                        <TableCell className="text-zinc-600">{employeeTypeLabel(employee.employeeType)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "rounded-md font-medium",
                                                normalizeEmployeeStatus(employee.status) === "ACTIVE"
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                    : "bg-zinc-50 border-zinc-200 text-zinc-700"
                                            )}>
                                                {statusLabel(employee.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-blue-50 hover:text-blue-600 text-zinc-500"
                                                    onClick={() => handleViewEmployee(employee)}
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-zinc-100 text-zinc-500"
                                                    onClick={() => handleOpenDialog(employee)}
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-red-50 hover:text-red-600 text-zinc-500"
                                                    onClick={() => handleDelete(employee.id)}
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-zinc-300" />
                                            <p className="text-zinc-500">Tidak ada data</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Employee Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mb-4 pb-3 border-b border-zinc-200">
                        <DialogTitle className="text-lg">Detail Pegawai</DialogTitle>
                    </DialogHeader>
                    {viewEmployee && (
                        <div className="space-y-6">
                            {/* Header with Avatar */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20 border-2 border-zinc-200">
                                    {viewEmployee.photo ? (
                                        <AvatarImage src={getImageUrl(viewEmployee.photo)} alt={viewEmployee.name} />
                                    ) : null}
                                    <AvatarFallback className="bg-zinc-100 text-zinc-900 font-bold text-xl">
                                        {initials(viewEmployee.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900">{viewEmployee.name}</h2>
                                    <p className="text-sm text-zinc-500">{viewEmployee.nip}</p>
                                    <Badge variant="outline" className={cn(
                                        "mt-1 rounded-md font-medium",
                                        normalizeEmployeeStatus(viewEmployee.status) === "ACTIVE"
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-zinc-50 border-zinc-200 text-zinc-700"
                                    )}>
                                        {statusLabel(viewEmployee.status)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <Mail className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Email</p>
                                        <p className="text-sm font-medium text-zinc-900">{viewEmployee.email || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <Phone className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">No. HP</p>
                                        <p className="text-sm font-medium text-zinc-900">{viewEmployee.phone || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Alamat</p>
                                        <p className="text-sm font-medium text-zinc-900">{viewEmployee.address || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <Building2 className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Departemen</p>
                                        <p className="text-sm font-medium text-zinc-900">{viewEmployee.department?.name || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <Briefcase className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Jabatan</p>
                                        <p className="text-sm font-medium text-zinc-900">{viewEmployee.position?.name || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <Calendar className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Tanggal Masuk</p>
                                        <p className="text-sm font-medium text-zinc-900">
                                            {formatDate(viewEmployee.joinDate)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <Briefcase className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Jenis Karyawan</p>
                                        <p className="text-sm font-medium text-zinc-900">{employeeTypeLabel(viewEmployee.employeeType)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                                    <CreditCard className="h-4 w-4 text-zinc-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-zinc-500">
                                            {normalizeEmployeeType(viewEmployee.employeeType) === "FREELANCE_BURUH" ? "Upah Harian" : "Gaji Pokok"}
                                        </p>
                                        <p className="text-sm font-medium text-zinc-900">
                                            {normalizeEmployeeType(viewEmployee.employeeType) === "FREELANCE_BURUH"
                                                ? formatCurrency(viewEmployee.dailyRate || 0)
                                                : formatCurrency(viewEmployee.basicSalary || viewEmployee.baseSalary || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Photos Section */}
                            {(viewEmployee.photo || viewEmployee.ktpPhoto) && (
                                <div className="border-t border-zinc-200 pt-4">
                                    <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Foto Dokumen
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {viewEmployee.photo && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-2">Pas Foto</p>
                                                <div className="rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50">
                                                    <img
                                                        src={getImageUrl(viewEmployee.photo)}
                                                        alt="Pas Foto"
                                                        className="w-full h-48 object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {viewEmployee.ktpPhoto && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-2">Foto KTP</p>
                                                <div className="rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50">
                                                    <img
                                                        src={getImageUrl(viewEmployee.ktpPhoto)}
                                                        alt="Foto KTP"
                                                        className="w-full h-48 object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Tutup
                        </Button>
                        <Button
                            className="bg-zinc-900 hover:bg-zinc-800 text-white"
                            onClick={() => {
                                if (viewEmployee) {
                                    setIsViewDialogOpen(false)
                                    handleOpenDialog(viewEmployee)
                                }
                            }}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Pegawai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

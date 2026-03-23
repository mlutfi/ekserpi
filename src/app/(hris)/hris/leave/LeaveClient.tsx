"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store"
import { leaveApi, employeesApi, LeaveRequest } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    CalendarDays,
    Plus,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    AlertTriangle,
    User,
    Calendar,
    Plane,
    Eye
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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { PageLoading } from "@/components/ui/page-loading"

export default function LeaveClient() {
    const user = useAuthStore((state) => state.user)
    // const { toast } = useToast()

    const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([])
    const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
    const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([])
    const [employeeId, setEmployeeId] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [viewLeave, setViewLeave] = useState<LeaveRequest | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        leaveType: "annual" as "annual" | "sick" | "personal",
        startDate: "",
        endDate: "",
        reason: "",
    })

    const [employeeNotFound, setEmployeeNotFound] = useState(false)

    useEffect(() => {
        loadLeaves()
    }, [])

    const loadLeaves = async () => {
        try {
            setLoading(true)
            setEmployeeNotFound(false)

            if (user?.role === "HR_ADMIN" || user?.role === "MANAGER" || user?.role === "OWNER") {
                const pendingData = await leaveApi.getPending()
                setPendingLeaves(pendingData)
            } else if (user) {
                // For EMPLOYEE: use /employees/me (reads userId from JWT, no URL param needed)
                try {
                    const profile = await employeesApi.getMe()
                    if (profile?.id) {
                        setEmployeeId(profile.id)
                        const data = await leaveApi.getMyRequests(profile.id)
                        setMyLeaves(data)
                    }
                } catch (profileErr: any) {
                    const status = profileErr?.response?.status
                    if (status === 404) {
                        // Employee profile not linked yet â€” show friendly message
                        setEmployeeNotFound(true)
                    } else {
                        throw profileErr
                    }
                }
            }
        } catch (err: any) {
            console.error("Failed to load leaves:", err)
            toast.error("Gagal", {
                description: "Gagal memuat data cuti",
            })
        } finally {
            setLoading(false)
        }
    }


    const handleSubmit = async () => {
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            toast.error("Error", {
                description: "Mohon lengkapi semua field",
            })
            return
        }

        try {
            setSaving(true)
            await leaveApi.request({ ...formData, employeeId })

            toast.success("Berhasil", {
                description: "Pengajuan cuti berhasil dikirim",
            })

            setIsDialogOpen(false)
            setFormData({
                leaveType: "annual",
                startDate: "",
                endDate: "",
                reason: "",
            })
            loadLeaves()
        } catch (err: any) {
            console.error("Failed to submit leave:", err)
            toast.error("Gagal", {
                description: err.response?.data?.message || "Gagal mengajukan cuti",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleApprove = async (id: string) => {
        try {
            await leaveApi.approve(id)
            toast.success("Berhasil", {
                description: "Cuti disetujui",
            })
            loadLeaves()
        } catch (err: any) {
            toast.error("Gagal", {
                description: "Gagal menyetujui cuti",
            })
        }
    }

    const handleReject = async (id: string) => {
        const reason = prompt("Masukkan alasan penolakan:")
        if (!reason) return

        try {
            await leaveApi.reject(id, reason)
            toast.success("Berhasil", {
                description: "Cuti ditolak",
            })
            loadLeaves()
        } catch (err: any) {
            toast.error("Gagal", {
                description: "Gagal menolak cuti",
            })
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-medium">Menunggu</Badge>
            case "approved":
                return <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 font-medium">Disetujui</Badge>
            case "rejected":
                return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 font-medium">Ditolak</Badge>
            default:
                return <Badge variant="outline" className="border-zinc-200 text-zinc-600 bg-zinc-50">{status}</Badge>
        }
    }

    const getLeaveTypeBadge = (type: string) => {
        switch (type) {
            case "annual":
                return <Badge variant="outline" className="border-zinc-200 text-zinc-700 bg-white font-medium">Cuti Tahunan</Badge>
            case "sick":
                return <Badge variant="outline" className="border-zinc-200 text-zinc-700 bg-white font-medium">Sakit</Badge>
            case "personal":
                return <Badge variant="outline" className="border-zinc-200 text-zinc-700 bg-white font-medium">Izin Pribadi</Badge>
            default:
                return <Badge variant="outline" className="border-zinc-200 text-zinc-700 bg-white font-medium">{type}</Badge>
        }
    }

    const calculateDays = (start: string, end: string) => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays
    }

    if (loading) {
        return <PageLoading />
    }

    // Employee View - Request and view own leaves
    if (user?.role === "EMPLOYEE") {
        return (
            <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Cuti & Izin</h1>
                        <p className="text-sm text-zinc-500 mt-1">Ajukan dan lihat status cuti Anda</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={employeeNotFound} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Ajukan Cuti
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
                                <DialogTitle>Ajukan Cuti / Izin</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label className="text-zinc-900 font-medium">Jenis Cuti</Label>
                                    <Select
                                        value={formData.leaveType}
                                        onValueChange={(value: "annual" | "sick" | "personal") => setFormData({ ...formData, leaveType: value })}
                                    >
                                        <SelectTrigger className="border-zinc-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="annual">Cuti Tahunan</SelectItem>
                                            <SelectItem value="sick">Sakit</SelectItem>
                                            <SelectItem value="personal">Izin Pribadi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-zinc-900 font-medium">Tanggal Mulai</Label>
                                        <Input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="border-zinc-200"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-zinc-900 font-medium">Tanggal Selesai</Label>
                                        <Input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="border-zinc-200"
                                        />
                                    </div>
                                </div>

                                {formData.startDate && formData.endDate && (
                                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                                        <p className="text-sm text-zinc-600">
                                            Total hari: <strong className="text-zinc-900">{calculateDays(formData.startDate, formData.endDate)} hari</strong>
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label className="text-zinc-900 font-medium">Alasan</Label>
                                    <Textarea
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Alasan pengajuan cuti..."
                                        rows={3}
                                        className="border-zinc-200 resize-none"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" className="border-zinc-200 text-zinc-700" onClick={() => setIsDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button className="bg-zinc-900 hover:bg-zinc-800 text-white" onClick={handleSubmit} disabled={saving}>
                                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Ajukan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Employee profile not found banner */}
                {employeeNotFound && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-red-900">Profil Karyawan Belum Terdaftar</p>
                            <p className="text-sm text-red-700 mt-1">
                                Akun Anda belum terhubung dengan data karyawan. Silakan hubungi HR Admin untuk mendaftarkan profil karyawan Anda.
                            </p>
                        </div>
                    </div>
                )}

                {/* My Leaves List */}
                <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                    <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                        <CardTitle className="text-base font-semibold text-zinc-900">Riwayat Cuti</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                    <TableHead className="font-semibold text-zinc-900">Jenis</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Tanggal</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Hari</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Alasan</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                                    <TableHead className="font-semibold text-zinc-900 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myLeaves.length > 0 ? (
                                    myLeaves.map((leave) => (
                                        <TableRow key={leave.id}>
                                            <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p className="font-medium text-zinc-900">{formatDate(leave.startDate)}</p>
                                                    <p className="text-zinc-500 text-xs mt-0.5">s.d {formatDate(leave.endDate)}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-zinc-900">{leave.days} hari</TableCell>
                                            <TableCell className="max-w-xs truncate text-zinc-600">{leave.reason}</TableCell>
                                            <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setViewLeave(leave)}>
                                                    <Eye className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center mb-1">
                                                    <CalendarDays className="h-5 w-5 text-zinc-400" />
                                                </div>
                                                <p className="font-medium text-zinc-900">Belum ada pengajuan</p>
                                                <p className="text-xs text-zinc-500">Anda belum pernah mengajukan cuti</p>
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

    // Manager / HR View - Approve leaves
    return (
        <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                        {user?.role === "MANAGER" ? "Approval Cuti & Izin" : "Kelola Cuti & Izin"}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {user?.role === "MANAGER" ? "Review request cuti dari tim" : "Kelola seluruh request cuti"}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Menunggu Approval</p>
                                <p className="text-2xl font-bold text-zinc-900">{pendingLeaves.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Disetujui</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {teamLeaves.filter(l => l.status === "approved").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Ditolak</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {teamLeaves.filter(l => l.status === "rejected").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Leaves */}
            {pendingLeaves.length > 0 && (
                <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                    <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                            <Clock className="h-4 w-4 text-zinc-500" />
                            Menunggu Approval ({pendingLeaves.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                    <TableHead className="font-semibold text-zinc-900">Pegawai</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Jenis</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Tanggal</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Hari</TableHead>
                                    <TableHead className="font-semibold text-zinc-900">Alasan</TableHead>
                                    <TableHead className="font-semibold text-zinc-900 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLeaves.map((leave) => (
                                    <TableRow key={leave.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                                                    <User className="h-4 w-4 text-zinc-500" />
                                                </div>
                                                <span className="font-medium text-zinc-900">{leave.employee?.name || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="font-medium text-zinc-900">{formatDate(leave.startDate)}</p>
                                                <p className="text-zinc-500 text-xs mt-0.5">s.d {formatDate(leave.endDate)}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">{leave.days} hari</TableCell>
                                        <TableCell className="max-w-xs truncate text-zinc-600">{leave.reason}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setViewLeave(leave)}
                                                >
                                                    <Eye className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-zinc-200 text-zinc-700 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleReject(leave.id)}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1.5" />
                                                    Tolak
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-zinc-900 text-white hover:bg-zinc-800"
                                                    onClick={() => handleApprove(leave.id)}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1.5" />
                                                    Setuju
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* All Leaves */}
            <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                    <CardTitle className="text-base font-semibold text-zinc-900">Riwayat Cuti</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                <TableHead className="font-semibold text-zinc-900">Pegawai</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Jenis</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Tanggal</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Hari</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                                <TableHead className="font-semibold text-zinc-900 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamLeaves.length > 0 ? (
                                teamLeaves.map((leave) => (
                                    <TableRow key={leave.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                                                    <User className="h-4 w-4 text-zinc-500" />
                                                </div>
                                                <span className="font-medium text-zinc-900">{leave.employee?.name || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="font-medium text-zinc-900">{formatDate(leave.startDate)}</p>
                                                <p className="text-zinc-500 text-xs mt-0.5">s.d {formatDate(leave.endDate)}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">{leave.days} hari</TableCell>
                                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setViewLeave(leave)}>
                                                <Eye className="h-4 w-4 text-zinc-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center mb-1">
                                                <CalendarDays className="h-5 w-5 text-zinc-400" />
                                            </div>
                                            <p className="font-medium text-zinc-900">Belum ada data</p>
                                            <p className="text-xs text-zinc-500">Tidak ada riwayat cuti dari tim</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* View Dialog */}
            <Dialog open={!!viewLeave} onOpenChange={(open) => !open && setViewLeave(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
                        <DialogTitle>Detail Pengajuan Cuti</DialogTitle>
                    </DialogHeader>
                    {viewLeave && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 pb-3">
                                <span className="text-sm font-medium text-zinc-500">Pegawai</span>
                                <span className="col-span-2 text-sm font-semibold text-zinc-900">{viewLeave.employee?.name || user?.name || "Pegawai"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 pb-3">
                                <span className="text-sm font-medium text-zinc-500">Jenis Cuti</span>
                                <span className="col-span-2 text-sm font-semibold">{getLeaveTypeBadge(viewLeave.leaveType)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 pb-3">
                                <span className="text-sm font-medium text-zinc-500">Tanggal</span>
                                <div className="col-span-2 text-sm font-semibold">
                                    <p>{formatDate(viewLeave.startDate)} - {formatDate(viewLeave.endDate)}</p>
                                    <p className="text-zinc-500 font-normal">({viewLeave.days} hari)</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 pb-3">
                                <span className="text-sm font-medium text-zinc-500">Alasan</span>
                                <span className="col-span-2 text-sm font-medium text-zinc-900">{viewLeave.reason}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pb-1">
                                <span className="text-sm font-medium text-zinc-500">Status</span>
                                <span className="col-span-2 text-sm font-medium">{getStatusBadge(viewLeave.status)}</span>
                            </div>
                            {viewLeave.rejectionReason && (
                                <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-100 flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">Alasan Penolakan:</p>
                                        <p className="text-sm text-red-700">{viewLeave.rejectionReason}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

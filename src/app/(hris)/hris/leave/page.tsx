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
    Plane
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function LeavePage() {
    const user = useAuthStore((state) => state.user)
    // const { toast } = useToast()

    const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([])
    const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
    const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([])
    const [employeeId, setEmployeeId] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
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
                        // Employee profile not linked yet — show friendly message
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
                return <Badge className="bg-amber-100 text-amber-700">Menunggu</Badge>
            case "approved":
                return <Badge className="bg-emerald-100 text-emerald-700">Disetujui</Badge>
            case "rejected":
                return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    const getLeaveTypeBadge = (type: string) => {
        switch (type) {
            case "annual":
                return <Badge className="bg-blue-100 text-blue-700">Cuti Tahunan</Badge>
            case "sick":
                return <Badge className="bg-red-100 text-red-700">Sakit</Badge>
            case "personal":
                return <Badge className="bg-purple-100 text-purple-700">Izin Pribadi</Badge>
            default:
                return <Badge>{type}</Badge>
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
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-slate-500">Memuat data...</p>
                </div>
            </div>
        )
    }

    // Employee View - Request and view own leaves
    if (user?.role === "EMPLOYEE") {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Cuti & Izin</h1>
                        <p className="text-slate-500">Ajukan dan lihat status cuti Anda</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={employeeNotFound}>
                                <Plus className="h-4 w-4 mr-2" />
                                Ajukan Cuti
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajukan Cuti / Izin</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Jenis Cuti</Label>
                                    <Select
                                        value={formData.leaveType}
                                        onValueChange={(value: "annual" | "sick" | "personal") => setFormData({ ...formData, leaveType: value })}
                                    >
                                        <SelectTrigger>
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
                                        <Label>Tanggal Mulai</Label>
                                        <Input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tanggal Selesai</Label>
                                        <Input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {formData.startDate && formData.endDate && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600">
                                            Total hari: <strong>{calculateDays(formData.startDate, formData.endDate)} hari</strong>
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label>Alasan</Label>
                                    <Textarea
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Alasan pengajuan cuti..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button onClick={handleSubmit} disabled={saving}>
                                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Ajukan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Employee profile not found banner */}
                {employeeNotFound && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-amber-800">Profil Karyawan Belum Terdaftar</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Akun Anda belum terhubung dengan data karyawan. Silakan hubungi HR Admin untuk mendaftarkan profil karyawan Anda.
                            </p>
                        </div>
                    </div>
                )}

                {/* My Leaves List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Cuti</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Hari</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myLeaves.length > 0 ? (
                                    myLeaves.map((leave) => (
                                        <TableRow key={leave.id}>
                                            <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p>{new Date(leave.startDate).toLocaleDateString("id-ID")}</p>
                                                    <p className="text-slate-500">s.d {new Date(leave.endDate).toLocaleDateString("id-ID")}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{leave.days} hari</TableCell>
                                            <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                                            <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <CalendarDays className="h-8 w-8 text-slate-300" />
                                                <p className="text-slate-500">Belum ada pengajuan</p>
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
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {user?.role === "MANAGER" ? "Approval Cuti" : "Kelola Cuti"}
                    </h1>
                    <p className="text-slate-500">
                        {user?.role === "MANAGER" ? "Review request cuti dari tim" : "Kelola seluruh request cuti"}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Menunggu Approval</p>
                                <p className="text-2xl font-bold text-slate-900">{pendingLeaves.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Disetujui</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {teamLeaves.filter(l => l.status === "approved").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Ditolak</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {teamLeaves.filter(l => l.status === "rejected").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Leaves */}
            {pendingLeaves.length > 0 && (
                <Card className="border-amber-200">
                    <CardHeader className="bg-amber-50">
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <Clock className="h-5 w-5" />
                            Menunggu Approval ({pendingLeaves.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pegawai</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Hari</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLeaves.map((leave) => (
                                    <TableRow key={leave.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                {leave.employee?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{new Date(leave.startDate).toLocaleDateString("id-ID")}</p>
                                                <p className="text-slate-500">s.d {new Date(leave.endDate).toLocaleDateString("id-ID")}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{leave.days} hari</TableCell>
                                        <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(leave.id)}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Tolak
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(leave.id)}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
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
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Cuti</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Hari</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamLeaves.length > 0 ? (
                                teamLeaves.map((leave) => (
                                    <TableRow key={leave.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                {leave.employee?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{new Date(leave.startDate).toLocaleDateString("id-ID")}</p>
                                                <p className="text-slate-500">s.d {new Date(leave.endDate).toLocaleDateString("id-ID")}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{leave.days} hari</TableCell>
                                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <CalendarDays className="h-8 w-8 text-slate-300" />
                                            <p className="text-slate-500">Belum ada data</p>
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

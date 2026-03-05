"use client"

import { useEffect, useState, ChangeEvent } from "react"
import { useAuthStore } from "@/lib/store"
import { dailyReportApi, DailyReport, DailyReportItem } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    FileText,
    Plus,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    AlertTriangle,
    User,
    Calendar,
    Trash2,
    Send
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ReportItem {
    title: string
    description: string
    progress: number
    status: "pending" | "in_progress" | "completed"
}

export default function DailyReportPage() {
    const user = useAuthStore((state) => state.user)
    // const { toast } = useToast()

    const [myReports, setMyReports] = useState<DailyReport[]>([])
    const [teamReports, setTeamReports] = useState<DailyReport[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        notes: "",
    })
    const [items, setItems] = useState<ReportItem[]>([
        { title: "", description: "", progress: 0, status: "pending" }
    ])

    useEffect(() => {
        loadReports()
    }, [])

    const loadReports = async () => {
        try {
            setLoading(true)

            // Only HR_ADMIN, MANAGER, and OWNER can access getPending()
            // Other roles (EMPLOYEE, OPS, CASHIER) should use getMyReports()
            if (user?.role === "HR_ADMIN" || user?.role === "MANAGER" || user?.role === "OWNER") {
                // Manager or HR Admin - get pending reports
                const pendingData = await dailyReportApi.getPending()
                setTeamReports(pendingData)
            } else {
                const data = await dailyReportApi.getMyReports()
                setMyReports(data)
            }
        } catch (err: any) {
            console.error("Failed to load reports:", err)
            toast.error("Gagal", {
                description: "Gagal memuat laporan",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = () => {
        setItems([...items, { title: "", description: "", progress: 0, status: "pending" }])
    }

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    const handleItemChange = (index: number, field: keyof ReportItem, value: string | number) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleSubmit = async () => {
        // Validate
        if (!formData.date) {
            toast.error("Error", {
                description: "Pilih tanggal terlebih dahulu",
            })
            return
        }

        const validItems = items.filter(item => item.title.trim() !== "")
        if (validItems.length === 0) {
            toast.error("Error", {
                description: "Tambahkan minimal satu task",
            })
            return
        }

        try {
            setSaving(true)
            await dailyReportApi.create({
                date: formData.date,
                notes: formData.notes,
                items: validItems,
            })

            toast.success("Berhasil", {
                description: "Laporan kerja berhasil dikirim",
            })

            setIsDialogOpen(false)
            setFormData({ date: new Date().toISOString().split("T")[0], notes: "" })
            setItems([{ title: "", description: "", progress: 0, status: "pending" }])
            loadReports()
        } catch (err: any) {
            console.error("Failed to submit report:", err)
            toast.error("Gagal", {
                description: err.response?.data?.message || "Gagal mengirim laporan",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleApprove = async (id: string) => {
        try {
            await dailyReportApi.approve(id)
            toast.success("Berhasil", {
                description: "Laporan disetujui",
            })
            loadReports()
        } catch (err: any) {
            toast.error("Gagal", {
                description: "Gagal menyetujui laporan",
            })
        }
    }

    const handleReject = async (id: string) => {
        const reason = prompt("Masukkan alasan penolakan:")
        if (!reason) return

        try {
            await dailyReportApi.reject(id, reason)
            toast.success("Berhasil", {
                description: "Laporan ditolak",
            })
            loadReports()
        } catch (err: any) {
            toast.error("Gagal", {
                description: "Gagal menolak laporan",
            })
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "draft":
                return <Badge className="bg-slate-100 text-slate-700">Draft</Badge>
            case "submitted":
                return <Badge className="bg-blue-100 text-blue-700">Terkirim</Badge>
            case "approved":
                return <Badge className="bg-emerald-100 text-emerald-700">Disetujui</Badge>
            case "rejected":
                return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    const getItemStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge className="bg-slate-100 text-slate-700">Pending</Badge>
            case "in_progress":
                return <Badge className="bg-amber-100 text-amber-700">On Progress</Badge>
            case "completed":
                return <Badge className="bg-emerald-100 text-emerald-700">Selesai</Badge>
            default:
                return <Badge>{status}</Badge>
        }
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

    // Employee View - Create and view own reports
    if (user?.role === "EMPLOYEE") {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Laporan Kerja Harian</h1>
                        <p className="text-slate-500">Buat dan lihat laporan kerja Anda</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Laporan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Laporan Kerja Harian</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Catatan (Opsional)</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Catatan tambahan..."
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Daftar Task</Label>
                                        <Button variant="outline" size="sm" onClick={handleAddItem}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Tambah Task
                                        </Button>
                                    </div>

                                    {items.map((item, index) => (
                                        <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-3">
                                                    <Input
                                                        placeholder="Nama task..."
                                                        value={item.title}
                                                        onChange={(e) => handleItemChange(index, "title", e.target.value)}
                                                    />
                                                    <Textarea
                                                        placeholder="Deskripsi (opsional)..."
                                                        value={item.description}
                                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleItemChange(index, "description", e.target.value)}
                                                        rows={2}
                                                    />
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <Label className="text-xs">Progress: {item.progress}%</Label>
                                                            <Input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={item.progress}
                                                                onChange={(e) => handleItemChange(index, "progress", parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <Select
                                                            value={item.status}
                                                            onValueChange={(value) => handleItemChange(index, "status", value)}
                                                        >
                                                            <SelectTrigger className="w-32">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pending</SelectItem>
                                                                <SelectItem value="in_progress">On Progress</SelectItem>
                                                                <SelectItem value="completed">Completed</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                {items.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button onClick={handleSubmit} disabled={saving}>
                                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    <Send className="h-4 w-4 mr-2" />
                                    Kirim Laporan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* My Reports List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Laporan</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myReports.length > 0 ? (
                                    myReports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    {new Date(report.date).toLocaleDateString("id-ID")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {report.items?.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="text-sm">
                                                            <span className="font-medium">{item.title}</span>
                                                            <span className="text-slate-500"> ({item.progress}%)</span>
                                                        </div>
                                                    ))}
                                                    {(report.items?.length || 0) > 2 && (
                                                        <p className="text-xs text-slate-500">
                                                            +{report.items!.length - 2} task lainnya
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-slate-300" />
                                                <p className="text-slate-500">Belum ada laporan</p>
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

    // Manager / HR View - Team Reports
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {user?.role === "MANAGER" ? "Laporan Tim" : "Laporan Kerja"}
                    </h1>
                    <p className="text-slate-500">
                        {user?.role === "MANAGER" ? "Review laporan dari tim Anda" : "Review seluruh laporan"}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Laporan</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamReports.length > 0 ? (
                                teamReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {new Date(report.date).toLocaleDateString("id-ID")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                {report.employee?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {report.items?.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <span className="font-medium">{item.title}</span>
                                                        <span className="text-slate-500"> ({item.progress}%)</span>
                                                    </div>
                                                ))}
                                                {(report.items?.length || 0) > 2 && (
                                                    <p className="text-xs text-slate-500">
                                                        +{report.items!.length - 2} task lainnya
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {report.status === "submitted" && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleReject(report.id)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Tolak
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(report.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Setuju
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-8 w-8 text-slate-300" />
                                            <p className="text-slate-500">Belum ada laporan</p>
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

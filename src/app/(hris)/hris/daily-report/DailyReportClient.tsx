"use client"

import { useEffect, useState, ChangeEvent } from "react"
import { useAuthStore } from "@/lib/store"
import { dailyReportApi, DailyReport, DailyReportItem } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    Send,
    Edit2,
    Eye,
    ClipboardList,
    ChevronRight,
    StickyNote
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
import { PageLoading } from "@/components/ui/page-loading"

interface ReportItem {
    title: string
    description: string
    progress: number
    status: "pending" | "in_progress" | "completed"
}

export default function DailyReportClient() {
    const user = useAuthStore((state) => state.user)

    const [myReports, setMyReports] = useState<DailyReport[]>([])
    const [teamReports, setTeamReports] = useState<DailyReport[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [viewReport, setViewReport] = useState<DailyReport | null>(null)
    const [saving, setSaving] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [currentRejectionReason, setCurrentRejectionReason] = useState<string | null>(null)

    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [startDate, setStartDate] = useState(lastWeek.toISOString().split("T")[0])
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0])

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        notes: "",
    })
    const [items, setItems] = useState<ReportItem[]>([
        { title: "", description: "", progress: 0, status: "pending" }
    ])

    const isApprover = user?.role === "HR_ADMIN" || user?.role === "MANAGER" || user?.role === "OWNER" || user?.role === "TEAM_LEADER"

    useEffect(() => {
        loadReports()
    }, [startDate, endDate])

    const loadReports = async () => {
        try {
            setLoading(true)

            // Everyone can see their own reports
            const myData = await dailyReportApi.getMyReports(startDate, endDate)
            setMyReports(myData)

            // Approvers can also see team pending reports
            if (isApprover) {
                const pendingData = await dailyReportApi.getPending()
                setTeamReports(pendingData)
            }
        } catch (err: any) {
            console.error("Failed to load reports:", err)
            toast.error("Gagal memuat laporan")
        } finally {
            setLoading(false)
        }
    }

    const openNewReportDialog = () => {
        setEditId(null)
        setCurrentRejectionReason(null)
        setFormData({ date: new Date().toISOString().split("T")[0], notes: "" })
        setItems([{ title: "", description: "", progress: 0, status: "pending" }])
        setIsDialogOpen(true)
    }

    const handleEditReport = (report: DailyReport) => {
        setEditId(report.id)
        setCurrentRejectionReason(report.rejectionReason || null)
        setFormData({
            date: new Date(report.date).toISOString().split("T")[0],
            notes: report.notes || ""
        })
        if (report.items && report.items.length > 0) {
            setItems(report.items.map(i => ({
                title: i.title,
                description: i.description || "",
                progress: i.progress,
                status: (i.status.toLowerCase()) as "pending" | "in_progress" | "completed"
            })))
        } else {
            setItems([{ title: "", description: "", progress: 0, status: "pending" }])
        }
        setIsDialogOpen(true)
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
        if (!formData.date) {
            toast.error("Pilih tanggal terlebih dahulu")
            return
        }

        const validItems = items.filter(item => item.title.trim() !== "")
        if (validItems.length === 0) {
            toast.error("Tambahkan minimal satu task")
            return
        }

        try {
            setSaving(true)
            if (editId) {
                await dailyReportApi.update(editId, {
                    date: formData.date,
                    notes: formData.notes,
                    items: validItems,
                })
                toast.success("Laporan kerja berhasil diubah")
            } else {
                await dailyReportApi.create({
                    date: formData.date,
                    notes: formData.notes,
                    items: validItems,
                })
                toast.success("Laporan kerja berhasil dikirim")
            }

            setIsDialogOpen(false)
            loadReports()
        } catch (err: any) {
            console.error("Failed to submit report:", err)
            toast.error(err.response?.data?.message || "Gagal menyimpan laporan")
        } finally {
            setSaving(false)
        }
    }

    const handleApprove = async (id: string) => {
        try {
            await dailyReportApi.approve(id, user?.id ?? '')
            toast.success("Laporan disetujui")
            loadReports()
        } catch (err: any) {
            toast.error("Gagal menyetujui laporan")
        }
    }

    const handleReject = async (id: string) => {
        const reason = prompt("Masukkan alasan penolakan:")
        if (!reason) return

        try {
            await dailyReportApi.reject(id, user?.id ?? '', reason)
            toast.success("Laporan ditolak")
            loadReports()
        } catch (err: any) {
            toast.error("Gagal menolak laporan")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
            case "draft":
                return <Badge className="bg-slate-100 text-slate-700 gap-1"><Clock className="h-3 w-3" />Pending</Badge>
            case "submitted":
                return <Badge className="bg-blue-100 text-blue-700 gap-1"><Send className="h-3 w-3" />Terkirim</Badge>
            case "approved":
                return <Badge className="bg-emerald-100 text-emerald-700 gap-1"><CheckCircle className="h-3 w-3" />Disetujui</Badge>
            case "rejected":
                return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="h-3 w-3" />Ditolak</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    const getItemStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed": return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">Selesai</Badge>
            case "in_progress": return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">On Progress</Badge>
            default: return <Badge className="bg-slate-50 text-slate-600 border border-slate-200 text-xs">Pending</Badge>
        }
    }

    if (loading && myReports.length === 0 && teamReports.length === 0) {
        return <PageLoading />
    }

    const renderMyReports = () => (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Riwayat Laporan Saya</CardTitle>
                            <CardDescription>Menampilkan laporan kerja yang Anda buat.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-auto h-9"
                                />
                                <span className="text-slate-500">-</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-auto h-9"
                                />
                            </div>
                            <Button className="w-full sm:w-auto" onClick={openNewReportDialog}>
                                <Plus className="h-4 w-4 mr-2" /> Buat Laporan
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
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
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setViewReport(report)}>
                                                    <Eye className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                                {(report.status.toLowerCase() === "pending" || report.status.toLowerCase() === "rejected") && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditReport(report)}>
                                                        <Edit2 className="h-4 w-4 text-zinc-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-8 w-8 text-slate-300" />
                                            <p className="text-slate-500">Belum ada laporan di periode ini</p>
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

    const renderTeamReports = () => (
        <Card>
            <CardHeader>
                <CardTitle>Menunggu Persetujuan</CardTitle>
                <CardDescription>Laporan kerjam tim yang membutuhkan approval Anda.</CardDescription>
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
                                        <div className="flex items-center gap-2 font-medium">
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
                                        {report.status.toLowerCase() === "pending" ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setViewReport(report)}>
                                                    <Eye className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleReject(report.id)}>
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Tolak
                                                </Button>
                                                <Button size="sm" onClick={() => handleApprove(report.id)}>
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Setuju
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => setViewReport(report)}>
                                                <Eye className="h-4 w-4 text-zinc-500" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCircle className="h-8 w-8 text-emerald-300" />
                                        <p className="text-slate-500">Tidak ada laporan yang menunggu persetujuan</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Laporan Kerja Harian</h1>
                    <p className="text-slate-500">Kelola dan review laporan kerja</p>
                </div>
            </div>

            {isApprover ? (
                <Tabs defaultValue="my" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="my">Laporan Saya</TabsTrigger>
                        <TabsTrigger value="team">
                            Laporan Tim
                            {teamReports.length > 0 && (
                                <Badge className="ml-2 bg-rose-500 hover:bg-rose-600 text-white border-0">{teamReports.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="my">
                        {renderMyReports()}
                    </TabsContent>
                    <TabsContent value="team">
                        {renderTeamReports()}
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="w-full">
                    {renderMyReports()}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
                        <DialogTitle>{editId ? "Edit Laporan Kerja" : "Buat Laporan Kerja Harian"}</DialogTitle>
                    </DialogHeader>
                    {currentRejectionReason && (
                        <div className="mb-2 p-3 rounded-lg bg-red-50 border border-red-100 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-red-800">Alasan Penolakan Sebelumnya:</p>
                                <p className="text-sm text-red-700">{currentRejectionReason}</p>
                            </div>
                        </div>
                    )}
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
                                    <Plus className="h-4 w-4 mr-1" /> Tambah Task
                                </Button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="p-4 bg-slate-50/80 border border-slate-100 rounded-lg space-y-3">
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
                                                    <Label className="text-xs text-slate-500 mb-1 block">Progress: {item.progress}%</Label>
                                                    <Input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        className="h-2"
                                                        value={item.progress}
                                                        onChange={(e) => handleItemChange(index, "progress", parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <Label className="text-xs text-slate-500 mb-1 block">Status</Label>
                                                    <Select
                                                        value={item.status}
                                                        onValueChange={(value) => handleItemChange(index, "status", value)}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
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
                                        </div>
                                        {items.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="ml-4 h-8 w-8 hover:bg-red-50 hover:text-red-500"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
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
                            {editId ? (
                                <><CheckCircle className="h-4 w-4 mr-2" /> Simpan Perubahan</>
                            ) : (
                                <><Send className="h-4 w-4 mr-2" /> Kirim Laporan</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* View Report Dialog */}
            <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {viewReport && (
                        <>
                            <DialogHeader className="sr-only">
                                <DialogTitle>Detail Laporan Kerja Harian</DialogTitle>
                            </DialogHeader>
                            {/* Header */}
                            <div className="pb-5 mb-5 border-b border-zinc-100">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                            <ClipboardList className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-slate-800">Laporan Kerja Harian</h2>
                                            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(viewReport.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 mt-1">
                                        {getStatusBadge(viewReport.status)}
                                    </div>
                                </div>

                                {/* Meta info */}
                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                                    {viewReport.employee?.name && (
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium text-slate-700">{viewReport.employee.name}</span>
                                        </div>
                                    )}
                                    {viewReport.approvedBy && (
                                        <div className="flex items-center gap-1.5">
                                            {viewReport.status === 'approved' ? (
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span>
                                                {viewReport.status === 'approved' ? 'Disetujui' : 'Terakhir ditolak'} oleh <span className="font-medium text-slate-700">{viewReport.approverName || viewReport.approvedBy || "Admin"}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {viewReport.rejectionReason && (
                                    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex gap-3 animate-in fade-in slide-in-from-top-1">
                                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-800">
                                                {viewReport.status === 'rejected' ? 'Alasan Penolakan:' : 'Alasan Penolakan Sebelumnya:'}
                                            </p>
                                            <p className="text-sm text-red-700 leading-relaxed">{viewReport.rejectionReason}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {viewReport.notes && (
                                <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-100 flex gap-3">
                                    <StickyNote className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-amber-800">{viewReport.notes}</p>
                                </div>
                            )}

                            {/* Tasks */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                    Daftar Task ({viewReport.items?.length || 0})
                                </h3>
                                {viewReport.items && viewReport.items.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {viewReport.items.map((item, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-medium text-slate-800 text-sm">{item.title}</span>
                                                    </div>
                                                    {getItemStatusBadge(item.status)}
                                                </div>
                                                {item.description && (
                                                    <p className="text-sm text-slate-500 ml-8 mb-2">{item.description}</p>
                                                )}
                                                <div className="ml-8 flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${item.progress >= 100 ? "bg-emerald-500" :
                                                                    item.progress >= 50 ? "bg-indigo-500" : "bg-amber-400"
                                                                }`}
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500 w-9 text-right shrink-0">
                                                        {item.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-400 text-sm">Tidak ada task</div>
                                )}
                            </div>

                            {/* Footer actions for approvers */}
                            {isApprover && viewReport.status.toLowerCase() === "pending" && (
                                <div className="mt-6 pt-5 border-t border-zinc-100 flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { handleReject(viewReport.id); setViewReport(null) }}>
                                        <XCircle className="h-4 w-4 mr-1" /> Tolak
                                    </Button>
                                    <Button size="sm" onClick={() => { handleApprove(viewReport.id); setViewReport(null) }}>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store"
import { employeesApi, Employee, payrollApi, Payroll } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DollarSign,
    Loader2,
    Download,
    Eye,
    Calendar,
    User,
    CheckCircle,
    Clock,
    FileText,
    Calculator
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PageLoading } from "@/components/ui/page-loading"

export default function PayrollClient() {
    const user = useAuthStore((state) => state.user)
    // const { toast } = useToast()

    const [payrolls, setPayrolls] = useState<Payroll[]>([])
    const [myPayrolls, setMyPayrolls] = useState<Payroll[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState("")
    const [calculating, setCalculating] = useState(false)
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
    const [creatingPayroll, setCreatingPayroll] = useState(false)
    const [downloadingSlipId, setDownloadingSlipId] = useState<string | null>(null)
    const [manualForm, setManualForm] = useState({
        employeeId: "",
        period: "",
        workDays: 0,
        bonus: 0,
        commission: 0,
        overtime: 0,
        lateDeduction: 0,
        absentDeduction: 0,
        bpjs: 0,
        tht: 0,
        tax: 0,
        otherDeduction: 0,
        notes: "",
    })

    useEffect(() => {
        loadPayroll()
    }, [period])

    useEffect(() => {
        if (!period) return
        setManualForm((prev) => (prev.period ? prev : { ...prev, period }))
    }, [period])

    const loadPayroll = async () => {
        try {
            setLoading(true)

            if (user?.role === "EMPLOYEE") {
                const data = await payrollApi.getMyPayroll()
                setMyPayrolls(data)
            } else {
                const [payrollData, employeesData] = await Promise.all([
                    payrollApi.getAll(period),
                    employeesApi.getAll(),
                ])
                setPayrolls(payrollData)
                setEmployees(employeesData)
            }
        } catch (err: any) {
            console.error("Failed to load payroll:", err)
            toast.error("Gagal", {
                description: "Gagal memuat data payroll",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCalculate = async () => {
        if (!period) {
            toast.error("Error", {
                description: "Pilih periode terlebih dahulu",
            })
            return
        }

        try {
            setCalculating(true)
            await payrollApi.calculate(period)
            toast.success("Berhasil", {
                description: "Payroll berhasil dihitung",
            })
            loadPayroll()
        } catch (err: any) {
            console.error("Failed to calculate payroll:", err)
            toast.error("Gagal", {
                description: err.response?.data?.message || "Gagal menghitung payroll",
            })
        } finally {
            setCalculating(false)
        }
    }

    const handleMarkAsPaid = async (id: string) => {
        try {
            await payrollApi.markAsPaid(id)
            toast.success("Berhasil", {
                description: "Status pembayaran diperbarui",
            })
            loadPayroll()
        } catch (err: any) {
            toast.error("Gagal", {
                description: "Gagal memperbarui status",
            })
        }
    }
    const getBpjsEmployee = (payroll: Payroll) => payroll.bpjsEmployee ?? payroll.bpjs ?? 0
    const getBpjsEmployer = (payroll: Payroll) => payroll.bpjsEmployer ?? 0
    const getTotalDeductionAmount = (payroll: Payroll) => (
        payroll.absentDeduction +
        payroll.lateDeduction +
        getBpjsEmployee(payroll) +
        payroll.tht +
        payroll.tax +
        payroll.otherDeduction
    )

    const handleDownloadSlipPdf = async (payroll: Payroll) => {
        try {
            setDownloadingSlipId(payroll.id)
            const blob = await payrollApi.downloadSlipPdf(payroll.id)
            const objectUrl = window.URL.createObjectURL(blob)
            const periodLabel = payroll.period || "periode"
            const employeeLabel = (payroll.employee?.name || payroll.employeeName || payroll.employeeId || "pegawai")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
            const filename = `slip-gaji-${employeeLabel || "pegawai"}-${periodLabel}.pdf`

            const link = document.createElement("a")
            link.href = objectUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(objectUrl)
        } catch (err: any) {
            toast.error("Gagal", {
                description: err?.response?.data?.message || "Gagal mengunduh slip gaji PDF",
            })
        } finally {
            setDownloadingSlipId(null)
        }
    }

    const normalizeEmployeeType = (value?: string) => {
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

    const selectedEmployee = employees.find((employee) => employee.id === manualForm.employeeId)
    const selectedEmployeeType = normalizeEmployeeType(selectedEmployee?.employeeType)

    const handleCreateManualPayroll = async () => {
        if (!manualForm.employeeId || !manualForm.period) {
            toast.error("Error", {
                description: "Pegawai dan periode wajib diisi",
            })
            return
        }

        if (selectedEmployeeType === "FREELANCE_BURUH" && manualForm.workDays <= 0) {
            toast.error("Error", {
                description: "Hari kerja wajib diisi untuk pegawai freelance/buruh",
            })
            return
        }

        try {
            setCreatingPayroll(true)
            await payrollApi.create({
                employeeId: manualForm.employeeId,
                period: manualForm.period,
                workDays: manualForm.workDays,
                bonus: manualForm.bonus,
                commission: manualForm.commission,
                overtime: manualForm.overtime,
                lateDeduction: manualForm.lateDeduction,
                absentDeduction: manualForm.absentDeduction,
                bpjs: manualForm.bpjs,
                tht: manualForm.tht,
                tax: manualForm.tax,
                otherDeduction: manualForm.otherDeduction,
                notes: manualForm.notes,
            })
            toast.success("Berhasil", {
                description: "Payroll manual berhasil dibuat",
            })
            setIsManualDialogOpen(false)
            setManualForm({
                employeeId: "",
                period: period || "",
                workDays: 0,
                bonus: 0,
                commission: 0,
                overtime: 0,
                lateDeduction: 0,
                absentDeduction: 0,
                bpjs: 0,
                tht: 0,
                tax: 0,
                otherDeduction: 0,
                notes: "",
            })
            loadPayroll()
        } catch (err: any) {
            toast.error("Gagal", {
                description: err.response?.data?.message || "Gagal membuat payroll manual",
            })
        } finally {
            setCreatingPayroll(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "draft":
                return <Badge className="bg-slate-100 text-slate-700">Draft</Badge>
            case "calculated":
                return <Badge className="bg-blue-100 text-blue-700">Dihitung</Badge>
            case "paid":
                return <Badge className="bg-emerald-100 text-emerald-700">Dibayar</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    const SlipGajiModal = ({ payroll }: { payroll: Payroll }) => (
        <div className="space-y-6">
            <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">SLIP GAJI</h2>
                <p className="text-slate-500">Periode: {payroll.period}</p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-slate-600">Nama</span>
                    <span className="font-medium">{payroll.employee?.name || payroll.employeeName || "-"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">NIP</span>
                    <span className="font-medium">{payroll.employee?.nip}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Jenis Karyawan</span>
                    <span className="font-medium">{employeeTypeLabel(payroll.employeeType || payroll.employee?.employeeType)}</span>
                </div>
                {normalizeEmployeeType(payroll.employeeType || payroll.employee?.employeeType) === "FREELANCE_BURUH" && (
                    <div className="flex justify-between">
                        <span className="text-slate-600">Hari Kerja</span>
                        <span className="font-medium">{payroll.workDays} hari</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-slate-600">Departemen</span>
                    <span className="font-medium">{payroll.employee?.department?.name}</span>
                </div>
                {payroll.isProrated && (
                    <div className="flex justify-between">
                        <span className="text-slate-600">Prorata</span>
                        <span className="font-medium">{payroll.prorateDays || 0}/{payroll.periodDays || 0} hari ({(payroll.prorateFactor || 0).toFixed(4)})</span>
                    </div>
                )}
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">PENDAPATAN</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Gaji Pokok</span>
                        <span>{formatCurrency(payroll.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Tunjangan</span>
                        <span>{formatCurrency(payroll.allowance)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Bonus</span>
                        <span>{formatCurrency(payroll.bonus)}</span>
                    </div>
                    {(payroll.commission || 0) > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-600">Komisi</span>
                            <span>{formatCurrency(payroll.commission || 0)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">POTONGAN</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Potongan Absensi</span>
                        <span>- {formatCurrency(payroll.absentDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Potongan Keterlambatan</span>
                        <span>- {formatCurrency(payroll.lateDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">BPJS (Employee)</span>
                        <span>- {formatCurrency(getBpjsEmployee(payroll))}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">THT</span>
                        <span>- {formatCurrency(payroll.tht)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">PPh21</span>
                        <span>- {formatCurrency(payroll.tax)}</span>
                    </div>
                    {payroll.otherDeduction > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-600">Potongan Lain</span>
                            <span>- {formatCurrency(payroll.otherDeduction)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">KONTRIBUSI PERUSAHAAN</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-600">BPJS (Employer)</span>
                        <span>{formatCurrency(getBpjsEmployer(payroll))}</span>
                    </div>
                </div>
            </div>

            <div className="border-t pt-4 bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between text-lg font-bold">
                    <span>GAJI BERSIH</span>
                    <span className="text-emerald-600">{formatCurrency(payroll.netSalary)}</span>
                </div>
            </div>
        </div>
    )

    if (loading) {
        return <PageLoading />
    }

    // Employee View - See own salary slips
    if (user?.role === "EMPLOYEE") {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Slip Gaji</h1>
                    <p className="text-slate-500">Lihat riwayat slip gaji Anda</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Periode</TableHead>
                                    <TableHead>Gaji Pokok</TableHead>
                                    <TableHead>Tunjangan</TableHead>
                                    <TableHead>Bonus/Komisi</TableHead>
                                    <TableHead>Potongan</TableHead>
                                    <TableHead>Gaji Bersih</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myPayrolls.length > 0 ? (
                                    myPayrolls.map((payroll) => (
                                        <TableRow key={payroll.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    {payroll.period}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatCurrency(payroll.basicSalary)}</TableCell>
                                            <TableCell>{formatCurrency(payroll.allowance)}</TableCell>
                                            <TableCell>{formatCurrency(payroll.bonus + (payroll.commission || 0))}</TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    payroll.absentDeduction +
                                                    payroll.lateDeduction +
                                                    getBpjsEmployee(payroll) +
                                                    payroll.tht +
                                                    payroll.tax +
                                                    payroll.otherDeduction
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium text-emerald-600">
                                                {formatCurrency(payroll.netSalary)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedPayroll(payroll)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Lihat
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
                                                            <DialogTitle>Slip Gaji</DialogTitle>
                                                        </DialogHeader>
                                                        {selectedPayroll && <SlipGajiModal payroll={selectedPayroll} />}
                                                    </DialogContent>
                                                </Dialog>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={downloadingSlipId === payroll.id}
                                                    onClick={() => handleDownloadSlipPdf(payroll)}
                                                >
                                                    {downloadingSlipId === payroll.id ? (
                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4 mr-1" />
                                                    )}
                                                    PDF
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <DollarSign className="h-8 w-8 text-slate-300" />
                                                <p className="text-slate-500">Belum ada slip gaji</p>
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

    // HR Admin / Manager View - Manage payroll
    return (
        <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Payroll</h1>
                    <p className="text-sm text-zinc-500 mt-1">Kelola dan hitung gaji karyawan</p>
                </div>
                <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="border-zinc-300"
                            onClick={() => setManualForm((prev) => ({ ...prev, period: prev.period || period }))}
                        >
                            Input Payroll Manual
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
                            <DialogTitle>Input Payroll Manual</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Pegawai</Label>
                                    <Select
                                        value={manualForm.employeeId}
                                        onValueChange={(value) => setManualForm((prev) => ({ ...prev, employeeId: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih pegawai" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id}>
                                                    {employee.name} - {employeeTypeLabel(employee.employeeType)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Periode</Label>
                                    <Input
                                        type="month"
                                        value={manualForm.period}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, period: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {selectedEmployeeType === "FREELANCE_BURUH" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Hari Kerja (Freelance)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={manualForm.workDays}
                                            onChange={(e) => setManualForm((prev) => ({ ...prev, workDays: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                    <Label>Bonus</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualForm.bonus}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, bonus: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Lembur</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualForm.overtime}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, overtime: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Komisi</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualForm.commission}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, commission: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>PPh21 (0 = otomatis)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualForm.tax}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, tax: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>BPJS Employee (0 = otomatis)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualForm.bpjs}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, bpjs: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>THT</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualForm.tht}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, tht: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Potongan Lain</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualForm.otherDeduction}
                                        onChange={(e) => setManualForm((prev) => ({ ...prev, otherDeduction: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleCreateManualPayroll} disabled={creatingPayroll}>
                                {creatingPayroll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Simpan Payroll
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Calculate Payroll */}
            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                        <Calculator className="h-4 w-4 text-zinc-500" />
                        Hitung Payroll
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="border-zinc-200 h-10 w-full sm:max-w-xs">
                                    <SelectValue placeholder="Pilih Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const date = new Date()
                                        date.setMonth(date.getMonth() - i)
                                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                                        return (
                                            <SelectItem key={value} value={value}>
                                                {date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleCalculate}
                            disabled={calculating || !period}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm h-10"
                        >
                            {calculating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Hitung Gaji
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Total Payroll</p>
                                <p className="text-2xl font-bold text-zinc-900">{payrolls.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Belum Dibayar</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {payrolls.filter(p => p.status !== "paid").length}
                                </p>
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
                                <p className="text-sm font-medium text-zinc-500">Total Gaji</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {formatCurrency(payrolls.reduce((sum, p) => sum + p.netSalary, 0))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payroll Table */}
            <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                    <CardTitle className="text-base font-semibold text-zinc-900">Daftar Payroll</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                <TableHead className="font-semibold text-zinc-900">Pegawai</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Jenis</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Periode</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Gaji Pokok</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Tunjangan</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Potongan</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Gaji Bersih</TableHead>
                                <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                                <TableHead className="text-right font-semibold text-zinc-900">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrolls.length > 0 ? (
                                payrolls.map((payroll) => (
                                    <TableRow key={payroll.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                {payroll.employee?.name || payroll.employeeName || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{employeeTypeLabel(payroll.employeeType || payroll.employee?.employeeType)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {payroll.period}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(payroll.basicSalary)}</TableCell>
                                        <TableCell>
                                            {formatCurrency(payroll.allowance + payroll.bonus + (payroll.commission || 0))}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(
                                                payroll.absentDeduction +
                                                payroll.lateDeduction +
                                                getBpjsEmployee(payroll) +
                                                payroll.tht +
                                                payroll.tax +
                                                payroll.otherDeduction
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-emerald-600">
                                            {formatCurrency(payroll.netSalary)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedPayroll(payroll)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Lihat
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
                                                            <DialogTitle>Slip Gaji</DialogTitle>
                                                        </DialogHeader>
                                                        {selectedPayroll && <SlipGajiModal payroll={selectedPayroll} />}
                                                    </DialogContent>
                                                </Dialog>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={downloadingSlipId === payroll.id}
                                                    onClick={() => handleDownloadSlipPdf(payroll)}
                                                >
                                                    {downloadingSlipId === payroll.id ? (
                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4 mr-1" />
                                                    )}
                                                    PDF
                                                </Button>
                                                {payroll.status !== "paid" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleMarkAsPaid(payroll.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Bayar
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <DollarSign className="h-8 w-8 text-slate-300" />
                                            <p className="text-slate-500">Belum ada payroll</p>
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







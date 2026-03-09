"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store"
import { payrollApi, Payroll } from "@/lib/hris"
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
    DialogTrigger
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PageLoading } from "@/components/ui/page-loading"

export default function PayrollClient() {
    const user = useAuthStore((state) => state.user)
    // const { toast } = useToast()

    const [payrolls, setPayrolls] = useState<Payroll[]>([])
    const [myPayrolls, setMyPayrolls] = useState<Payroll[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState("")
    const [calculating, setCalculating] = useState(false)
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)

    useEffect(() => {
        loadPayroll()
    }, [period])

    const loadPayroll = async () => {
        try {
            setLoading(true)

            if (user?.role === "EMPLOYEE") {
                const data = await payrollApi.getMyPayroll()
                setMyPayrolls(data)
            } else {
                const data = await payrollApi.getAll(period)
                setPayrolls(data)
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
                    <span className="font-medium">{payroll.employee?.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">NIP</span>
                    <span className="font-medium">{payroll.employee?.nip}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Departemen</span>
                    <span className="font-medium">{payroll.employee?.department?.name}</span>
                </div>
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
                        <span className="text-slate-600">BPJS</span>
                        <span>- {formatCurrency(payroll.bpjs)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Pajak</span>
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
                                    <TableHead>Bonus</TableHead>
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
                                            <TableCell>{formatCurrency(payroll.bonus)}</TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    payroll.absentDeduction +
                                                    payroll.lateDeduction +
                                                    payroll.bpjs +
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
                                                        <DialogHeader>
                                                            <DialogTitle>Slip Gaji</DialogTitle>
                                                        </DialogHeader>
                                                        {selectedPayroll && <SlipGajiModal payroll={selectedPayroll} />}
                                                    </DialogContent>
                                                </Dialog>
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
                                                {payroll.employee?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {payroll.period}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(payroll.basicSalary)}</TableCell>
                                        <TableCell>
                                            {formatCurrency(payroll.allowance + payroll.bonus)}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(
                                                payroll.absentDeduction +
                                                payroll.lateDeduction +
                                                payroll.bpjs +
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
                                                        <DialogHeader>
                                                            <DialogTitle>Slip Gaji</DialogTitle>
                                                        </DialogHeader>
                                                        {selectedPayroll && <SlipGajiModal payroll={selectedPayroll} />}
                                                    </DialogContent>
                                                </Dialog>
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
                                    <TableCell colSpan={8} className="text-center py-8">
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

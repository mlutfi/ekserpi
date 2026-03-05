"use client"

import { useState, useEffect } from "react"
import {
    reportsApi,
    ReportFilter,
    ReportSummary,
    DailyChartPoint,
    SaleDetail,
    CashierOption,
    ProfitReportResponse,
} from "@/lib/api"
import { toast } from "sonner"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import {
    Download,
    Filter,
    DollarSign,
    ShoppingBag,
    CreditCard,
    Banknote,
    Calendar as CalendarIcon,
    TrendingUp,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type TabType = "SALES" | "PROFIT"

export default function ReportsAdminPage() {
    // const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<TabType>("SALES")
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    const [filter, setFilter] = useState<ReportFilter>({
        startDate: "",
        endDate: "",
        cashierId: "",
        paymentMethod: "",
    })

    const [cashiers, setCashiers] = useState<CashierOption[]>([])
    const [summary, setSummary] = useState<ReportSummary | null>(null)
    const [chartData, setChartData] = useState<DailyChartPoint[]>([])
    const [sales, setSales] = useState<SaleDetail[]>([])
    const [profitReport, setProfitReport] = useState<ProfitReportResponse | null>(null)

    // New state for modal
    const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)

    useEffect(() => {
        fetchCashiers()
    }, [])

    useEffect(() => {
        fetchReportData()
    }, [filter])

    async function fetchCashiers() {
        try {
            const data = await reportsApi.getCashiers()
            setCashiers(data)
        } catch (error) {
            console.error("Gagal memuat daftar kasir", error)
        }
    }

    async function fetchReportData() {
        setLoading(true)
        try {
            if (activeTab === "SALES") {
                const [summaryData, mapData, salesData] = await Promise.all([
                    reportsApi.getSummary(filter),
                    reportsApi.getChart(filter),
                    reportsApi.getSales(filter)
                ])
                setSummary(summaryData)
                setChartData(mapData)
                setSales(salesData)
            } else if (activeTab === "PROFIT") {
                const profitData = await reportsApi.getProfitReport(filter)
                setProfitReport(profitData)
            }
        } catch (error: any) {
            toast.error("Error", {
                description: "Gagal memuat data laporan",
            })
        } finally {
            setLoading(false)
        }
    }

    async function handleExport() {
        setExporting(true)
        try {
            const blob = await reportsApi.exportExcel(filter)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            let filename = "laporan_penjualan.xlsx"
            if (filter.startDate && filter.endDate) {
                filename = `laporan_${filter.startDate}_${filter.endDate}.xlsx`
            }
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error: any) {
            toast.error("Error", {
                description: "Gagal mengunduh laporan",
            })
        } finally {
            setExporting(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Laporan Penjualan</h1>
                    <p className="text-sm text-slate-500">
                        Analisis performa penjualan dan unduh laporan
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                    {exporting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-white" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {exporting ? "Mengekspor..." : "Export Excel"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex px-1 space-x-1 bg-slate-100/50 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("SALES")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === "SALES"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                >
                    <BarChart className="w-4 h-4" />
                    Penjualan
                </button>
                <button
                    onClick={() => setActiveTab("PROFIT")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === "PROFIT"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Laba Rugi
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-700">Filter Laporan</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            Dari Tanggal
                        </label>
                        <input
                            type="date"
                            value={filter.startDate}
                            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            Sampai Tanggal
                        </label>
                        <input
                            type="date"
                            value={filter.endDate}
                            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            Kasir
                        </label>
                        <Select
                            value={filter.cashierId || "ALL"}
                            onValueChange={(value) => setFilter({ ...filter, cashierId: value === "ALL" ? "" : value })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Semua Kasir" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Kasir</SelectItem>
                                {cashiers.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            Metode Pembayaran
                        </label>
                        <Select
                            value={filter.paymentMethod || "ALL"}
                            onValueChange={(value) => setFilter({ ...filter, paymentMethod: value === "ALL" ? "" : value })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Semua Metode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Metode</SelectItem>
                                <SelectItem value="CASH">Tunai (Cash)</SelectItem>
                                <SelectItem value="QRIS">QRIS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                </div>
            ) : activeTab === "SALES" && summary ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-green-100 p-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Pendapatan</p>
                                    <p className="text-xl font-bold text-slate-900">{formatPrice(summary.totalRevenue)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Transaksi Berhasil</p>
                                    <p className="text-xl font-bold text-slate-900">{summary.totalTransactions}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-100 p-2">
                                    <Banknote className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Pendapatan Tunai</p>
                                    <p className="text-xl font-bold text-slate-900">{formatPrice(summary.cashRevenue)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-purple-100 p-2">
                                    <CreditCard className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Pendapatan QRIS</p>
                                    <p className="text-xl font-bold text-slate-900">{formatPrice(summary.qrisRevenue)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Chart */}
                        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold text-slate-700">Grafik Pendapatan Harian</h3>
                            <div className="h-72 w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#64748B' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#64748B' }}
                                                tickFormatter={(value) => `Rp${value / 1000}k`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                                                                <p className="mb-1 text-sm font-medium text-slate-900">{payload[0].payload.date}</p>
                                                                <p className="text-sm text-slate-600">
                                                                    Pendapatan: <span className="font-semibold text-slate-900">{formatPrice(payload[0].value as number)}</span>
                                                                </p>
                                                                <p className="text-sm text-slate-600">
                                                                    Transaksi: <span className="font-semibold text-slate-900">{payload[0].payload.transactions}</span>
                                                                </p>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                fill="#0F172A"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={50}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-sm text-slate-500">Tidak ada data untuk rentang waktu ini</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats side */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                            <div className="border-b border-slate-100 p-5">
                                <h3 className="text-sm font-semibold text-slate-700">Rincian Performa</h3>
                            </div>
                            <div className="flex-1 p-5 flex flex-col gap-6">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Rata-rata Transaksi</p>
                                    <p className="text-2xl font-bold text-slate-900">{formatPrice(summary.averageOrder)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Item Terjual</p>
                                    <p className="text-2xl font-bold text-slate-900">{summary.totalItems} <span className="text-sm font-normal text-slate-500 normal-case">item</span></p>
                                </div>

                                <div className="mt-auto">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Tunai</span>
                                        <span className="font-medium text-slate-900">{summary.cashTransactions} TRX</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${summary.totalTransactions ? (summary.cashTransactions / summary.totalTransactions) * 100 : 0}%` }}
                                        ></div>
                                    </div>

                                    <div className="mt-4 mb-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-500">QRIS</span>
                                        <span className="font-medium text-slate-900">{summary.qrisTransactions} TRX</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full bg-purple-500"
                                            style={{ width: `${summary.totalTransactions ? (summary.qrisTransactions / summary.totalTransactions) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Table */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 p-5">
                            <h3 className="text-sm font-semibold text-slate-700">Detail Transaksi</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Tanggal</th>
                                        <th className="px-5 py-3 font-medium">ID Transaksi</th>
                                        <th className="px-5 py-3 font-medium">Kasir</th>
                                        <th className="px-5 py-3 font-medium">Metode</th>
                                        <th className="px-5 py-3 font-medium">Item</th>
                                        <th className="px-5 py-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {sales.length > 0 ? (
                                        sales.map((sale) => (
                                            <tr
                                                key={sale.id}
                                                className="hover:bg-slate-50/50 cursor-pointer"
                                                onClick={() => setSelectedSale(sale)}
                                            >
                                                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                                                    {formatDate(sale.createdAt)}
                                                </td>
                                                <td className="px-5 py-3 text-slate-900 font-medium">
                                                    {sale.id.slice(0, 8)}...
                                                </td>
                                                <td className="px-5 py-3 text-slate-600">
                                                    {sale.cashierName}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sale.paymentMethod === 'CASH'
                                                        ? 'bg-green-100 text-green-700'
                                                        : sale.paymentMethod === 'QRIS'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {sale.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-600">
                                                    {sale.itemCount}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-900">
                                                    {formatPrice(sale.total)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                                                Tidak ada transaksi yang sesuai dengan filter
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sales Detail Modal */}
                    <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                            <DialogHeader>
                                <DialogTitle>Detail Transaksi</DialogTitle>
                                <DialogDescription className="font-mono">
                                    {selectedSale?.id}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="overflow-y-auto">
                                {selectedSale && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                                <p className="text-xs font-medium text-slate-500 mb-1">Tanggal</p>
                                                <p className="text-sm font-semibold text-slate-900">{formatDate(selectedSale.createdAt)}</p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                                <p className="text-xs font-medium text-slate-500 mb-1">Kasir</p>
                                                <p className="text-sm font-semibold text-slate-900">{selectedSale.cashierName}</p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                                <p className="text-xs font-medium text-slate-500 mb-1">Metode</p>
                                                <p className="text-sm font-semibold text-slate-900">{selectedSale.paymentMethod}</p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                                <p className="text-xs font-medium text-slate-500 mb-1">Total Item</p>
                                                <p className="text-sm font-semibold text-slate-900">{selectedSale.itemCount} Item</p>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-900 mb-3">Rincian Produk</h3>
                                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">Produk</th>
                                                        <th className="px-4 py-3 font-medium text-center">Harga</th>
                                                        <th className="px-4 py-3 font-medium text-center">Qty</th>
                                                        <th className="px-5 py-3 font-medium text-right">Margin (%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100/80">
                                                    {selectedSale.items && selectedSale.items.length > 0 ? (
                                                        selectedSale.items.map((item: any, index: number) => (
                                                            <tr key={index} className="hover:bg-slate-50/50">
                                                                <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                                                                <td className="px-4 py-3 text-center text-slate-600">{formatPrice(item.price)}</td>
                                                                <td className="px-4 py-3 text-center font-semibold text-slate-900">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatPrice(item.subtotal)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic">
                                                                Rincian produk tidak tersedia.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-700">Total Belanja:</td>
                                                        <td className="px-4 py-4 text-right font-bold text-slate-900 text-lg">{formatPrice(selectedSale.total)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            ) : activeTab === "PROFIT" && profitReport ? (
                <div className="space-y-6">
                    {/* Profit Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-indigo-100 p-2">
                                    <DollarSign className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Omzet</p>
                                    <p className="text-xl font-bold text-slate-900">{formatPrice(profitReport.totalRevenue)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-orange-100 p-2">
                                    <ShoppingBag className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total HPP</p>
                                    <p className="text-xl font-bold text-slate-900">{formatPrice(profitReport.totalCogs)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-100 p-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Laba Kotor</p>
                                    <p className="text-xl font-bold text-emerald-600">{formatPrice(profitReport.totalProfit)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profit Table */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 p-5">
                            <h3 className="text-sm font-semibold text-slate-700">Rincian Laba per Produk</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Produk</th>
                                        <th className="px-5 py-3 font-medium text-center">Terjual</th>
                                        <th className="px-5 py-3 font-medium text-right">Avg. Harga Jual</th>
                                        <th className="px-5 py-3 font-medium text-right">Avg. HPP</th>
                                        <th className="px-5 py-3 font-medium text-right">Omzet</th>
                                        <th className="px-5 py-3 font-medium text-right">Laba Kotor</th>
                                        <th className="px-5 py-3 font-medium text-right">Margin (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {profitReport.items && profitReport.items.length > 0 ? (
                                        profitReport.items.map((item) => (
                                            <tr key={item.productId} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-3">
                                                    <p className="font-medium text-slate-900">{item.productName}</p>
                                                    <p className="text-xs text-slate-500">{item.categoryName}</p>
                                                </td>
                                                <td className="px-5 py-3 text-center text-slate-700">
                                                    {item.qtySold}
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-700">
                                                    {formatPrice(item.sellingPrice)}
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-700">
                                                    {formatPrice(item.avgCost)}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-900">
                                                    {formatPrice(item.revenue)}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-emerald-600">
                                                    {formatPrice(item.profit)}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${item.profitMargin > 30 ? 'bg-emerald-50 text-emerald-700' :
                                                        item.profitMargin > 15 ? 'bg-blue-50 text-blue-700' :
                                                            item.profitMargin > 0 ? 'bg-amber-50 text-amber-700' :
                                                                'bg-rose-50 text-rose-700'
                                                        }`}>
                                                        {item.profitMargin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                                                Tidak ada data laba/rugi untuk rentang waktu ini
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

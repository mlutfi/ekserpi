"use client"

import React, { useState, useEffect, useCallback } from "react"
import { reportsApi, productsApi, categoriesApi, Product, Category, ReportSummary, SaleDetail, DailyChartPoint } from "@/lib/api"
import { toast } from "sonner"
import {
    BarChart3,
    Calendar,
    CreditCard,
    Download,
    Filter,
    Package,
    Search,
    TrendingUp,
    LineChart,
    ShoppingBag,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Types for Tabs
type TabType = "sales" | "stock"

// Helper to resolve image URL with backend base
const getImageUrl = (url?: string | null) => {
    if (!url) return "";

    // Handle case where database stored malformed URL like "https:/pos..."
    let path = url;
    if (path.startsWith("http")) {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        // Extract path from malformed URL if matching /uploads/
        const match = path.match(/\/uploads\/.*/);
        if (match) {
            path = match[0];
        } else {
            return path;
        }
    }

    // Get base URL from env or fallback
    const imageBase = process.env.NEXT_PUBLIC_IMAGE_URL ||
        (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:4001');

    // Ensure path starts with /
    path = path.startsWith("/") ? path : `/${path}`;
    return `${imageBase}${path}`;
};

export default function PosReportClient() {
    // const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<TabType>("sales")

    // ==========================================
    // SALES REPORT STATE
    // ==========================================
    const [salesSummary, setSalesSummary] = useState<ReportSummary | null>(null)
    const [salesDetail, setSalesDetail] = useState<SaleDetail[]>([])
    const [salesLoading, setSalesLoading] = useState(false)
    const [salesFilter, setSalesFilter] = useState({
        startDate: "",
        endDate: "",
        paymentMethod: "",
    })
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

    // ==========================================
    // STOCK REPORT STATE
    // ==========================================
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [stockLoading, setStockLoading] = useState(false)
    const [stockSearch, setStockSearch] = useState("")
    const [stockCategoryFilter, setStockCategoryFilter] = useState("")

    // ==========================================
    // DATA FETCHING
    // ==========================================

    const fetchSalesReport = useCallback(async () => {
        setSalesLoading(true)
        try {
            const filter = {
                startDate: salesFilter.startDate || undefined,
                endDate: salesFilter.endDate || undefined,
                paymentMethod: salesFilter.paymentMethod || undefined,
            }

            const [summaryData, salesData] = await Promise.all([
                reportsApi.getSummary(filter),
                reportsApi.getSales(filter)
            ])

            setSalesSummary(summaryData)
            setSalesDetail(salesData || [])
        } catch (error) {
            toast.error("Error", {
                description: "Gagal memuat laporan penjualan",
            })
        } finally {
            setSalesLoading(false)
        }
    }, [salesFilter, toast])

    const fetchStockReport = useCallback(async () => {
        setStockLoading(true)
        try {
            const [productsData, categoriesData] = await Promise.all([
                productsApi.getAll(),
                categoriesApi.getAll()
            ])
            setProducts(productsData || [])
            setCategories(categoriesData || [])
        } catch (error) {
            toast.error("Error", {
                description: "Gagal memuat data stok produk",
            })
        } finally {
            setStockLoading(false)
        }
    }, [toast])

    // Initial load
    useEffect(() => {
        if (activeTab === "sales") {
            fetchSalesReport()
        } else if (activeTab === "stock" && products.length === 0) {
            fetchStockReport()
        }
    }, [activeTab, fetchSalesReport, fetchStockReport, products.length])

    // ==========================================
    // ACTIONS & HELPERS
    // ==========================================

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price)
    }

    const handleExportExcel = async () => {
        try {
            const filter = {
                startDate: salesFilter.startDate || undefined,
                endDate: salesFilter.endDate || undefined,
                paymentMethod: salesFilter.paymentMethod || undefined,
            }

            const blob = await reportsApi.exportExcel(filter)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `laporan_penjualan_${salesFilter.startDate || 'all'}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Berhasil", {
                description: "Laporan berhasil diunduh",
            })
        } catch (error) {
            toast.error("Error", {
                description: "Gagal mengunduh laporan",
            })
        }
    }

    // Stock filtering
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
            p.sku?.toLowerCase().includes(stockSearch.toLowerCase()) ||
            p.barcode?.toLowerCase().includes(stockSearch.toLowerCase())
        const matchesCat = stockCategoryFilter ? p.categoryId === stockCategoryFilter : true
        return matchesSearch && matchesCat
    })

    const getStockStatus = (qty: number) => {
        if (qty <= 0) return { label: "Habis", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle }
        if (qty <= 5) return { label: "Low Stock", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle }
        return { label: "Aman", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 }
    }


    // ==========================================
    // RENDER TABS
    // ==========================================

    const renderSalesTab = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-end gap-4 w-full sm:w-auto">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Dari Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="date"
                                value={salesFilter.startDate}
                                onChange={(e) => setSalesFilter({ ...salesFilter, startDate: e.target.value })}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Sampai Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="date"
                                value={salesFilter.endDate}
                                onChange={(e) => setSalesFilter({ ...salesFilter, endDate: e.target.value })}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Metode Bayar</label>
                        <Select
                            value={salesFilter.paymentMethod || "ALL"}
                            onValueChange={(value) => setSalesFilter({ ...salesFilter, paymentMethod: value === "ALL" ? "" : value })}
                        >
                            <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Semua" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="QRIS">QRIS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl transition-colors text-sm font-medium shadow-sm shadow-emerald-200 w-full sm:w-auto justify-center"
                >
                    <Download className="h-4 w-4" />
                    Export Excel
                </button>
            </div>

            {/* Summary Cards */}
            {salesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-28" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pendapatan</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                    {formatPrice(salesSummary?.totalRevenue || 0)}
                                </h3>
                            </div>
                            <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Transaksi</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                    {salesSummary?.totalTransactions || 0}
                                </h3>
                            </div>
                            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Rata-rata Order</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                    {formatPrice(salesSummary?.averageOrder || 0)}
                                </h3>
                            </div>
                            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Item Terjual</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                    {salesSummary?.totalItems || 0}
                                </h3>
                            </div>
                            <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                                <Package className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-slate-500" />
                        Detail Penjualan
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3 font-semibold w-10"></th>
                                <th className="px-5 py-3 font-semibold">Tgl & Waktu</th>
                                <th className="px-5 py-3 font-semibold">ID Transaksi</th>
                                <th className="px-5 py-3 font-semibold">Kasir</th>
                                <th className="px-5 py-3 font-semibold text-center">Item</th>
                                <th className="px-5 py-3 font-semibold">Metode</th>
                                <th className="px-5 py-3 font-semibold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {salesLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
                                            Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : salesDetail.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-50 p-3 rounded-full mb-3">
                                                <ShoppingBag className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Tidak ada data penjualan</p>
                                            <p className="text-slate-400 text-xs mt-1">Ubah filter tanggal atau metode bayar</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                salesDetail.map((sale) => (
                                    <React.Fragment key={sale.id}>
                                        <tr
                                            onClick={() => setExpandedRowId(expandedRowId === sale.id ? null : sale.id)}
                                            className={`transition-colors cursor-pointer ${expandedRowId === sale.id ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <td className="px-5 py-3 text-slate-400">
                                                {expandedRowId === sale.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </td>
                                            <td className="px-5 py-3 font-medium text-slate-700">
                                                {new Date(sale.createdAt).toLocaleString('id-ID', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500 max-w-[120px] truncate" title={sale.id}>
                                                {sale.id.split('-')[0]}...
                                            </td>
                                            <td className="px-5 py-3">{sale.cashierName || '-'}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">
                                                    {sale.itemCount}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${sale.paymentMethod === 'CASH'
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                    }`}>
                                                    {sale.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-bold text-slate-800">
                                                {formatPrice(sale.total)}
                                            </td>
                                        </tr>
                                        {/* Detail Row */}
                                        {expandedRowId === sale.id && (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-4 bg-slate-50/50 border-t-0">
                                                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-slate-100/50 text-slate-500">
                                                                <tr>
                                                                    <th className="px-4 py-2 font-semibold">Produk</th>
                                                                    <th className="px-4 py-2 font-semibold text-center">Harga</th>
                                                                    <th className="px-4 py-2 font-semibold text-center">Qty</th>
                                                                    <th className="px-4 py-2 font-semibold text-right">Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {sale.items?.map((item: any, idx: number) => (
                                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                                        <td className="px-4 py-2 font-medium text-slate-700">{item.productName}</td>
                                                                        <td className="px-4 py-2 text-center text-slate-500">{formatPrice(item.price)}</td>
                                                                        <td className="px-4 py-2 text-center font-medium">{item.quantity}</td>
                                                                        <td className="px-4 py-2 text-right font-medium text-slate-700">{formatPrice(item.subtotal)}</td>
                                                                    </tr>
                                                                ))}
                                                                {(!sale.items || sale.items.length === 0) && (
                                                                    <tr>
                                                                        <td colSpan={4} className="px-4 py-4 text-center text-slate-400 italic">
                                                                            Detail produk tidak tersedia untuk transaksi ini
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const renderStockTab = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, SKU, barcode..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all"
                    />
                </div>

                <div className="relative w-full sm:max-w-xs">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Select
                        value={stockCategoryFilter || "ALL"}
                        onValueChange={(value) => setStockCategoryFilter(value === "ALL" ? "" : value)}
                    >
                        <SelectTrigger className="w-full pl-10 bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Kategori</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stock Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Produk</th>
                                <th className="px-5 py-3 font-semibold text-center">SKU / Barcode</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Stok Tersedia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stockLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
                                            Memuat data stok...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-50 p-3 rounded-full mb-3">
                                                <Package className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Brak data produk ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const status = getStockStatus(product.qtyOnHand || 0)
                                    const StatusIcon = status.icon
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                                                        {product.imageUrl ? (
                                                            <img src={getImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{product.name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{product.category || "Tanpa Kategori"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center text-xs font-mono text-slate-500">
                                                {product.sku || product.barcode || "-"}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`font-bold text-lg ${product.qtyOnHand && product.qtyOnHand <= 5 ? "text-red-500" : "text-slate-700"}`}>
                                                    {product.qtyOnHand || 0}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Laporan</h1>
                <p className="text-sm text-slate-500 mt-1">Pantau performa penjualan dan stok produk</p>
            </div>

            {/* Tabs Custom UI */}
            <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-2xl w-fit mb-6">
                <button
                    onClick={() => setActiveTab("sales")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "sales"
                        ? "bg-white text-amber-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }`}
                >
                    <BarChart3 className="h-4 w-4" />
                    Penjualan
                </button>
                <button
                    onClick={() => setActiveTab("stock")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "stock"
                        ? "bg-white text-amber-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }`}
                >
                    <Package className="h-4 w-4" />
                    Stok Produk
                </button>
            </div>

            {activeTab === "sales" ? renderSalesTab() : renderStockTab()}
        </div>
    )
}

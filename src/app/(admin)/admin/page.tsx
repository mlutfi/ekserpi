"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { salesApi, productsApi, categoriesApi, reportsApi, type TopProduct } from "@/lib/api"
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Trophy,
  RefreshCw,
} from "lucide-react"

// Helper to resolve image URL with backend base (same as products page)
const getImageUrl = (url?: string | null) => {
  if (!url) return ""
  let path = url
  if (path.startsWith("http")) {
    if (path.startsWith("http://") || path.startsWith("https://")) return path
    const match = path.match(/\/uploads\/.*/)
    if (match) path = match[0]
    else return path
  }
  const imageBase = process.env.NEXT_PUBLIC_IMAGE_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:4001')
  path = path.startsWith("/") ? path : `/${path}`
  return `${imageBase}${path}`
}

interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalProducts: number
  totalCategories: number
  cashSales: number
  qrisSales: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    totalCategories: 0,
    cashSales: 0,
    qrisSales: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const pathname = usePathname()

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [report, products, categories, topProds] = await Promise.all([
        salesApi.getDailyReport(),
        productsApi.getAll(),
        categoriesApi.getAll(),
        reportsApi.getTopProducts(10),
      ])

      console.log("DASHBOARD DATA:", { report, products, categories });

      setStats({
        totalRevenue: report.totalRevenue,
        totalSales: report.totalSales,
        totalProducts: (products ?? []).length,
        totalCategories: (categories ?? []).length,
        cashSales: report.cashSales,
        qrisSales: report.qrisSales,
      })
      setTopProducts(topProds)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (pathname === '/admin') {
      fetchStats()
    }
  }, [pathname, fetchStats])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const statCards = [
    {
      title: "Pendapatan Hari Ini",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
      color: "bg-green-500",
    },
    {
      title: "Transaksi Hari Ini",
      value: stats.totalSales.toString(),
      icon: ShoppingBag,
      trend: "+8.2%",
      trendUp: true,
      color: "bg-blue-500",
    },
    {
      title: "Total Produk",
      value: stats.totalProducts.toString(),
      icon: Package,
      trend: null,
      trendUp: true,
      color: "bg-purple-500",
    },
    {
      title: "Total Kategori",
      value: stats.totalCategories.toString(),
      icon: Users,
      trend: null,
      trendUp: true,
      color: "bg-amber-500",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Ringkasan aktivitas bisnis Anda hari ini
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Memperbarui..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {stat.trend && (
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {stat.trendUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Methods */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Metode Pembayaran Hari Ini
          </h2>
          <p className="text-sm text-slate-500">
            Distribusi berdasarkan metode pembayaran
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-slate-700">Tunai</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {stats.cashSales} transaksi
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm text-slate-700">QRIS</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {stats.qrisSales} transaksi
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="bg-green-500 transition-all"
              style={{
                width: `${stats.totalSales > 0
                  ? (stats.cashSales / stats.totalSales) * 100
                  : 0
                  }%`,
              }}
            />
            <div
              className="bg-purple-500 transition-all"
              style={{
                width: `${stats.totalSales > 0
                  ? (stats.qrisSales / stats.totalSales) * 100
                  : 0
                  }%`,
              }}
            />
          </div>
        </div>

        {/* Top 10 Produk Terlaris */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Top 10 Produk Terlaris</h2>
          </div>
          <p className="text-sm text-slate-500">Produk dengan penjualan terbanyak</p>

          <div className="mt-4 space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada data penjualan</p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                    }`}>
                    {index + 1}
                  </span>
                  {product.imageUrl ? (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.productName}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{product.productName}</p>
                    <p className="text-xs text-slate-500">{product.totalQty} terjual</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 shrink-0">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.totalSales)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
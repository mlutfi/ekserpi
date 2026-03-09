"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { salesApi, productsApi, categoriesApi, reportsApi, type TopProduct } from "@/lib/api"
import { PageLoading } from "@/components/ui/page-loading"
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
      color: "bg-zinc-100/50 border-zinc-200 text-zinc-900",
      iconColor: "text-zinc-600",
    },
    {
      title: "Transaksi Hari Ini",
      value: stats.totalSales.toString(),
      icon: ShoppingBag,
      trend: "+8.2%",
      trendUp: true,
      color: "bg-zinc-100/50 border-zinc-200 text-zinc-900",
      iconColor: "text-zinc-600",
    },
    {
      title: "Total Produk",
      value: stats.totalProducts.toString(),
      icon: Package,
      trend: null,
      trendUp: true,
      color: "bg-zinc-100/50 border-zinc-200 text-zinc-900",
      iconColor: "text-zinc-600",
    },
    {
      title: "Total Kategori",
      value: stats.totalCategories.toString(),
      icon: Users,
      trend: null,
      trendUp: true,
      color: "bg-zinc-100/50 border-zinc-200 text-zinc-900",
      iconColor: "text-zinc-600",
    },
  ]

  if (loading) {
    return <PageLoading />
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
          className="flex items-center gap-2 rounded-md bg-white border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 shadow-sm disabled:opacity-50"
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
              className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-md p-2 border ${stat.color}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
                {stat.trend && (
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? "text-zinc-600" : "text-zinc-500"
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
                <p className="text-2xl font-semibold text-zinc-900">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Methods */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-zinc-900">
            Metode Pembayaran Hari Ini
          </h2>
          <p className="text-sm text-zinc-500">
            Distribusi berdasarkan metode pembayaran
          </p>

          <div className="mt-6 flex-1 flex flex-col justify-center space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-sm bg-zinc-900" />
                <span className="text-sm font-medium text-zinc-700">Tunai</span>
              </div>
              <span className="text-sm text-zinc-500">
                {stats.cashSales} transaksi
              </span>
            </div>
            <div className="border-t border-zinc-100" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-sm bg-zinc-400" />
                <span className="text-sm font-medium text-zinc-700">QRIS</span>
              </div>
              <span className="text-sm text-zinc-500">
                {stats.qrisSales} transaksi
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8 flex h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="bg-zinc-900 transition-all"
              style={{
                width: `${stats.totalSales > 0
                  ? (stats.cashSales / stats.totalSales) * 100
                  : 0
                  }%`,
              }}
            />
            <div
              className="bg-zinc-400 transition-all"
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
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-zinc-900" />
            <h2 className="text-base font-semibold text-zinc-900">Top 10 Produk Terlaris</h2>
          </div>
          <p className="text-sm text-zinc-500">Produk dengan penjualan terbanyak</p>

          <div className="mt-4 space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">Belum ada data penjualan</p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 rounded-md border border-zinc-100 p-2 transition hover:bg-zinc-50/50"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-xs font-semibold ${index === 0 ? 'bg-zinc-900 text-white' : index === 1 ? 'bg-zinc-200 text-zinc-900' : index === 2 ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-50 text-zinc-500'
                    }`}>
                    {index + 1}
                  </span>
                  {product.imageUrl ? (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.productName}
                      className="h-9 w-9 shrink-0 rounded-md object-cover border border-zinc-200"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-50 border border-zinc-100">
                      <Package className="h-4 w-4 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{product.productName}</p>
                    <p className="text-xs text-zinc-500">{product.totalQty} terjual</p>
                  </div>
                  <span className="text-sm font-medium text-zinc-900 shrink-0">
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

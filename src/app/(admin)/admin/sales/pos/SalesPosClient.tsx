"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sale, salesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { BarChart3, CreditCard, ExternalLink, RefreshCw, ShoppingCart, Wallet } from "lucide-react"

interface DailySummary {
  totalSales: number
  totalRevenue: number
  cashSales: number
  qrisSales: number
}

export default function SalesPosClient() {
  const [loading, setLoading] = useState(true)
  const [daily, setDaily] = useState<DailySummary>({
    totalSales: 0,
    totalRevenue: 0,
    cashSales: 0,
    qrisSales: 0,
  })
  const [pendingOrders, setPendingOrders] = useState(0)

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [dailyReport, pendingSales] = await Promise.all([
        salesApi.getDailyReport(),
        salesApi.getAll("PENDING"),
      ])

      const todayDate = new Date().toISOString().slice(0, 10)
      const todayPending = (pendingSales ?? []).filter((sale: Sale) => sale.createdAt.slice(0, 10) === todayDate)

      setDaily({
        totalSales: dailyReport.totalSales || 0,
        totalRevenue: dailyReport.totalRevenue || 0,
        cashSales: dailyReport.cashSales || 0,
        qrisSales: dailyReport.qrisSales || 0,
      })
      setPendingOrders(todayPending.length)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">POS</h1>
          <p className="text-sm text-zinc-500">Akses kasir, monitoring transaksi, dan pengaturan POS</p>
        </div>
        <Button variant="outline" onClick={() => void fetchData()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Transaksi Hari Ini</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{daily.totalSales}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Revenue Hari Ini</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            Rp {daily.totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Pembayaran Cash/QRIS</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {daily.cashSales} / {daily.qrisSales}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Pending Order Hari Ini</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{pendingOrders}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Operasional Kasir</h2>
          <p className="mt-1 text-sm text-zinc-500">Buka terminal POS untuk transaksi langsung</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/pos">
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buka POS
              </Button>
            </Link>
            <Link href="/pos/report">
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                POS Report
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Konfigurasi & Sales Flow</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola metode pembayaran dan follow up order yang belum dibayar
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/settings/pos">
              <Button variant="outline">
                <Wallet className="mr-2 h-4 w-4" />
                POS Settings
              </Button>
            </Link>
            <Link href="/admin/sales/sales-orders">
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Sales Orders
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Laporan Penjualan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

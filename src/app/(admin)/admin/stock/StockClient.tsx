'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, PackageMinus, ArrowDown, ArrowUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    stockApi,
    productsApi,
    StockIn,
    StockOut,
    Inventory,
    Product
} from '@/lib/api'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type TabType = 'INVENTORY' | 'STOCK_IN' | 'STOCK_OUT'

export default function StockManagementPage() {
    const [activeTab, setActiveTab] = useState<TabType>('INVENTORY')

    // Data
    const [inventory, setInventory] = useState<Inventory[]>([])
    const [stockIns, setStockIns] = useState<StockIn[]>([])
    const [stockOuts, setStockOuts] = useState<StockOut[]>([])
    const [products, setProducts] = useState<Product[]>([])

    // UI State
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [activeTab])

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            if (products.length === 0) {
                const prods = await productsApi.getAll()
                setProducts(prods.filter(p => p.isActive))
            }

            if (activeTab === 'INVENTORY') {
                const inv = await stockApi.getInventory()
                setInventory(inv)
            } else if (activeTab === 'STOCK_IN') {
                const res = await stockApi.getStockIns(1, 50)
                setStockIns(res.data)
            } else if (activeTab === 'STOCK_OUT') {
                const res = await stockApi.getStockOuts(1, 50)
                setStockOuts(res.data)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal mengambil data')
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Manajemen Stok</h1>
                    <p className="text-zinc-500 mt-1">Kelola stok masuk, stok keluar, dan inventori produk</p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-50 text-red-600 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-lg bg-green-50 text-green-600 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <p>{success}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex px-1 space-x-1 bg-zinc-100/50 p-1 rounded-md w-fit">
                <button
                    onClick={() => setActiveTab('INVENTORY')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'INVENTORY'
                        ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                        }`}
                >
                    <Package className="w-4 h-4" />
                    Inventaris Saat Ini
                </button>
                <button
                    onClick={() => setActiveTab('STOCK_IN')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'STOCK_IN'
                        ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                        }`}
                >
                    <ArrowDown className="w-4 h-4" />
                    Stok Masuk
                </button>
                <button
                    onClick={() => setActiveTab('STOCK_OUT')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'STOCK_OUT'
                        ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                        }`}
                >
                    <ArrowUp className="w-4 h-4" />
                    Stok Keluar
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="p-8 flex justify-center items-center h-[400px]">
                        <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* INVENTORY TAB */}
                        {activeTab === 'INVENTORY' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-500">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">Lokasi</th>
                                            <th className="px-5 py-4 font-medium">SKU / Code</th>
                                            <th className="px-5 py-4 font-medium">Nama Produk</th>
                                            <th className="px-5 py-4 font-medium">Kategori</th>
                                            <th className="px-5 py-4 font-medium">Batch</th>
                                            <th className="px-5 py-4 font-medium">Kedaluwarsa</th>
                                            <th className="px-5 py-4 font-medium text-right">HPP</th>
                                            <th className="px-5 py-4 font-medium text-center">Qty</th>
                                            <th className="px-5 py-4 font-medium text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {inventory.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                                                    Data inventaris kosong
                                                </td>
                                            </tr>
                                        ) : (
                                            inventory.map((item, idx) => (
                                                <tr key={`${item.productId}-${item.locationId}-${idx}`} className="hover:bg-zinc-50/50">
                                                    <td className="px-5 py-4 whitespace-nowrap text-zinc-600">{item.locationName || '-'}</td>
                                                    <td className="px-5 py-4 text-zinc-600 font-mono text-xs">{item.sku || '-'}</td>
                                                    <td className="px-5 py-4 font-medium text-zinc-900">{item.productName}</td>
                                                    <td className="px-5 py-4 text-zinc-600">{item.category || '-'}</td>
                                                    <td className="px-5 py-4 text-zinc-600 text-xs">{item.batchNumber || '-'}</td>
                                                    <td className="px-5 py-4 text-zinc-600 text-sm">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('id-ID') : '-'}</td>
                                                    <td className="px-5 py-4 text-right text-zinc-900 font-medium">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.avgCost || 0)}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="font-semibold text-zinc-900">{item.qtyOnHand}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        {item.qtyOnHand <= 5 ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md border border-red-200 bg-red-50 text-[10px] font-semibold tracking-wide uppercase text-red-600">
                                                                Rendah
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md border border-zinc-200 bg-white text-[10px] font-semibold tracking-wide uppercase text-zinc-700">
                                                                Aman
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* STOCK IN TAB */}
                        {activeTab === 'STOCK_IN' && (
                            <div>
                                {/* History */}
                                <div>
                                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Riwayat Terakhir</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-50/50 text-zinc-500">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Tanggal</th>
                                                    <th className="px-6 py-3 font-medium">Produk</th>
                                                    <th className="px-6 py-3 font-medium">Qty</th>
                                                    <th className="px-6 py-3 font-medium">Modal</th>
                                                    <th className="px-6 py-3 font-medium">Oleh</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {stockIns.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                                            Belum ada riwayat stok masuk
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stockIns.map((item) => (
                                                        <tr key={item.id} className="hover:bg-zinc-50/50">
                                                            <td className="px-6 py-3 text-zinc-500">{item.createdAt.split(' ')[0]}</td>
                                                            <td className="px-6 py-3 font-medium text-zinc-900">
                                                                {item.productName}
                                                                {item.note && <p className="text-xs text-zinc-400 font-normal mt-0.5">{item.note}</p>}
                                                            </td>
                                                            <td className="px-6 py-3 text-zinc-900 font-semibold">+{item.qty}</td>
                                                            <td className="px-6 py-3 text-zinc-600">Rp {item.costPerUnit.toLocaleString('id-ID')}</td>
                                                            <td className="px-6 py-3 text-zinc-600">{item.createdBy}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STOCK OUT TAB */}
                        {activeTab === 'STOCK_OUT' && (
                            <div>
                                {/* History */}
                                <div>
                                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Riwayat Terakhir</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-50/50 text-zinc-500">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Tanggal</th>
                                                    <th className="px-6 py-3 font-medium">Produk</th>
                                                    <th className="px-6 py-3 font-medium">Qty</th>
                                                    <th className="px-6 py-3 font-medium">Alasan</th>
                                                    <th className="px-6 py-3 font-medium">Oleh</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {stockOuts.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                                            Belum ada riwayat stok keluar (di luar nota penjualan)
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stockOuts.map((item) => (
                                                        <tr key={item.id} className="hover:bg-zinc-50/50">
                                                            <td className="px-6 py-3 text-zinc-500">{item.createdAt.split(' ')[0]}</td>
                                                            <td className="px-6 py-3 font-medium text-zinc-900">
                                                                {item.productName}
                                                                {item.note && <p className="text-xs text-zinc-400 font-normal mt-0.5">{item.note}</p>}
                                                            </td>
                                                            <td className="px-6 py-3 text-zinc-900 font-semibold">-{item.qty}</td>
                                                            <td className="px-6 py-3">
                                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase border bg-white text-zinc-700 border-zinc-200`}>
                                                                    {item.reason}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-zinc-600">{item.createdBy}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

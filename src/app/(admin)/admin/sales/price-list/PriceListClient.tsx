"use client"

import { useEffect, useMemo, useState } from "react"
import { categoriesApi, Category, Product, productsApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RefreshCw, Save, Search, Tag } from "lucide-react"

export default function PriceListClient() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [bulkPercentage, setBulkPercentage] = useState("")
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [productData, categoryData] = await Promise.all([productsApi.getAll(), categoriesApi.getAll()])
      setProducts((productData ?? []).filter((item) => item.isActive))
      setCategories(categoryData ?? [])
    } catch (_error) {
      toast.error("Gagal memuat data price list")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim()
    return products.filter((product) => {
      const hitName = product.name.toLowerCase().includes(needle)
      const hitSku = product.sku?.toLowerCase().includes(needle)
      const categoryMatch = categoryFilter === "ALL" ? true : product.categoryId === categoryFilter
      return (needle ? hitName || !!hitSku : true) && categoryMatch
    })
  }, [products, searchQuery, categoryFilter])

  function getPriceForEdit(product: Product): number {
    if (typeof editedPrices[product.id] === "number") {
      return editedPrices[product.id]
    }
    return product.price
  }

  function handlePriceChange(productId: string, value: string) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      setEditedPrices((prev) => ({ ...prev, [productId]: 0 }))
      return
    }
    setEditedPrices((prev) => ({ ...prev, [productId]: parsed }))
  }

  async function saveSinglePrice(product: Product) {
    const nextPrice = getPriceForEdit(product)
    if (nextPrice <= 0) {
      toast.error("Harga harus lebih dari 0")
      return
    }
    if (nextPrice === product.price) return

    setSaving(true)
    try {
      await productsApi.update(product.id, { price: nextPrice })
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, price: nextPrice } : item)))
      setEditedPrices((prev) => {
        const copy = { ...prev }
        delete copy[product.id]
        return copy
      })
      toast.success(`Harga ${product.name} diperbarui`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan harga")
    } finally {
      setSaving(false)
    }
  }

  async function applyBulkAdjustment() {
    const pct = Number.parseFloat(bulkPercentage)
    if (Number.isNaN(pct)) {
      toast.error("Isi persentase valid, contoh 5 atau -3")
      return
    }
    if (filteredProducts.length === 0) {
      toast.error("Tidak ada produk pada filter saat ini")
      return
    }

    const confirmed = confirm(
      `Terapkan ${pct}% ke ${filteredProducts.length} produk sesuai filter saat ini?`
    )
    if (!confirmed) return

    setSaving(true)
    try {
      for (const product of filteredProducts) {
        const calculated = Math.round(product.price * (1 + pct / 100))
        const nextPrice = Math.max(1, calculated)
        await productsApi.update(product.id, { price: nextPrice })
      }

      await fetchData()
      setBulkPercentage("")
      setEditedPrices({})
      toast.success("Bulk update price list berhasil")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal update harga massal")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Price List</h1>
          <p className="text-sm text-zinc-500">Kelola daftar harga jual untuk semua produk</p>
        </div>
        <Button variant="outline" onClick={() => void fetchData()} disabled={saving}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500">Cari Produk</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama produk atau SKU..."
                className="w-full rounded-md border py-2 pl-10 pr-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border p-2 text-sm"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Bulk Adjust (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={bulkPercentage}
                onChange={(e) => setBulkPercentage(e.target.value)}
                placeholder="Contoh 5 / -3"
                className="w-full rounded-md border p-2 text-sm"
              />
              <Button onClick={applyBulkAdjustment} disabled={saving} className="shrink-0">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-zinc-50 p-4">
          <h3 className="font-semibold text-zinc-900">
            Daftar Harga Produk ({filteredProducts.length} item)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">HPP</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => {
                const currentPrice = getPriceForEdit(product)
                const cost = product.cost || 0
                const marginPct = currentPrice > 0 ? ((currentPrice - cost) / currentPrice) * 100 : 0
                const hasChanges = currentPrice !== product.price

                return (
                  <tr key={product.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{product.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{product.sku || "-"}</td>
                    <td className="px-4 py-3 text-zinc-500">{product.category || "-"}</td>
                    <td className="px-4 py-3 text-right text-zinc-700">
                      Rp {cost.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="1"
                        value={currentPrice}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        className="w-32 rounded-md border p-1.5 text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          marginPct >= 25
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : marginPct >= 10
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={hasChanges ? "default" : "outline"}
                        disabled={saving || !hasChanges}
                        onClick={() => void saveSinglePrice(product)}
                      >
                        <Save className="mr-1 h-3.5 w-3.5" />
                        Simpan
                      </Button>
                    </td>
                  </tr>
                )
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                    Tidak ada produk pada filter saat ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

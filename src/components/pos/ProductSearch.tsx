"use client"

import { useState, useEffect, useCallback } from "react"
import { productsApi, Product } from "@/lib/api"
import { Search, Package, Plus, AlertCircle, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProductSearchProps {
  onSelect: (product: Product) => void
  categoryId?: string | null
}

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

export function ProductSearch({ onSelect, categoryId }: ProductSearchProps) {
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data: Product[]
      if (debouncedQuery.length >= 2) {
        data = await productsApi.search(debouncedQuery)
      } else if (categoryId) {
        data = await productsApi.getByCategory(categoryId)
      } else {
        data = await productsApi.getAll()
      }
      setProducts((data ?? []).filter(p => p.isActive))
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat produk")
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, categoryId])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search Bar */}
      <div className="relative group shrink-0">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-900" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100/50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-300 hover:text-zinc-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 pr-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-3 animate-pulse">
                <div className="aspect-square rounded-xl bg-zinc-100" />
                <div className="mt-3 h-3.5 rounded-lg bg-zinc-100" />
                <div className="mt-2 h-3 w-2/3 rounded-lg bg-zinc-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 mb-3 border border-red-100">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 mb-3 border border-zinc-200">
              <Package className="h-7 w-7 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">Tidak ada produk</p>
            <p className="mt-1 text-xs text-zinc-400">Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 pr-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className="group relative rounded-2xl border border-zinc-200 bg-white p-3 text-left transition-all duration-200 hover:border-zinc-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-50 border border-zinc-100">
                  {product.imageUrl ? (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-50">
                      <Package className="h-8 w-8 text-zinc-300 transition-all group-hover:text-zinc-400" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-xl">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm">
                      <Plus className="h-4 w-4 text-zinc-900" />
                    </div>
                  </div>
                  {/* Low stock badge */}
                  {product.qtyOnHand !== undefined && product.qtyOnHand <= 5 && (
                    <div className="absolute left-2 top-2 rounded-full border border-red-200 bg-red-50 px-2 py-0.5">
                      <span className="text-[9px] font-bold text-red-600">Stok: {product.qtyOnHand}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="truncate text-sm font-semibold text-zinc-900 leading-tight">
                    {product.name}
                  </h3>
                  {product.category && (
                    <p className="mt-0.5 truncate text-[10px] text-zinc-500">{product.category}</p>
                  )}
                  <p className="mt-1.5 text-xs font-bold text-zinc-900">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { categoriesApi, Category } from "@/lib/api"
import { Loader2, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductCategoriesProps {
  activeCategory: string | null
  onSelect: (categoryId: string | null) => void
}

export function ProductCategories({ activeCategory, onSelect }: ProductCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await categoriesApi.getAll()
        setCategories(data ?? [])
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        <span className="text-xs text-slate-400">Memuat kategori...</span>
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
          activeCategory === null
            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
        )}
      >
        <LayoutGrid className="h-3 w-3" />
        Semua
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            "flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
            activeCategory === category.id
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
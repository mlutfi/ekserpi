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
        <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
        <span className="text-xs text-zinc-500">Memuat kategori...</span>
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
          activeCategory === null
            ? "bg-zinc-900 text-white shadow-sm shadow-zinc-400/20"
            : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
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
            "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
            activeCategory === category.id
              ? "bg-zinc-900 text-white shadow-sm shadow-zinc-400/20"
              : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
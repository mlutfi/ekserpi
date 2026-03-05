"use client"

import { useMemo } from "react"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CartItem {
  productId: string
  name: string
  price: number
  qty: number
}

interface CartProps {
  items: CartItem[]
  total: number
  onSetQty: (productId: string, qty: number) => void
  onRemove: (productId: string) => void
}

export function Cart({ items, total, onSetQty, onRemove }: CartProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <ShoppingBag className="h-7 w-7 text-slate-300" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-400">Keranjang kosong</p>
        <p className="mt-1 text-xs text-slate-300">Pilih produk untuk menambahkan</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Items — ScrollArea */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {items.map((item) => (
            <div
              key={item.productId}
              className="group flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
            >
              {/* Color dot */}
              <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-700">{item.name}</p>
                <p className="text-[11px] text-slate-400">{formatPrice(item.price)}</p>
              </div>

              {/* Qty Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onSetQty(item.productId, item.qty - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:text-slate-600 active:scale-90"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="w-7 text-center text-sm font-bold text-slate-700">{item.qty}</span>
                <button
                  onClick={() => onSetQty(item.productId, item.qty + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-90"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Subtotal */}
              <p className="min-w-[68px] text-right text-[13px] font-bold text-slate-800 shrink-0">
                {formatPrice(item.price * item.qty)}
              </p>

              {/* Remove */}
              <button
                onClick={() => onRemove(item.productId)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-all hover:bg-red-50 hover:text-red-400 active:scale-90"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Total */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Total Item</span>
          <span className="font-semibold text-slate-600">{totalItems} item</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Total</span>
          <span className="text-xl font-extrabold text-emerald-600">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
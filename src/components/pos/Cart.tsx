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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200">
          <ShoppingBag className="h-7 w-7 text-zinc-300" />
        </div>
        <p className="mt-3 text-sm font-medium text-zinc-500">Keranjang kosong</p>
        <p className="mt-1 text-xs text-zinc-400">Pilih produk untuk menambahkan</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Items — ScrollArea */}
      <ScrollArea className="flex-1 -mx-4 group">
        <div className="px-4 space-y-2 pb-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="group/item flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3 transition-all hover:border-zinc-200 hover:shadow-sm"
            >
              {/* Index or dot */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-[10px] font-bold text-zinc-400 group-hover/item:bg-zinc-900 group-hover/item:text-white transition-colors">
                {items.indexOf(item) + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-semibold text-zinc-900">{item.name}</p>
                <p className="text-[11px] text-zinc-500">{formatPrice(item.price)}</p>
              </div>

              {/* Qty Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onSetQty(item.productId, item.qty - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-white text-zinc-400 transition-all hover:border-zinc-200 hover:text-zinc-900 active:scale-90"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="w-7 text-center text-sm font-bold text-zinc-900">{item.qty}</span>
                <button
                  onClick={() => onSetQty(item.productId, item.qty + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-white text-zinc-400 transition-all hover:border-zinc-200 hover:text-zinc-900 active:scale-90"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Subtotal */}
              <p className="min-w-[68px] text-right text-[13px] font-bold text-zinc-900 shrink-0">
                {formatPrice(item.price * item.qty)}
              </p>

              {/* Remove */}
              <button
                onClick={() => onRemove(item.productId)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 opacity-0 group-hover/item:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Total */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/30 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          <span>Ringkasan Pesanan</span>
          <span>{totalItems} item</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-500">Subtotal</span>
          <span className="text-xl font-bold text-zinc-900">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
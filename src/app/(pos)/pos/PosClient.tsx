"use client"

import { useState, useMemo, useEffect } from "react"
import { ProductSearch } from "@/components/pos/ProductSearch"
import { Cart } from "@/components/pos/Cart"
import { PaymentPanel } from "@/components/pos/PaymentPanel"
import { ProductCategories } from "@/components/pos/ProductCategories"
import { Product, Sale } from "@/lib/api"
import { ShoppingCart, X, CreditCard, Package, User, Wallet } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CartItem {
  productId: string
  name: string
  price: number
  qty: number
}

export default function PosClient() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [sale, setSale] = useState<Sale | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ekserpi_pos_cart")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.cartItems) setCartItems(parsed.cartItems)
        if (parsed.customerName) setCustomerName(parsed.customerName)
        if (parsed.sale) setSale(parsed.sale)
      } catch (e) {
        console.error("Failed to parse local cart:", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ekserpi_pos_cart", JSON.stringify({ cartItems, customerName, sale }))
    }
  }, [cartItems, customerName, sale, isLoaded])

  function addToCart(product: Product) {
    setCartItems((prev) => {
      const existing = prev.find((it) => it.productId === product.id)
      if (existing) {
        return prev.map((it) =>
          it.productId === product.id ? { ...it, qty: it.qty + 1 } : it
        )
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  function setQty(productId: string, qty: number) {
    setCartItems((prev) =>
      prev.map((it) => it.productId === productId ? { ...it, qty: Math.max(1, qty) } : it)
        .filter((it) => it.qty > 0)
    )
  }

  function removeItem(productId: string) {
    setCartItems((prev) => prev.filter((it) => it.productId !== productId))
  }

  function clearCart() {
    setCartItems([])
    setSale(null)
    setCustomerName("")
    setMobileCartOpen(false)
    localStorage.removeItem("ekserpi_pos_cart")
  }

  const total = useMemo(() => cartItems.reduce((sum, it) => sum + it.price * it.qty, 0), [cartItems])
  const totalItems = useMemo(() => cartItems.reduce((sum, it) => sum + it.qty, 0), [cartItems])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)

  function refreshProducts() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-5 grid grid-cols-12 gap-5 h-[calc(100vh-56px)]">

        {/* ── Left: Catalog ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
          <div className="flex flex-col flex-1 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* Catalog Header */}
            <div className="shrink-0 px-5 pt-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                    <Package className="h-4 w-4 text-zinc-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">Katalog Produk</h2>
                    <p className="text-[10px] text-zinc-500">Pilih kategori atau cari produk</p>
                  </div>
                </div>
              </div>
              <ProductCategories activeCategory={selectedCategory} onSelect={setSelectedCategory} />
            </div>

            {/* Product Grid — scrollable */}
            <div className="flex-1 overflow-hidden px-5 py-4">
              <ProductSearch onSelect={addToCart} categoryId={selectedCategory} key={refreshKey} />
            </div>
          </div>
        </div>

        {/* ── Right: Cart (Desktop) ── */}
        <div className="hidden lg:flex col-span-4 flex-col gap-4 min-h-0">

          {/* Cart Card */}
          <div className="flex flex-col flex-1 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden min-h-0">
            <div className="shrink-0 px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <ShoppingCart className="h-4 w-4 text-zinc-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Keranjang</h2>
                  <p className="text-[10px] text-zinc-500">{totalItems} item dipilih</p>
                </div>
              </div>
              {totalItems > 0 && (
                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-zinc-900 px-2 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-3 space-y-3">
                {/* Customer Name */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Nama customer (opsional)"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100/50"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <Cart items={cartItems} total={total} onSetQty={setQty} onRemove={removeItem} />
              </div>
            </ScrollArea>

            {/* Pay Button Desktop */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={cartItems.length === 0}
                className="w-full h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 flex items-center justify-center gap-2 group transition-all"
              >
                <div className="flex flex-col items-start mr-auto">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider group-disabled:text-zinc-500">Total Pembayaran</span>
                  <span className="text-sm font-bold">{formatPrice(total)}</span>
                </div>
                <Wallet className="h-5 w-5" />
                <span className="font-bold">Bayar Sekarang</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Modal (Dialog) ── */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden bg-white border-zinc-200 shadow-2xl rounded-2xl">
          <DialogHeader className="px-4 py-3 border-b border-zinc-100 flex flex-row items-center gap-2.5 space-y-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
              <CreditCard className="h-4 w-4 text-zinc-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-zinc-900">Pembayaran</DialogTitle>
              <p className="text-[10px] text-zinc-500">Pilih metode pembayaran</p>
            </div>
          </DialogHeader>
          <div className="p-4">
            <PaymentPanel
              cartItems={cartItems}
              total={total}
              sale={sale}
              setSale={setSale}
              onClear={() => {
                clearCart()
                setIsPaymentModalOpen(false)
              }}
              onPaidSuccess={() => {
                refreshProducts()
                // Keep modal open if success screen is handled inside PaymentPanel, 
                // but PaymentPanel might close itself or we might need state sync.
                // Based on PaymentPanel.tsx, it shows a success overlay.
              }}
              customerName={customerName}
            />
          </div>
        </DialogContent>
      </Dialog>


      {/* ── Mobile Floating Cart Button ── */}
      {!mobileCartOpen && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 z-40 lg:hidden flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3 shadow-xl shadow-zinc-200/60 transition-all hover:bg-zinc-800 active:scale-95"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-white" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-extrabold text-zinc-900">
                {totalItems}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Keranjang</p>
            <p className="text-sm font-bold text-white">{formatPrice(total)}</p>
          </div>
        </button>
      )}

      {/* ── Mobile Cart Bottom Sheet ── */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-3xl bg-white overflow-y-auto shadow-2xl">
            <div className="sticky top-0 flex justify-center pt-3 pb-2 bg-white">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>

            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <ShoppingCart className="h-4 w-4 text-zinc-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Keranjang</h2>
                  <p className="text-[10px] text-zinc-500">{totalItems} item · {formatPrice(total)}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 pb-8 space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Nama customer (opsional)"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100/50"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <Cart items={cartItems} total={total} onSetQty={setQty} onRemove={removeItem} />

              {/* Payment Trigger Mobile */}
              <div className="pt-4 sticky bottom-0 bg-white mt-auto">
                <Button
                  onClick={() => {
                    setMobileCartOpen(false)
                    setIsPaymentModalOpen(true)
                  }}
                  disabled={cartItems.length === 0}
                  className="w-full h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 flex items-center justify-center gap-3 shadow-xl"
                >
                  <div className="flex flex-col items-start mr-auto">
                    <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Total</span>
                    <span className="text-base font-bold">{formatPrice(total)}</span>
                  </div>
                  <Wallet className="h-5 w-5" />
                  <span className="font-extrabold">BAYAR</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
"use client"

import { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Printer, X, Store, Receipt } from "lucide-react"

interface ReceiptItem {
  name: string
  qty: number
  price: number
  subtotal: number
}

interface ReceiptData {
  saleId: string
  items: ReceiptItem[]
  total: number
  cashAmount: number
  change: number
  paymentMethod: "cash" | "qris"
  cashierName: string
  customerName: string
  createdAt: string
}

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  data: ReceiptData
}

export function ReceiptModal({ open, onClose, data }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const shortId = data.saleId.slice(0, 8).toUpperCase()

  const handlePrint = () => {
    if (!receiptRef.current) return

    const receiptContent = receiptRef.current.innerHTML

    // Open in a new tab to avoid aggressive popup blockers
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Gagal membuka tab baru. Harap izinkan pop-ups untuk website ini.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>Struk Pembayaran</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: #000;
              background: #fff;
              width: 80mm;
              margin: 0 auto;
              padding: 8px 4px;
            }
            @media print {
              body { width: 80mm; margin: 0; padding: 4px; }
            }
            /* Force black text, white background — no Tailwind colors */
            * { background: #fff !important; color: #000 !important;
                box-shadow: none !important; border-color: #888 !important; }
            .text-center { text-align: center; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-bold, .font-extrabold, .font-semibold { font-weight: bold; }
            .border-b-2 { border-bottom: 2px dashed #555; }
            .border-b { border-bottom: 1px dashed #555; }
            .border-t { border-top: 1px dashed #555; }
            .pb-4 { padding-bottom: 10px; }
            .mb-4 { margin-bottom: 10px; }
            .pb-3 { padding-bottom: 8px; }
            .mb-3 { margin-bottom: 8px; }
            .pt-4 { padding-top: 10px; }
            .mt-4 { margin-top: 10px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 6px; }
            .pb-2 { padding-bottom: 6px; }
            .mb-2 { margin-bottom: 6px; }
            .p-6 { padding: 12px; }
            h2 { font-size: 14px; font-weight: 800; text-transform: uppercase; }
            svg, img.logo { display: none !important; }
          </style>
        </head>
        <body>
          ${receiptContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-scale-in print:animate-none print:mx-0 print:max-w-none print:w-full">
        {/* Action buttons — hidden in print */}
        <div className="flex items-center justify-between mb-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-200/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </button>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 border border-slate-200 text-slate-400 transition-all hover:bg-white hover:text-slate-600 hover:shadow-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt Card */}
        <div
          ref={receiptRef}
          className="receipt-print-area rounded-2xl bg-white shadow-2xl overflow-hidden print:rounded-none print:shadow-none"
        >
          {/* Receipt inner content with thermal styling */}
          <div className="p-6 print:p-4 font-mono text-xs text-slate-700">
            {/* Store Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
              <div className="flex justify-center mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 print:bg-slate-800">
                  <Store className="h-5 w-5 text-white" />
                </div>
              </div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-wide">
                TOKO SAYA
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Jl. Contoh No. 123, Kota
              </p>
              <p className="text-[10px] text-slate-400">Telp: 0812-3456-7890</p>
            </div>

            {/* Transaction Info */}
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-400">No.</span>
                <span className="font-bold">{shortId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal</span>
                <span>{formatDate(data.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kasir</span>
                <span>{data.cashierName || "-"}</span>
              </div>
              {data.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer</span>
                  <span>{data.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Bayar</span>
                <span className="uppercase font-bold">
                  {data.paymentMethod === "cash" ? "Tunai" : "QRIS"}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="border-b border-dashed border-slate-300 pb-3 mb-3 space-y-2">
              {data.items.map((item, idx) => (
                <div key={idx}>
                  <p className="font-semibold text-slate-700 truncate">
                    {item.name}
                  </p>
                  <div className="flex justify-between text-slate-500">
                    <span>
                      {item.qty} x {formatPrice(item.price)}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-extrabold text-slate-800 border-b border-dashed border-slate-300 pb-2 mb-2">
                <span>TOTAL</span>
                <span>{formatPrice(data.total)}</span>
              </div>

              {data.paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Tunai</span>
                    <span>{formatPrice(data.cashAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Kembalian</span>
                    <span>{formatPrice(data.change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-slate-300 mt-4 pt-4">
              <div className="flex justify-center mb-1">
                <Receipt className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Terima kasih atas kunjungan Anda!
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Barang yang sudah dibeli tidak dapat ditukar/dikembalikan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

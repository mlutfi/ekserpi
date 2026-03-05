"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { salesApi, Sale } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Banknote, QrCode, Loader2, CheckCircle, XCircle, Sparkles, ArrowRight, Printer, RefreshCw, AlertCircle, Clock, ChevronDown, ChevronUp, Info } from "lucide-react"
import { createPortal } from "react-dom"
import { ReceiptModal } from "./ReceiptModal"
import QRCode from "qrcode"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CartItem {
  productId: string
  name: string
  price: number
  qty: number
}

interface PaymentPanelProps {
  cartItems: CartItem[]
  total: number
  sale: Sale | null
  setSale: (sale: Sale | null) => void
  onClear: () => void
  onPaidSuccess: () => void
  customerName: string
}

export function PaymentPanel({
  cartItems,
  total,
  sale,
  setSale,
  onClear,
  onPaidSuccess,
  customerName,
}: PaymentPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | null>(null)
  const [cashAmount, setCashAmount] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [mounted, setMounted] = useState(false)

  // QRIS state
  const [qrisData, setQrisData] = useState<{
    id: string
    qrisUrl: string | null
    providerRef: string | null
    status: string
  } | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrisStatus, setQrisStatus] = useState<"PENDING" | "PAID" | "EXPIRED" | "FAILED">("PENDING")
  const [pollingCount, setPollingCount] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown timer state (900s = 15 minutes, standard Midtrans QRIS)
  const QRIS_DURATION = 900
  const [qrisCountdown, setQrisCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Snap State
  const [isSnapLoading, setIsSnapLoading] = useState(false)

  // Load Midtrans Snap Script
  useEffect(() => {
    // We can use sandbox url for now or config it. Midtrans Sandbox is app.sandbox.midtrans.com/snap/snap.js
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    // Usually you'd put the client key here, but it's optional for snap.pay(token)
    // const myMidtransClientKey = "...";

    let scriptTag = document.getElementById("midtrans-script");
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "midtrans-script";
      scriptTag.setAttribute("src", snapScriptUrl);
      // scriptTag.setAttribute("data-client-key", myMidtransClientKey); 
      document.body.appendChild(scriptTag);
    }

    return () => {
      // Optional: cleanup script if we unmount
    }
  }, [])

  // Midtrans response info box
  const [showMidtransInfo, setShowMidtransInfo] = useState(false)

  // Ensure portals only render on client
  if (typeof window !== "undefined" && !mounted) {
    setMounted(true)
  }

  /** Generate QR Data URL from a QRIS string */
  const generateQrDataUrl = useCallback(async (qrisString: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(qrisString, {
        width: 280,
        margin: 2,
        color: { dark: "#1e1b4b", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error("Failed to generate QR code:", err)
    }
  }, [])

  /** Format seconds into MM:SS */
  const formatCountdown = useMemo(() => (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }, [])

  /** Start 15-min countdown timer */
  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setQrisCountdown(QRIS_DURATION)
    countdownRef.current = setInterval(() => {
      setQrisCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  /** Auto-expire when countdown hits 0 */
  useEffect(() => {
    if (qrisCountdown === 0 && qrisStatus === "PENDING") {
      if (pollingRef.current) clearInterval(pollingRef.current)
      setQrisStatus("EXPIRED")
    }
  }, [qrisCountdown, qrisStatus])

  /** Start polling Midtrans for QRIS payment status */
  const startPolling = useCallback((saleId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const result = await salesApi.getQRISStatus(saleId)
        setPollingCount((c) => c + 1)

        if (result.status === "PAID") {
          clearInterval(pollingRef.current!)
          setQrisStatus("PAID")
          setShowSuccess(true)
          onPaidSuccess()
        } else if (result.status === "EXPIRED" || result.status === "FAILED") {
          clearInterval(pollingRef.current!)
          setQrisStatus(result.status as "EXPIRED" | "FAILED")
          toast({
            title: "Pembayaran Gagal",
            description: `Status QRIS: ${result.status}`,
            variant: "destructive",
          })
        }
      } catch {
        // Ignore polling errors silently
      }
    }, 3000) // Poll every 3 seconds
  }, [onPaidSuccess, toast])

  // Clean up polling and countdown on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleCreateSale = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang kosong",
        variant: "destructive",
      })
      return null
    }

    try {
      const saleData = await salesApi.create(
        cartItems.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
        customerName || undefined
      )
      setSale(saleData)
      return saleData
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal membuat transaksi",
        variant: "destructive",
      })
      return null
    }
  }

  const handleCashPayment = async () => {
    if (!sale) return

    const amount = parseInt(cashAmount)
    if (isNaN(amount) || amount < total) {
      toast({
        title: "Error",
        description: "Jumlah pembayaran kurang",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await salesApi.payCash(sale.id, amount)
      setShowSuccess(true)
      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil",
      })
      onPaidSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal memproses pembayaran",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQRISPayment = async (currentSale: Sale) => {
    setLoading(true)
    try {
      const result = await salesApi.payQRIS(currentSale.id)
      setQrisData(result)
      setQrisStatus("PENDING")
      setPollingCount(0)
      setShowMidtransInfo(false)

      if (result.qrisUrl) {
        await generateQrDataUrl(result.qrisUrl)
      }

      // Start polling and countdown
      startPolling(currentSale.id)
      startCountdown()

      toast({
        title: "QR Code Siap",
        description: "Scan QR code menggunakan aplikasi e-wallet",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal membuat QRIS",
        variant: "destructive",
      })
      setPaymentMethod(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSnapPayment = async () => {
    if (!sale) return
    setIsSnapLoading(true)
    try {
      const result = await salesApi.generateSnapToken(sale.id)

      // Stop QRIS polling if it was running since we're opening Snap
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)

      // @ts-ignore
      window.snap.pay(result.token, {
        onSuccess: function (r: any) {
          // Snap success
          setShowSuccess(true)
          setQrisStatus("PAID")
          toast({ title: "Pembayaran Berhasil", description: "Terima kasih!" })
          onPaidSuccess()
        },
        onPending: function (r: any) {
          toast({ title: "Pembayaran Tertunda", description: "Selesaikan pembayaran Anda." })
          // Optionally restart polling if they close it, or just let them re-click
        },
        onError: function (r: any) {
          toast({ title: "Pembayaran Gagal", description: "Terjadi kesalahan pada Snap", variant: "destructive" })
        },
        onClose: function () {
          // Restart QRIS polling just in case they closed it to scan the QR instead
          startPolling(sale.id)
          startCountdown()
        }
      })
    } catch (error: any) {
      toast({
        title: "Error Midtrans Snap",
        description: error.response?.data?.message || "Gagal membuka Snap",
        variant: "destructive"
      })
    } finally {
      setIsSnapLoading(false)
    }
  }

  const handleStartPayment = async (method: "cash" | "qris") => {
    setPaymentMethod(method)
    const currentSale = sale || (await handleCreateSale())
    if (!currentSale) {
      setPaymentMethod(null)
      return
    }

    if (method === "qris") {
      await handleQRISPayment(currentSale)
    }
  }

  const handleReset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setPaymentMethod(null)
    setCashAmount("")
    setShowSuccess(false)
    setQrisData(null)
    setQrDataUrl(null)
    setQrisStatus("PENDING")
    setQrisCountdown(null)
    setShowMidtransInfo(false)
    onClear()
  }

  const handleRefreshQRIS = async () => {
    if (!sale) return
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setQrisCountdown(null)
    await handleQRISPayment(sale)
  }

  const change = parseInt(cashAmount) - total

  // ===== Success Screen =====
  if (showSuccess) {
    const receiptData = {
      saleId: sale?.id || "",
      items: cartItems.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        subtotal: item.price * item.qty,
      })),
      total,
      cashAmount: parseInt(cashAmount) || total,
      change: Math.max(0, (parseInt(cashAmount) || total) - total),
      paymentMethod: paymentMethod as "cash" | "qris",
      cashierName: sale?.cashierName || "",
      customerName: customerName || "",
      createdAt: sale?.createdAt || new Date().toISOString(),
    }

    const successOverlay = mounted ? createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-scale-in">
          {/* Green top banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 pt-8 pb-16 text-center relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <div className="relative flex flex-col items-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 shadow-xl ring-4 ring-white/30">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 animate-bounce shadow-sm">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-white tracking-wide">Pembayaran Berhasil!</h3>
              <p className="mt-1 text-sm text-emerald-100">Transaksi telah selesai</p>
            </div>
          </div>

          {/* Content card */}
          <div className="-mt-8 mx-4 rounded-2xl bg-white border border-slate-100 shadow-lg px-5 pt-5 pb-4 space-y-3">
            {change > 0 && (
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Kembalian</p>
                <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{formatPrice(change)}</p>
              </div>
            )}

            <div className="space-y-1 text-xs text-slate-500 border border-slate-100 rounded-xl px-4 py-3 bg-slate-50">
              <div className="flex justify-between">
                <span>No. Transaksi</span>
                <span className="font-mono font-semibold text-slate-700">{sale?.id?.slice(0, 8).toUpperCase() || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tagihan</span>
                <span className="font-bold text-slate-700">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar</span>
                <span className="font-semibold capitalize">{paymentMethod === 'cash' ? 'Tunai' : 'QRIS'}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-6 pt-3 space-y-2">
            <button
              onClick={() => setShowReceipt(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200/50 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="h-4 w-4" />
              Cetak Struk
            </button>
            <button
              onClick={handleReset}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200/50 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      </div>,
      document.body
    ) : null;

    return (
      <>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="mt-3 text-sm text-slate-400 font-medium">Transaksi Selesai</p>
        </div>

        {successOverlay}

        <ReceiptModal
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
          data={receiptData}
        />
      </>
    )
  }

  // ===== Empty Cart =====
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <Banknote className="h-7 w-7 text-slate-300" />
        </div>
        <p className="mt-3 text-sm text-slate-400 font-medium">Tidak ada item untuk dibayar</p>
      </div>
    )
  }

  // ===== Cash Payment Flow =====
  if (paymentMethod === "cash") {
    return (
      <ScrollArea className="flex-1">
        <div className="space-y-4 animate-fade-in pr-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Pembayaran Tunai</h3>
            <button
              onClick={() => setPaymentMethod(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Jumlah Bayar
            </label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="Masukkan jumlah"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-sm text-slate-700 placeholder-slate-300 outline-none transition-all duration-200 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Quick amounts — row 1: exact total */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nominal Cepat</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCashAmount(total.toString())}
                className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition-all hover:bg-orange-100 active:scale-95"
              >
                Pas · {formatPrice(total)}
              </button>
              {[5000, 10000, 20000, 50000, 100000].map((amount) => (
                amount > total && (
                  <button
                    key={amount}
                    onClick={() => setCashAmount(amount.toString())}
                    className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 active:scale-95"
                  >
                    {formatPrice(amount)}
                  </button>
                )
              ))}
            </div>
          </div>

          {parseInt(cashAmount) >= total && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 animate-fade-in">
              <p className="text-xs text-emerald-500 font-medium">Kembalian</p>
              <p className="text-sm font-bold text-emerald-700">
                {formatPrice(change)}
              </p>
            </div>
          )}

          <button
            onClick={handleCashPayment}
            disabled={loading || parseInt(cashAmount) < total}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-200/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Banknote className="h-4 w-4" />
                Bayar Sekarang
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </ScrollArea>
    )
  }

  // ===== QRIS Payment Modal (portal, centered) =====
  const qrisModal = paymentMethod === "qris" && mounted ? createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={qrisStatus === "PENDING" ? undefined : handleReset}
      />

      {/* Modal Card */}
      <ScrollArea className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] animate-scale-in">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-white" />
            <h3 className="text-base font-bold text-white">Pembayaran QRIS</h3>
          </div>
          <button
            onClick={handleReset}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">

          {/* QR Code Area */}
          <div className="flex flex-col items-center justify-center py-2">
            {loading ? (
              <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl bg-violet-50 border-2 border-dashed border-violet-200">
                <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
                <p className="mt-3 text-xs text-violet-400 font-medium">Membuat QR Code...</p>
              </div>
            ) : qrisStatus === "EXPIRED" || qrisStatus === "FAILED" ? (
              <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl bg-red-50 border-2 border-dashed border-red-200">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <p className="mt-3 text-sm font-bold text-red-500">
                  {qrisStatus === "EXPIRED" ? "QR Code Kedaluwarsa" : "Pembayaran Gagal"}
                </p>
                <p className="mt-1 text-xs text-red-400">Buat QR baru untuk melanjutkan</p>
              </div>
            ) : qrDataUrl ? (
              <div className="relative">
                <div className="rounded-2xl overflow-hidden border-4 border-violet-100 shadow-xl shadow-violet-200/50 p-2.5 bg-white">
                  <img
                    src={qrDataUrl}
                    alt="QRIS Payment QR Code"
                    width={220}
                    height={220}
                    className="rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-1.5 shadow-lg">
                  <QrCode className="h-3.5 w-3.5 text-white" />
                  <span className="text-xs font-bold text-white tracking-wide">QRIS</span>
                </div>
              </div>
            ) : (
              <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <QrCode className="h-14 w-14 text-slate-300" />
                <p className="mt-2 text-xs text-slate-400">QR tidak tersedia</p>
              </div>
            )}
          </div>

          {/* Total + Countdown + Status */}
          {!loading && qrisStatus === "PENDING" && (
            <div className="space-y-2.5 mt-5">
              {/* Total */}
              <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 px-4 py-3 text-center">
                <p className="text-xs text-violet-500 font-semibold uppercase tracking-wide">Total Pembayaran</p>
                <p className="text-2xl font-extrabold text-violet-700 mt-0.5">{formatPrice(total)}</p>
              </div>

              {/* Countdown */}
              {qrisCountdown !== null && (
                <div className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${qrisCountdown <= 60
                  ? "bg-red-50 border-red-200"
                  : qrisCountdown <= 180
                    ? "bg-amber-50 border-amber-200"
                    : "bg-slate-50 border-slate-200"
                  }`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${qrisCountdown <= 60 ? "text-red-500 animate-pulse" :
                      qrisCountdown <= 180 ? "text-amber-500" : "text-slate-400"
                      }`} />
                    <span className={`text-xs font-semibold ${qrisCountdown <= 60 ? "text-red-500" :
                      qrisCountdown <= 180 ? "text-amber-600" : "text-slate-500"
                      }`}>
                      {qrisCountdown <= 60 ? "Segera kedaluwarsa!" : "Batas waktu scan"}
                    </span>
                  </div>
                  <span className={`font-mono text-lg font-black tabular-nums ${qrisCountdown <= 60 ? "text-red-600" :
                    qrisCountdown <= 180 ? "text-amber-600" : "text-slate-700"
                    }`}>
                    {formatCountdown(qrisCountdown)}
                  </span>
                </div>
              )}

              {/* Polling status */}
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs text-slate-500">
                  Menunggu pembayaran... {pollingCount > 0 ? `(cek ke-${pollingCount})` : ""}
                </p>
              </div>

              <p className="text-center text-[11px] text-slate-400">
                Scan dengan GoPay, OVO, Dana, ShopeePay, atau e-wallet lainnya
              </p>
            </div>
          )}

          {/* Midtrans Response Info Box */}
          {!loading && qrisData && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <button
                onClick={() => setShowMidtransInfo((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Detail Respon Midtrans
                </span>
                {showMidtransInfo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showMidtransInfo && (
                <div className="border-t border-slate-200 px-4 py-3 bg-slate-100/50">
                  <pre className="font-mono text-[10px] text-slate-600 whitespace-pre-wrap break-all max-h-48 overflow-y-auto w-full">
                    {JSON.stringify(qrisData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {(qrisStatus === "EXPIRED" || qrisStatus === "FAILED") && (
              <button
                onClick={handleRefreshQRIS}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Buat QR Baru
              </button>
            )}

            {qrisStatus === "PENDING" && !showSuccess && (
              <button
                onClick={handleSnapPayment}
                disabled={isSnapLoading || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 py-3 text-sm font-bold text-indigo-600 shadow transition-all duration-200 hover:bg-indigo-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSnapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Bayar dengan Metode Lain
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full rounded-xl bg-white border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Batalkan Pembayaran
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>,
    document.body
  ) : null

  // ===== Payment Method Selection =====
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleStartPayment("cash")}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-white border border-slate-100 py-5 transition-all duration-200 hover:bg-orange-50 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-200/40 transition-transform group-hover:scale-110">
            <Banknote className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-600 group-hover:text-orange-700">Tunai</span>
        </button>
        <button
          onClick={() => handleStartPayment("qris")}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-white border border-slate-100 py-5 transition-all duration-200 hover:bg-violet-50 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-violet-200/40 transition-transform group-hover:scale-110">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-600 group-hover:text-violet-700">QRIS</span>
        </button>
      </div>

      <button
        onClick={onClear}
        className="w-full rounded-xl bg-white border border-slate-200 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.98]"
      >
        Batalkan Transaksi
      </button>

      {/* Render the QRIS portal modal if active */}
      {qrisModal}
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { settingsApi, PosPaymentSettings, BankAccount } from "@/lib/api"
import { toast } from "sonner"
import {
    Settings, Save, Upload, Plus, Trash2, HelpCircle, AlertCircle, CreditCard, Wallet, Banknote, QrCode
} from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function PosSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [settings, setSettings] = useState<PosPaymentSettings>({
        cash: true,
        qrisMidtrans: false,
        qrisStatic: false,
        qrisStaticImage: "",
        bankTransfer: false,
        bankAccounts: [],
    })

    // Local state for adding new bank account
    const [newBank, setNewBank] = useState<Omit<BankAccount, "id">>({
        bankName: "",
        accountNumber: "",
        accountName: ""
    })

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const data = await settingsApi.getPosPayment()
            if (data) {
                setSettings({
                    cash: data.cash ?? true,
                    qrisMidtrans: data.qrisMidtrans ?? false,
                    qrisStatic: data.qrisStatic ?? false,
                    qrisStaticImage: data.qrisStaticImage || "",
                    bankTransfer: data.bankTransfer ?? false,
                    bankAccounts: data.bankAccounts || [],
                })
            }
        } catch (error) {
            console.error("Failed to load POS settings:", error)
            toast.error("Error", {
                description: "Gagal memuat pengaturan POS.",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const getQrisImageUrl = (path: string | undefined | null) => {
        if (!path) return ""
        if (path.startsWith("http")) return path
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api"
        const hostUrl = baseUrl.replace(/\/api$/, "")
        return `${hostUrl}${path.startsWith("/") ? "" : "/"}${path}`
    }

    const handleToggle = (key: keyof PosPaymentSettings) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key as keyof PosPaymentSettings]
        }))
    }

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const imageUrl = await settingsApi.uploadQrisImage(file)
            setSettings((prev) => ({ ...prev, qrisStaticImage: imageUrl }))
            toast.success("Berhasil", {
                description: "Gambar QRIS berhasil diunggah.",
            })
        } catch (error) {
            toast.error("Error", {
                description: "Gagal mengunggah gambar QRIS.",
            })
        } finally {
            setUploading(false)
        }
    }

    const handleAddBankAccount = () => {
        if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
            toast.error("Error", {
                description: "Lengkapi semua data akun bank.",
            })
            return
        }

        const newAccount: BankAccount = {
            id: "bank_" + Date.now(),
            ...newBank
        }

        setSettings(prev => ({
            ...prev,
            bankAccounts: [...prev.bankAccounts, newAccount]
        }))

        setNewBank({
            bankName: "",
            accountNumber: "",
            accountName: ""
        })
    }

    const handleDeleteBankAccount = (id: string) => {
        setSettings(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.filter(acc => acc.id !== id)
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await settingsApi.updatePosPayment(settings)
            toast.success("Berhasil", {
                description: "Pengaturan POS berhasil disimpan.",
            })
        } catch (error) {
            toast.error("Error", {
                description: "Gagal menyimpan pengaturan POS.",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-zinc-400">
                    <Settings className="h-8 w-8 animate-spin" />
                    <p className="text-sm font-medium">Memuat Pengaturan...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-zinc-400" />
                    Pengaturan Pembayaran POS
                </h1>
                <p className="text-sm text-zinc-500 mt-1 pl-9">
                    Atur metode pembayaran yang tersedia saat checkout di POS.
                </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Metode Pembayaran</h2>
                        <p className="text-xs text-zinc-500 mt-1">
                            Aktifkan atau nonaktifkan pilihan pembayaran.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-md bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Cash */}
                    <div className="flex items-start justify-between p-4 rounded-md border border-zinc-200 bg-zinc-50/30">
                        <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900">Tunai (Cash)</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Terima pembayaran secara tunai di kasir. Secara bawaan metode ini diutamakan.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={settings.cash}
                            onCheckedChange={() => handleToggle('cash')}
                        />
                    </div>

                    {/* QRIS Midtrans */}
                    <div className="flex items-start justify-between p-4 rounded-md border border-zinc-200 bg-zinc-50/30">
                        <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                                <QrCode className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900">QRIS (Midtrans)</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Generate QRIS dinamis via Midtrans untuk pembayaran otomatis.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={settings.qrisMidtrans}
                            onCheckedChange={() => handleToggle('qrisMidtrans')}
                        />
                    </div>

                    {/* QRIS Static */}
                    <div className="border border-zinc-200 rounded-md overflow-hidden shadow-sm">
                        <div className="flex items-start justify-between p-4 bg-zinc-50/30">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                                    <QrCode className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-900">QRIS (Statis)</h3>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Gunakan gambar QRIS toko yang statis. Pelanggan scan, lalu kasir memverifikasi manual.
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.qrisStatic}
                                onCheckedChange={() => handleToggle('qrisStatic')}
                            />
                        </div>
                        {settings.qrisStatic && (
                            <div className="p-5 border-t border-zinc-100 bg-white flex flex-col sm:flex-row gap-6">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-zinc-700 mb-2">
                                        Upload Foto QRIS
                                    </label>
                                    <p className="text-xs text-zinc-500 mb-4">
                                        Gunakan gambar beresolusi jelas agar mudah di-scan oleh aplikasi e-wallet atau m-banking.
                                    </p>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUploadImage}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                        <div className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 py-4 transition-colors hover:border-zinc-300 hover:bg-zinc-100">
                                            {uploading ? (
                                                <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                                                    Mengunggah...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                                                    <Upload className="h-4 w-4" />
                                                    Pilih Foto
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {settings.qrisStaticImage && (
                                    <div className="shrink-0">
                                        <label className="block text-sm font-semibold text-zinc-700 mb-2 border-b border-transparent">Preview QRIS</label>
                                        <div className="rounded-md border border-zinc-200 overflow-hidden shadow-sm p-2 bg-white flex items-center justify-center">
                                            <img src={getQrisImageUrl(settings.qrisStaticImage)} alt="QRIS Static Preview" className="h-48 w-48 object-contain" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bank Transfer */}
                    <div className="border border-zinc-200 rounded-md overflow-hidden shadow-sm">
                        <div className="flex items-start justify-between p-4 bg-zinc-50/30">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-900">Transfer Bank</h3>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Izinkan pembayaran transfer. Kasir akan memilih bank tujuan dan pelanggan melakukan transfer manual.
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.bankTransfer}
                                onCheckedChange={() => handleToggle('bankTransfer')}
                            />
                        </div>

                        {settings.bankTransfer && (
                            <div className="p-5 border-t border-zinc-100 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-zinc-500" />
                                        Daftar Rekening Bank
                                    </h4>
                                </div>

                                <div className="space-y-3 mb-5">
                                    {settings.bankAccounts.length === 0 ? (
                                        <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                                            Belum ada rekening bank yang dikonfigurasi.
                                        </div>
                                    ) : (
                                        settings.bankAccounts.map((acc) => (
                                            <div key={acc.id} className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50/50 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-zinc-900">{acc.bankName}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">{acc.accountNumber} A/N {acc.accountName}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteBankAccount(acc.id)}
                                                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors border border-transparent hover:border-red-200"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Bank Form */}
                                <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-4">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3">Tambah Rekening Baru</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Nama Bank</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: BCA / Mandiri"
                                                value={newBank.bankName}
                                                onChange={(e) => setNewBank(p => ({ ...p, bankName: e.target.value }))}
                                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">No. Rekening</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: 123456789"
                                                value={newBank.accountNumber}
                                                onChange={(e) => setNewBank(p => ({ ...p, accountNumber: e.target.value }))}
                                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Atas Nama</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: PT. Toko Maju"
                                                value={newBank.accountName}
                                                onChange={(e) => setNewBank(p => ({ ...p, accountName: e.target.value }))}
                                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddBankAccount}
                                        className="mt-4 flex w-full md:w-auto items-center justify-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 px-4 py-2 hover:bg-zinc-800 text-sm font-semibold text-white transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambahkan Rekening
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

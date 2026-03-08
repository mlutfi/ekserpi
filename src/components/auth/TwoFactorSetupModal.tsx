"use client"

import { useState, useEffect } from "react"
import { QRCodeCanvas } from "qrcode.react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/lib/api"
import { toast } from "sonner"
import { Shield, ShieldAlert, ShieldCheck, Copy, Check } from "lucide-react"

interface TwoFactorSetupModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: {
        twoFactorEnabled: boolean
    }
    onSuccess: () => void
}

export function TwoFactorSetupModal({
    open,
    onOpenChange,
    user,
    onSuccess,
}: TwoFactorSetupModalProps) {
    const [step, setStep] = useState<"enabled" | "setup" | "verify">("enabled")
    const [loading, setLoading] = useState(false)
    const [setupData, setSetupData] = useState<{ secret: string; qrUrl: string } | null>(null)
    const [verificationCode, setVerificationCode] = useState("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (open) {
            setStep(user.twoFactorEnabled ? "enabled" : "setup")
            setVerificationCode("")
            if (!user.twoFactorEnabled) {
                handleStartSetup()
            }
        }
    }, [open, user.twoFactorEnabled])

    async function handleStartSetup() {
        setLoading(true)
        try {
            const data = await authApi.setup2FA()
            setSetupData(data)
            setStep("setup")
        } catch (error: any) {
            toast.error("Gagal memulai setup 2FA")
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    async function handleVerify() {
        if (verificationCode.length !== 6) {
            toast.error("Kode harus 6 digit")
            return
        }

        setLoading(true)
        try {
            await authApi.enable2FA(verificationCode)
            toast.success("2-Factor Authentication berhasil diaktifkan")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Kode verifikasi salah")
        } finally {
            setLoading(false)
        }
    }

    async function handleDisable() {
        setLoading(true)
        try {
            await authApi.disable2FA()
            toast.success("2-Factor Authentication telah dinonaktifkan")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error("Gagal menonaktifkan 2FA")
        } finally {
            setLoading(false)
        }
    }

    const copySecret = () => {
        if (setupData?.secret) {
            navigator.clipboard.writeText(setupData.secret)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success("Secret copied to clipboard")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        2-Factor Authentication
                    </DialogTitle>
                    <DialogDescription>
                        Amankan akun Anda dengan verifikasi dua langkah menggunakan Google Authenticator.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === "enabled" ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <ShieldCheck className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-zinc-900">2FA Aktif</h3>
                                <p className="text-sm text-zinc-500 mt-1">
                                    Akun Anda saat ini terlindungi dengan verifikasi dua langkah.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                className="mt-4"
                                onClick={handleDisable}
                                disabled={loading}
                            >
                                {loading ? "Memproses..." : "Nonaktifkan 2FA"}
                            </Button>
                        </div>
                    ) : step === "setup" ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                                    {setupData?.qrUrl && (
                                        <QRCodeCanvas
                                            value={setupData.qrUrl}
                                            size={180}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 text-center max-w-[280px]">
                                    Pindai QR Code di atas menggunakan aplikasi Google Authenticator atau Authy.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    Atau masukkan kode secara manual
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            readOnly
                                            value={setupData?.secret || ""}
                                            className="pr-10 bg-zinc-50 font-mono text-xs"
                                        />
                                        <button
                                            onClick={copySecret}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                        >
                                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium">Langkah Terakhir: Verifikasi Kode</label>
                                <Input
                                    placeholder="Masukkan 6 digit kode"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                    maxLength={6}
                                    className="text-center text-lg tracking-[0.2em] font-bold"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleVerify()
                                    }}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleVerify}
                                disabled={loading || verificationCode.length !== 6}
                            >
                                {loading ? "Memverifikasi..." : "Aktifkan 2FA"}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}

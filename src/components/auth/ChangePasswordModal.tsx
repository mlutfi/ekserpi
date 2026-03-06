"use client"

import { useState } from "react"
import { authApi } from "@/lib/api"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ChangePasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error("Semua field harus diisi")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("Password baru dan konfirmasi password tidak cocok")
            return
        }

        if (newPassword.length < 6) {
            toast.error("Password baru minimal 6 karakter")
            return
        }

        setLoading(true)
        try {
            await authApi.changePassword(oldPassword, newPassword)
            toast.success("Password berhasil diubah")
            handleClose()
        } catch (error: any) {
            toast.error("Gagal mengubah password", {
                description: error.response?.data?.message || "Password lama mungkin salah",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setShowOldPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ganti Password</DialogTitle>
                    <DialogDescription>
                        Masukkan password lama Anda dan password baru yang Anda inginkan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Password Lama</label>
                        <div className="relative">
                            <input
                                type={showOldPassword ? "text" : "password"}
                                className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 pr-10 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-slate-400 hover:text-slate-600"
                            >
                                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Password Baru</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 pr-10 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-slate-400 hover:text-slate-600"
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 pr-10 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-slate-400 hover:text-slate-600"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
                            {loading ? "Menyimpan..." : "Simpan Password"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

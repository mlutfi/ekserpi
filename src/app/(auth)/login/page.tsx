"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { authApi } from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { getDefaultRoute } from "@/lib/roles"

export default function LoginPage() {
  const router = useRouter()
  // const { toast } = useToast() // Not needed for sonner
  const setAuth = useAuthStore((state) => state.setAuth)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      toast.error("Email dan password harus diisi")
      return
    }

    setLoading(true)

    try {
      const response = await authApi.login(email, password)
      setAuth(response.user, response.token)

      toast.success("Login berhasil", {
        description: `Selamat datang, ${response.user.name}!`,
      })

      // Use role-based routing
      const redirectPath = getDefaultRoute(response.user.role)
      router.replace(redirectPath)
    } catch (error: any) {
      toast.error("Login gagal", {
        description: error.response?.data?.message || "Email atau password salah",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8 text-slate-900 md:px-10">
      <div className="mx-auto grid w-full max-w-6xl items-center justify-center overflow-hidden">
        <section className="flex flex-col w-[500px] items-center justify-center gap-6 p-8 md:p-12 rounded-[28px] border border-slate-200 bg-white text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-amber-500 to-orange-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </div>
            <span className="leading-none">Simple POS</span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Selamat Datang</h2>
            <p className="mt-1 text-sm text-slate-500">
              Silakan login ke sistem POS Anda
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4 text-left">
            <div className="space-y-3">
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-700">
                  Password
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition focus-within:border-slate-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-transparent text-sm outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin()
                    }}
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="ml-3 inline-flex h-6 w-6 items-center justify-center text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl border border-[#0e0a07] bg-[#0e0a07] py-2.5 text-sm font-semibold text-white transition hover:bg-[#16110d] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Masuk"
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              Demo: owner@pos.com / password123
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
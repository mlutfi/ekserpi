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
    <div className="w-full px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[400px]">
        <section className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm">
              <Image
                src="/xrp_logo.png"
                alt="Logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">Selamat Datang</h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                Silakan login untuk melanjutkan
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="nama@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black"
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
                    className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-600"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-zinc-500">
          XRP - Community Based System
        </p>
      </div>
    </div>
  )
}
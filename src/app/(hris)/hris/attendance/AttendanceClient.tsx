"use client"

import { useEffect, useState, useRef, ChangeEvent, useCallback } from "react"
import { useAuthStore } from "@/lib/store"
import { attendanceApi, employeesApi, Attendance, Employee } from "@/lib/hris"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Clock,
    Camera,
    MapPin,
    CheckCircle,
    Loader2,
    LogIn,
    LogOut,
    RefreshCw,
    Check,
    X,
    ChevronRight,
    Home,
    Building,
    Globe,
    Calendar,
    Fingerprint,
    Sun,
    Sunrise,
    Sunset,
    ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PageLoading } from "@/components/ui/page-loading"

type UserRole = "OWNER" | "HR_ADMIN" | "MANAGER" | "TEAM_LEADER" | "EMPLOYEE" | "STAFF"
type CheckInStep = 'work-type' | 'camera' | 'location' | 'confirm'

export default function AttendanceClient() {
    const user = useAuthStore((state) => state.user)
    const router = useRouter()
    // const { toast } = useToast()

    const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
    const [history, setHistory] = useState<Attendance[]>([])
    const [loading, setLoading] = useState(true)
    const [checkingIn, setCheckingIn] = useState(false)
    const [checkingOut, setCheckingOut] = useState(false)
    const [error, setError] = useState("")

    // Check-in form
    const [workType, setWorkType] = useState<"WFO" | "WFH" | "WFA">("WFO")
    const [reason, setReason] = useState<string>("")
    const [photo, setPhoto] = useState<string>("")
    const [location, setLocation] = useState<{ lat: number; long: number } | null>(null)
    const [employeeId, setEmployeeId] = useState<string>("")
    const [myEmployee, setMyEmployee] = useState<Employee | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [cameraError, setCameraError] = useState<string>("")

    // Step-based flow
    const [checkInStep, setCheckInStep] = useState<CheckInStep>('work-type')
    const [showCheckInModal, setShowCheckInModal] = useState(false)
    const [showCheckOutModal, setShowCheckOutModal] = useState(false)

    // Real-time clock
    const [currentTime, setCurrentTime] = useState(new Date())

    // Office location
    const OFFICE_LAT = -6.2088
    const OFFICE_LONG = 106.8456
    const OFFICE_RADIUS = 200

    const userRole = user?.role as UserRole
    const needsCheckIn = ["OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER", "EMPLOYEE", "STAFF"].includes(userRole)

    // Real-time clock update
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        loadAttendance()
    }, [])

    const getGreeting = () => {
        const hour = currentTime.getHours()
        if (hour < 11) return { text: "Selamat Pagi", icon: Sunrise, color: "text-amber-500" }
        if (hour < 15) return { text: "Selamat Siang", icon: Sun, color: "text-orange-500" }
        if (hour < 18) return { text: "Selamat Sore", icon: Sunset, color: "text-rose-500" }
        return { text: "Selamat Malam", icon: Sun, color: "text-indigo-500" }
    }

    const loadAttendance = async () => {
        try {
            setLoading(true)
            setError("")

            try {
                const emp = await employeesApi.getMe()
                setEmployeeId(emp.id)
                setMyEmployee(emp)
            } catch {
                // Employee profile not found
            }

            try {
                const todayData = await attendanceApi.getToday()
                setTodayAttendance(todayData)
            } catch {
                setTodayAttendance(null)
            }

            const historyData = await attendanceApi.getHistory(undefined,
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                new Date().toISOString().split("T")[0]
            )
            setHistory(historyData.slice(0, 10))
        } catch (err: any) {
            console.error("Failed to load attendance:", err)
            setError("Gagal memuat data absensi")
        } finally {
            setLoading(false)
        }
    }

    const startCamera = async () => {
        try {
            setCameraError("")
            // Stop any existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }

            let stream: MediaStream
            try {
                // Try front camera first (mobile)
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
                })
            } catch {
                // Fallback: any available camera (desktop/laptop webcam)
                stream = await navigator.mediaDevices.getUserMedia({ video: true })
            }

            // Store stream in ref, then set active so <video> renders in DOM
            streamRef.current = stream
            setCameraActive(true)
        } catch (err: any) {
            console.error("Failed to access camera:", err)
            setCameraError("Tidak dapat mengakses kamera. Gunakan upload foto sebagai alternatif.")
            toast.info("Info", {
                description: "Kamera tidak tersedia. Silakan upload foto.",
            })
        }
    }

    // Attach stream to video element once it renders
    useEffect(() => {
        if (cameraActive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [cameraActive])

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => {
            setPhoto(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
            videoRef.current.srcObject = null
        }
        setCameraActive(false)
    }, [])

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d")
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth
                canvasRef.current.height = videoRef.current.videoHeight
                context.drawImage(videoRef.current, 0, 0)
                const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.8)
                setPhoto(dataUrl)
                stopCamera()
            }
        }
    }

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({ lat: position.coords.latitude, long: position.coords.longitude })
                    toast.success("Berhasil", {
                        description: "Lokasi berhasil didapat",
                    })
                },
                (error) => {
                    console.error("Geolocation error:", error)
                    toast.error("Error", {
                        description: "Tidak dapat mendapatkan lokasi.",
                    })
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        }
    }

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c * 1000
    }

    const openCheckInModal = () => {
        setShowCheckInModal(true)
        setCheckInStep('work-type')
        setPhoto("")
        setLocation(null)
        setReason("")
        setWorkType("WFO")
    }

    const closeCheckInModal = () => {
        setShowCheckInModal(false)
        stopCamera()
    }

    const openCheckOutModal = () => {
        setShowCheckOutModal(true)
        setPhoto("")
        setLocation(null)
    }

    const closeCheckOutModal = () => {
        setShowCheckOutModal(false)
        stopCamera()
    }

    const handleCheckIn = async () => {
        if (!photo || !location) {
            toast.error("Error", {
                description: "Silakan ambil foto dan lokasi terlebih dahulu",
            })
            return
        }

        let isOutsideRadius = false
        if (workType === "WFO") {
            const distance = calculateDistance(location.lat, location.long, OFFICE_LAT, OFFICE_LONG)
            if (distance > OFFICE_RADIUS) {
                isOutsideRadius = true
                toast.info("Peringatan", {
                    description: `Anda berada di luar radius kantor (${Math.round(distance)}m).`,
                })
            }
        }

        try {
            setCheckingIn(true)
            let empId = employeeId
            if (!empId) {
                const emp = await employeesApi.getMe()
                empId = emp.id
                setEmployeeId(empId)
            }

            await attendanceApi.checkIn({
                employeeId: empId,
                checkinPhoto: photo,
                checkinLat: location.lat,
                checkinLong: location.long,
                workType,
                reason: (workType === "WFH" || workType === "WFA") ? reason : undefined,
            })

            toast.success("Berhasil", {
                description: isOutsideRadius ? "Check-in berhasil (Luar Radius)" : "Check-in berhasil",
            })
            setPhoto("")
            setLocation(null)
            setReason("")
            closeCheckInModal()
            loadAttendance()
        } catch (err: any) {
            console.error("Check-in failed:", err)
            toast.error("Gagal", {
                description: err.response?.data?.message || "Gagal check-in",
            })
        } finally {
            setCheckingIn(false)
        }
    }

    const handleCheckOut = async () => {
        if (!photo || !location) {
            toast.error("Error", {
                description: "Silakan ambil foto dan lokasi terlebih dahulu",
            })
            return
        }

        try {
            setCheckingOut(true)
            let empId = employeeId
            if (!empId) {
                const emp = await employeesApi.getMe()
                empId = emp.id
                setEmployeeId(empId)
            }

            await attendanceApi.checkOut({
                employeeId: empId,
                checkoutPhoto: photo,
                checkoutLat: location.lat,
                checkoutLong: location.long,
            })

            toast.success("Berhasil", {
                description: "Check-out berhasil",
            })
            setPhoto("")
            setLocation(null)
            closeCheckOutModal()
            loadAttendance()
        } catch (err: any) {
            console.error("Check-out failed:", err)
            toast.error("Gagal", {
                description: err.response?.data?.message || "Gagal check-out",
            })
        } finally {
            setCheckingOut(false)
        }
    }

    const getStatusInfo = (status: string) => {
        const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
            PRESENT: { label: "Tepat Waktu", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
            LATE: { label: "Terlambat", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
            OUTSIDE_RADIUS: { label: "Luar Radius", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
            ABSENT: { label: "Tidak Hadir", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
            ON_LEAVE: { label: "Cuti", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        }
        return map[status] || { label: status, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" }
    }

    const getWorkTypeInfo = (wt: string) => {
        const map: Record<string, { label: string; color: string; bg: string; icon: typeof Building }> = {
            WFO: { label: "Office", color: "text-blue-600", bg: "bg-blue-50", icon: Building },
            WFH: { label: "Home", color: "text-purple-600", bg: "bg-purple-50", icon: Home },
            WFA: { label: "Anywhere", color: "text-orange-600", bg: "bg-orange-50", icon: Globe },
        }
        return map[wt] || { label: wt, color: "text-slate-600", bg: "bg-slate-50", icon: Globe }
    }

    const canCheckIn = photo && location
    const canCheckOut = photo && location
    const greeting = getGreeting()
    const GreetingIcon = greeting.icon

    if (loading) {
      return <PageLoading />
    }

    return (
        <div className="min-h-screen bg-white">
            {/* â”€â”€ Header Section â”€â”€ */}
            <div className="bg-white border-b border-zinc-200 px-5 py-6 md:px-8 md:py-8">
                <div className="max-w-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        {/* Greeting */}
                        <div className="flex items-center gap-2 mb-1">
                            <GreetingIcon className="h-4 w-4 text-zinc-500" />
                            <span className="text-zinc-500 text-sm font-medium">{greeting.text}</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 mb-1">{user?.name || "User"} 👋</h1>
                        <p className="text-zinc-500 text-sm">
                            {currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>

                    {/* Live Clock */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 flex items-center gap-3">
                        <Clock className="h-5 w-5 text-zinc-500" />
                        <span className="text-xl md:text-2xl font-bold tracking-tight font-mono text-zinc-900">
                            {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    </div>
                </div>
            </div>

            {/* â”€â”€ Main Content â”€â”€ */}
            <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-6 pb-8">

                {/* â”€â”€ Today Status Card â”€â”€ */}
                <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {todayAttendance ? (
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-semibold text-zinc-900">Status Hari Ini</span>
                                    {(() => {
                                        const si = getStatusInfo(todayAttendance.status)
                                        return (
                                            <Badge variant="outline" className={cn("rounded-md text-xs font-medium", si.color, si.border)}>
                                                {si.label}
                                            </Badge>
                                        )
                                    })()}
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Check In */}
                                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-center">
                                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2">
                                            <LogIn className="h-4 w-4 text-zinc-500" />
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wider font-semibold">Masuk</p>
                                        <p className="text-sm font-bold text-zinc-900">{todayAttendance.checkinTime || "-"}</p>
                                    </div>

                                    {/* Check Out */}
                                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-center">
                                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2">
                                            <LogOut className="h-4 w-4 text-zinc-500" />
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wider font-semibold">Pulang</p>
                                        <p className="text-sm font-bold text-zinc-900">{todayAttendance.checkoutTime || "-"}</p>
                                    </div>

                                    {/* Work Mode */}
                                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-center">
                                        {(() => {
                                            const wti = getWorkTypeInfo(todayAttendance.workType)
                                            const WtIcon = wti.icon
                                            return (
                                                <>
                                                    <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2">
                                                        <WtIcon className="h-4 w-4 text-zinc-500" />
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wider font-semibold">Mode</p>
                                                    <p className="text-sm font-bold text-zinc-900">{wti.label}</p>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center border-b border-zinc-100 bg-zinc-50/50">
                                <div className="mx-auto mb-4 h-12 w-12 rounded-full border border-zinc-200 bg-white shadow-sm flex items-center justify-center">
                                    <Fingerprint className="h-6 w-6 text-zinc-400" />
                                </div>
                                <p className="font-semibold text-zinc-900 mb-1">Belum Check-in</p>
                                <p className="text-sm text-zinc-500">Silakan check-in untuk mencatat kehadiran hari ini</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* â”€â”€ Action Button â”€â”€ */}
                {needsCheckIn && (
                    <>
                        {!todayAttendance?.checkinTime ? (
                            <button
                                onClick={openCheckInModal}
                                className="w-full group bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl p-4 flex items-center justify-between shadow-sm transition-all duration-300 active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                        <LogIn className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-base">Check In</p>
                                        <p className="text-zinc-400 text-xs mt-0.5">Mulai hari kerja Anda</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
                            </button>
                        ) : !todayAttendance?.checkoutTime ? (
                            <button
                                onClick={openCheckOutModal}
                                className="w-full group bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all duration-300 active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                        <LogOut className="h-5 w-5 text-zinc-900" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-base text-zinc-900">Check Out</p>
                                        <p className="text-zinc-500 text-xs mt-0.5">Akhiri hari kerja Anda</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
                            </button>
                        ) : (
                            <Card className="border border-zinc-200 shadow-sm rounded-xl overflow-hidden bg-zinc-50">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                                        <CheckCircle className="h-5 w-5 text-zinc-900" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-zinc-900">Absensi Selesai! ✨</p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {todayAttendance.checkinTime} — {todayAttendance.checkoutTime}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* â”€â”€ History Section â”€â”€ */}
                <div className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-zinc-900">Riwayat Absensi</h2>
                        <button
                            onClick={() => router.push("/hris/reports/attendance")}
                            className="text-xs text-zinc-500 font-medium hover:text-zinc-900 flex items-center gap-1 transition-colors"
                        >
                            Lihat Semua
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>

                    {history.length > 0 ? (
                        <div className="space-y-3">
                            {history.map((att) => {
                                const si = getStatusInfo(att.status)
                                const wti = getWorkTypeInfo(att.workType)
                                const WtIcon = wti.icon
                                const dateObj = new Date(att.date)
                                return (
                                    <Card key={att.id} className="border border-zinc-200 shadow-none rounded-xl overflow-hidden hover:border-zinc-300 transition-colors">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            {/* Date */}
                                            <div className="h-12 w-12 rounded-lg bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] font-medium text-zinc-500 leading-none uppercase mb-1">
                                                    {dateObj.toLocaleDateString("id-ID", { weekday: "short" })}
                                                </span>
                                                <span className="text-base font-bold text-zinc-900 leading-none">
                                                    {dateObj.getDate()}
                                                </span>
                                            </div>

                                            {/* Times */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-sm font-semibold text-zinc-900">
                                                        {att.checkinTime || "--:--"}
                                                    </span>
                                                    <span className="text-zinc-300">→</span>
                                                    <span className="text-sm font-semibold text-zinc-900">
                                                        {att.checkoutTime || "--:--"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0 h-5 font-medium rounded-md", si.color, si.border)}>
                                                        {si.label}
                                                    </Badge>
                                                    <span className="text-[10px] flex items-center gap-1 font-medium text-zinc-500">
                                                        <WtIcon className="h-3 w-3" />
                                                        {wti.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <Card className="border border-zinc-200 shadow-none rounded-xl">
                            <CardContent className="p-8 text-center bg-zinc-50/50">
                                <div className="h-12 w-12 rounded-full border border-zinc-200 bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                                    <Calendar className="h-5 w-5 text-zinc-400" />
                                </div>
                                <p className="text-sm font-medium text-zinc-900">Belum ada riwayat absensi</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* ------------ CHECK-IN MODAL ------------ */}
            {showCheckInModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center">
                    <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 border border-zinc-200 shadow-xl">
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-zinc-100 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                                    <LogIn className="h-5 w-5 text-zinc-900" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900">Check In</h3>
                                    <p className="text-xs text-zinc-500">
                                        {checkInStep === 'work-type' && 'Pilih mode kerja'}
                                        {checkInStep === 'camera' && 'Ambil foto selfie'}
                                        {checkInStep === 'location' && 'Verifikasi lokasi'}
                                        {checkInStep === 'confirm' && 'Konfirmasi data'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeCheckInModal}
                                className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-5 pb-3">
                            <div className="flex gap-1.5">
                                {(['work-type', 'camera', 'location', 'confirm'] as CheckInStep[]).map((step, idx) => {
                                    const stepIdx = ['work-type', 'camera', 'location', 'confirm'].indexOf(checkInStep)
                                    return (
                                        <div
                                            key={step}
                                            className={cn(
                                                "h-1 flex-1 rounded-full transition-all duration-300",
                                                idx <= stepIdx ? "bg-zinc-900" : "bg-zinc-200"
                                            )}
                                        />
                                    )
                                })}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
                            {/* Step 1: Work Type */}
                            {checkInStep === 'work-type' && (
                                <div className="space-y-3">
                                    <div className="grid gap-2.5">
                                        {([
                                            { type: "WFO" as const, label: "Work From Office", desc: "Bekerja di kantor", icon: Building, color: "blue" },
                                            { type: "WFH" as const, label: "Work From Home", desc: "Bekerja dari rumah", icon: Home, color: "purple" },
                                            { type: "WFA" as const, label: "Work From Anywhere", desc: "Bekerja dari lokasi lain", icon: Globe, color: "orange" },
                                        ]).map((opt) => {
                                            const OptIcon = opt.icon
                                            const selected = workType === opt.type
                                            return (
                                                <button
                                                    key={opt.type}
                                                    onClick={() => setWorkType(opt.type)}
                                                    className={cn(
                                                        "flex items-center gap-3.5 p-3.5 rounded-xl border transition-all text-left",
                                                        selected
                                                            ? "border-zinc-900 bg-zinc-50 shadow-sm ring-1 ring-zinc-900"
                                                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                                    )}
                                                >
                                                    <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-white border border-zinc-200">
                                                        <OptIcon className="h-5 w-5 text-zinc-900" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm text-zinc-900">{opt.type}</p>
                                                        <p className="text-xs text-zinc-500">{opt.desc}</p>
                                                    </div>
                                                    {selected && (
                                                        <div className="h-6 w-6 rounded-full bg-zinc-900 flex items-center justify-center">
                                                            <Check className="h-3.5 w-3.5 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {(workType === "WFH" || workType === "WFA") && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-medium text-zinc-900">Alasan</label>
                                            <Textarea
                                                value={reason}
                                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                                                placeholder={`Masukkan alasan bekerja ${workType === "WFH" ? "dari rumah" : "dari lokasi lain"}...`}
                                                rows={3}
                                                className="rounded-lg border-zinc-200 focus-visible:ring-zinc-900"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => setCheckInStep('camera')}
                                        className="w-full h-12 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold"
                                    >
                                        Lanjutkan
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            )}

                            {/* Step 2: Camera */}
                            {checkInStep === 'camera' && (
                                <div className="space-y-3">
                                    <div className="relative aspect-4/3 bg-zinc-900 rounded-2xl overflow-hidden">
                                        {cameraActive ? (
                                            <>
                                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-36 h-36 rounded-full border-[3px] border-white/40 border-dashed" />
                                                </div>
                                                {/* Floating capture button on video */}
                                                <button
                                                    onClick={takePhoto}
                                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ring-4 ring-white/30"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center">
                                                        <Camera className="h-6 w-6 text-white" />
                                                    </div>
                                                </button>
                                            </>
                                        ) : photo ? (
                                            <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                                        ) : (
                                            <div
                                                onClick={startCamera}
                                                className="flex flex-col items-center justify-center h-full text-white/50 cursor-pointer hover:text-white/70 transition-colors"
                                            >
                                                <Camera className="h-14 w-14 mb-2" />
                                                <p className="text-sm">Tap untuk membuka kamera</p>
                                            </div>
                                        )}
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>

                                    {cameraError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                            {cameraError}
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="user"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />

                                    <div className="flex gap-2">
                                        {!cameraActive && !photo && (
                                            <>
                                                <Button onClick={startCamera} className="flex-1 h-12 rounded-lg border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900">
                                                    <Camera className="h-5 w-5 mr-2" />
                                                    Buka Kamera
                                                </Button>
                                                <Button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    variant="outline"
                                                    className="h-12 rounded-lg px-4 border-zinc-200"
                                                    title="Upload foto"
                                                >
                                                    Upload
                                                </Button>
                                            </>
                                        )}
                                        {cameraActive && (
                                            <Button
                                                onClick={takePhoto}
                                                className="flex-1 h-12 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
                                            >
                                                <Camera className="h-5 w-5 mr-2" />
                                                Ambil Foto
                                            </Button>
                                        )}
                                        {photo && (
                                            <>
                                                <Button
                                                    onClick={() => { setPhoto(""); startCamera(); }}
                                                    className="flex-1 h-12 rounded-lg border-zinc-200"
                                                    variant="outline"
                                                >
                                                    <RefreshCw className="h-5 w-5 mr-2" />
                                                    Ulang
                                                </Button>
                                                <Button
                                                    onClick={() => setCheckInStep('location')}
                                                    className="flex-1 h-12 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white"
                                                >
                                                    Lanjut
                                                    <ChevronRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Location */}
                            {checkInStep === 'location' && (
                                <div className="space-y-3">
                                    <div className={cn(
                                        "rounded-lg border p-6 text-center transition-all",
                                        location ? "border-zinc-500 bg-zinc-50" : "border-zinc-200 bg-zinc-50"
                                    )}>
                                        {location ? (
                                            <div className="space-y-2">
                                                <div className="h-12 w-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto">
                                                    <MapPin className="h-6 w-6 text-zinc-900" />
                                                </div>
                                                <p className="font-semibold text-zinc-900">Lokasi Terdeteksi</p>
                                                <p className="text-sm text-zinc-500">
                                                    {location.lat.toFixed(6)}, {location.long.toFixed(6)}
                                                </p>
                                                {workType === "WFO" && (
                                                    <p className={cn("text-xs font-medium",
                                                        calculateDistance(location.lat, location.long, OFFICE_LAT, OFFICE_LONG) > OFFICE_RADIUS
                                                            ? "text-amber-600" : "text-emerald-600"
                                                    )}>
                                                        {calculateDistance(location.lat, location.long, OFFICE_LAT, OFFICE_LONG) > OFFICE_RADIUS
                                                            ? "⚠️ Di luar radius kantor"
                                                            : "✅ Dalam radius kantor"}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="h-12 w-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto">
                                                    <MapPin className="h-6 w-6 text-zinc-400" />
                                                </div>
                                                <p className="text-zinc-500">Lokasi belum terdeteksi</p>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={getLocation}
                                        className={cn("w-full h-12 rounded-lg", location ? "border-zinc-200" : "bg-zinc-900 hover:bg-zinc-800 text-white")}
                                        variant={location ? "outline" : "default"}
                                    >
                                        <MapPin className="h-5 w-5 mr-2" />
                                        {location ? "Perbarui Lokasi" : "Dapatkan Lokasi"}
                                    </Button>

                                    {location && (
                                        <Button
                                            onClick={() => setCheckInStep('confirm')}
                                            className="w-full h-12 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white"
                                        >
                                            Lanjutkan
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Confirm */}
                            {checkInStep === 'confirm' && (
                                <div className="space-y-4">
                                    <div className="space-y-2 border border-zinc-200 rounded-lg overflow-hidden bg-white">
                                        <div className="flex items-center justify-between p-3.5 border-b border-zinc-100">
                                            <span className="text-sm text-zinc-500">Mode Kerja</span>
                                            <span className="font-semibold text-sm text-zinc-900">{workType}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 border-b border-zinc-100">
                                            <span className="text-sm text-zinc-500">Foto</span>
                                            <div className="h-10 w-10 rounded-md overflow-hidden border border-zinc-200 shadow-sm">
                                                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 border-b border-zinc-100">
                                            <span className="text-sm text-zinc-500">Lokasi</span>
                                            <span className="text-xs font-mono text-zinc-900">{location?.lat.toFixed(4)}, {location?.long.toFixed(4)}</span>
                                        </div>
                                        {reason && (
                                            <div className="p-3.5">
                                                <span className="text-sm text-zinc-500 block mb-1">Alasan</span>
                                                <span className="text-sm text-zinc-900">{reason}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleCheckIn}
                                        disabled={checkingIn}
                                        className="w-full h-14 rounded-lg text-base bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                                    >
                                        {checkingIn ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <>
                                                <LogIn className="h-5 w-5 mr-2" />
                                                Check In Sekarang
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Footer Back Button */}
                        {checkInStep !== 'work-type' && checkInStep !== 'confirm' && (
                            <div className="px-5 py-3 border-t border-zinc-100 shrink-0">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        const steps: CheckInStep[] = ['work-type', 'camera', 'location', 'confirm']
                                        const idx = steps.indexOf(checkInStep)
                                        if (checkInStep === 'camera') stopCamera()
                                        setCheckInStep(steps[idx - 1])
                                    }}
                                    className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                >
                                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                                    Kembali
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ------------ CHECK-OUT MODAL ------------ */}
            {showCheckOutModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center">
                    <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 border border-zinc-200 shadow-xl">
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-zinc-100 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                                    <LogOut className="h-5 w-5 text-zinc-900" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900">Check Out</h3>
                                    <p className="text-xs text-zinc-500">
                                        Check-in pada {todayAttendance?.checkinTime}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeCheckOutModal}
                                className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
                            {/* Camera */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-900">Foto Selfie</label>
                                <div className="relative aspect-4/3 bg-zinc-900 rounded-2xl overflow-hidden">
                                    {cameraActive ? (
                                        <>
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-36 h-36 rounded-full border-[3px] border-white/40 border-dashed" />
                                            </div>
                                            {/* Floating capture button on video */}
                                            <button
                                                onClick={takePhoto}
                                                className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ring-4 ring-white/30"
                                            >
                                                <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center">
                                                    <Camera className="h-6 w-6 text-white" />
                                                </div>
                                            </button>
                                        </>
                                    ) : photo ? (
                                        <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                                    ) : (
                                        <div
                                            onClick={startCamera}
                                            className="flex flex-col items-center justify-center h-full text-white/50 cursor-pointer hover:text-white/70 transition-colors"
                                        >
                                            <Camera className="h-14 w-14 mb-2" />
                                            <p className="text-sm">Tap untuk membuka kamera</p>
                                        </div>
                                    )}
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="user"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />

                                <div className="flex gap-2">
                                    {!cameraActive && !photo && (
                                        <>
                                            <Button onClick={startCamera} className="flex-1 h-12 rounded-lg border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900">
                                                <Camera className="h-5 w-5 mr-2" />
                                                Buka Kamera
                                            </Button>
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                variant="outline"
                                                className="h-12 rounded-lg px-4 border-zinc-200"
                                                title="Upload foto"
                                            >
                                                Upload
                                            </Button>
                                        </>
                                    )}
                                    {cameraActive && (
                                        <Button
                                            onClick={takePhoto}
                                            className="flex-1 h-12 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
                                        >
                                            <Camera className="h-5 w-5 mr-2" />
                                            Ambil Foto
                                        </Button>
                                    )}
                                    {photo && (
                                        <Button
                                            onClick={() => { setPhoto(""); startCamera(); }}
                                            variant="outline"
                                            className="flex-1 h-12 rounded-lg border-zinc-200"
                                        >
                                            <RefreshCw className="h-5 w-5 mr-2" />
                                            Ulang
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-900">Lokasi</label>
                                <div className={cn(
                                    "rounded-lg border p-4 text-center transition-all",
                                    location ? "border-zinc-500 bg-zinc-50" : "border-zinc-200 bg-zinc-50"
                                )}>
                                    {location ? (
                                        <div className="space-y-1">
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto">
                                                <MapPin className="h-5 w-5 text-zinc-900" />
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900">Lokasi Terdeteksi</p>
                                            <p className="text-xs text-zinc-500">
                                                {location.lat.toFixed(4)}, {location.long.toFixed(4)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto">
                                                <MapPin className="h-5 w-5 text-zinc-400" />
                                            </div>
                                            <p className="text-sm text-zinc-500">Lokasi belum terdeteksi</p>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={getLocation}
                                    className={cn("w-full h-12 rounded-lg", location ? "border-zinc-200" : "bg-zinc-900 hover:bg-zinc-800 text-white")}
                                    variant={location ? "outline" : "default"}
                                >
                                    <MapPin className="h-5 w-5 mr-2" />
                                    {location ? "Perbarui Lokasi" : "Dapatkan Lokasi"}
                                </Button>
                            </div>

                            {/* Submit */}
                            <Button
                                onClick={handleCheckOut}
                                disabled={checkingOut || !canCheckOut}
                                className="w-full h-14 rounded-lg text-base bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                            >
                                {checkingOut ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <LogOut className="h-5 w-5 mr-2" />
                                        Check Out Sekarang
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

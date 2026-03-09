"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store"
import { dashboardApi, attendanceApi, DashboardStats, TeamAttendance, TeamLeave, TeamReport, AttendanceStats } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Users,
    Clock,
    AlertTriangle,
    CalendarDays,
    TrendingUp,
    UserCheck,
    UserX,
    FileText,
    DollarSign,
    Loader2,
    Home,
    MapPin,
    Briefcase
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { PageLoading } from "@/components/ui/page-loading"

export default function HRISDashboardClient() {
    const user = useAuthStore((state) => state.user)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
    const [teamAttendance, setTeamAttendance] = useState<TeamAttendance[]>([])
    const [teamLeaves, setTeamLeaves] = useState<TeamLeave[]>([])
    const [teamReports, setTeamReports] = useState<TeamReport[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            setLoading(true)
            setError("")

            if (user?.role === "HR_ADMIN" || user?.role === "OWNER") {
                // HR Admin and Owner - get HR stats and attendance stats
                const [statsData, attStats] = await Promise.all([
                    dashboardApi.getHRStats(),
                    attendanceApi.getTodayStats()
                ])
                setStats(statsData)
                setAttendanceStats(attStats)
            } else if (user?.role === "MANAGER") {
                const managerData = await dashboardApi.getManagerStats()
                setTeamAttendance(managerData.teamAttendance)
                setTeamLeaves(managerData.teamLeaves)
                setTeamReports(managerData.teamReports)
            } else {
                const empData = await dashboardApi.getEmployeeStats()
                setStats({
                    totalEmployees: 0,
                    todayAttendance: empData.todayAttendance ? 1 : 0,
                    lateEmployees: 0,
                    onLeave: empData.todayReport ? 1 : 0,
                    pendingLeaves: 0,
                })
            }
        } catch (err: any) {
            console.error("Failed to load dashboard:", err)
            setError("Gagal memuat data dashboard")
        } finally {
            setLoading(false)
        }
    }

    // Calculate pie chart data
    const getPieChartData = () => {
        if (!attendanceStats) return []
        return [
            { name: 'WFO', value: attendanceStats.wfoCount, color: '#3f3f46' },
            { name: 'WFH', value: attendanceStats.wfhCount, color: '#a1a1aa' },
            { name: 'WFA', value: attendanceStats.wfaCount, color: '#d4d4d8' },
            { name: 'Belum Absen', value: attendanceStats.notCheckedIn, color: '#ef4444' },
        ].filter(item => item.value > 0)
    }

    const totalChart = attendanceStats ? attendanceStats.wfoCount + attendanceStats.wfhCount + attendanceStats.wfaCount + attendanceStats.notCheckedIn : 0

    // Render based on user role
    const renderHRDashboard = () => (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Dashboard HR</h1>
                    <p className="text-zinc-500">Selamat datang, {user?.name}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/hris/employees">
                        <Button variant="outline" className="border-zinc-200">Data Pegawai</Button>
                    </Link>
                    <Link href="/hris/attendance">
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">Lihat Absensi</Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">Total Pegawai</p>
                                <p className="text-3xl font-bold text-zinc-900">{stats?.totalEmployees || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-zinc-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">Hadir Hari Ini</p>
                                <p className="text-3xl font-bold text-zinc-900">{stats?.todayAttendance || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-zinc-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">Terlambat</p>
                                <p className="text-3xl font-bold text-zinc-900">{stats?.lateEmployees || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-zinc-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">Cuti Hari Ini</p>
                                <p className="text-3xl font-bold text-zinc-900">{stats?.onLeave || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                <CalendarDays className="h-6 w-6 text-zinc-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Stats Pie Chart */}
            {attendanceStats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Statistik Kehadiran Hari Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center">
                                {/* Simple Pie Chart */}
                                <div className="relative w-48 h-48">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        {getPieChartData().map((item, index) => {
                                            const percentage = totalChart > 0 ? (item.value / totalChart) * 100 : 0
                                            const previousPercentage = getPieChartData()
                                                .slice(0, index)
                                                .reduce((acc, curr) => acc + (totalChart > 0 ? (curr.value / totalChart) * 100 : 0), 0)
                                            const dashArray = `${percentage} ${100 - percentage}`
                                            const dashOffset = 100 - previousPercentage
                                            return (
                                                <circle
                                                    key={item.name}
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="transparent"
                                                    stroke={item.color}
                                                    strokeWidth="20"
                                                    strokeDasharray={dashArray}
                                                    strokeDashoffset={dashOffset}
                                                    className="transition-all duration-500"
                                                />
                                            )
                                        })}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-zinc-900">{totalChart}</p>
                                            <p className="text-xs text-zinc-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {getPieChartData().map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-zinc-600">
                                            {item.name}: {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance Details */}
                    <Card className="border border-zinc-200 shadow-sm rounded-lg">
                        <CardHeader>
                            <CardTitle className="text-lg text-zinc-900">Detail Kehadiran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-md bg-zinc-100 flex items-center justify-center">
                                        <Home className="h-5 w-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">WFO (Work From Office)</p>
                                        <p className="text-sm text-zinc-500">Bekerja dari kantor</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{attendanceStats.wfoCount}</p>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-md bg-zinc-100 flex items-center justify-center">
                                        <Home className="h-5 w-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">WFH (Work From Home)</p>
                                        <p className="text-sm text-zinc-500">Bekerja dari rumah</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{attendanceStats.wfhCount}</p>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-md bg-zinc-100 flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">WFA (Work From Anywhere)</p>
                                        <p className="text-sm text-zinc-500">Bekerja dari lokasi lain</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{attendanceStats.wfaCount}</p>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-md">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-md bg-red-100 flex items-center justify-center">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">Belum Absen</p>
                                        <p className="text-sm text-zinc-500">Belum melakukan check-in</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-red-600">{attendanceStats.notCheckedIn}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/hris/employees">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-zinc-200 shadow-sm rounded-lg">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-zinc-600" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900">Kelola Pegawai</p>
                                <p className="text-sm text-zinc-500">Tambah, edit, atau nonaktifkan</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hris/payroll">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-zinc-200 shadow-sm rounded-lg">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-zinc-600" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900">Kelola Payroll</p>
                                <p className="text-sm text-zinc-500">Hitung dan bayarkan gaji</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hris/leave">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-zinc-200 shadow-sm rounded-lg">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                <CalendarDays className="h-6 w-6 text-zinc-600" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900">Approval Cuti</p>
                                <p className="text-sm text-zinc-500">{stats?.pendingLeaves || 0} pending</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )

    const renderManagerDashboard = () => (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Dashboard Manager</h1>
                    <p className="text-zinc-500">Selamat datang, {user?.name}</p>
                </div>
            </div>

            {/* Team Attendance */}
            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-900">
                        <Clock className="h-5 w-5" />
                        Absensi Tim Hari Ini
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {teamAttendance.length > 0 ? (
                        <div className="space-y-3">
                            {teamAttendance.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs bg-zinc-200 text-zinc-900 font-medium">
                                                {item.employeeName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-zinc-900">{item.employeeName}</p>
                                            <p className="text-xs text-zinc-500">
                                                {item.checkinTime ? `Check-in: ${item.checkinTime}` : "Belum check-in"}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "capitalize rounded-md text-xs",
                                        item.status === "ontime" && "bg-emerald-50 border-emerald-200 text-emerald-700",
                                        item.status === "late" && "bg-amber-50 border-amber-200 text-amber-700",
                                        item.status === "outside_radius" && "bg-red-50 border-red-200 text-red-700"
                                    )}>
                                        {item.status === "ontime" ? "Tepat Waktu" :
                                            item.status === "late" ? "Terlambat" : "Outside Radius"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-zinc-500 py-4">Belum ada data absensi tim</p>
                    )}
                </CardContent>
            </Card>

            {/* Team Leaves */}
            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-900">
                        <CalendarDays className="h-5 w-5" />
                        Request Cuti Tim
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {teamLeaves.length > 0 ? (
                        <div className="space-y-3">
                            {teamLeaves.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                                    <div>
                                        <p className="font-medium text-zinc-900">{item.employeeName}</p>
                                        <p className="text-xs text-zinc-500">
                                            {item.startDate} - {item.endDate}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "capitalize rounded-md text-xs",
                                        item.status === "pending" && "bg-amber-50 border-amber-200 text-amber-700",
                                        item.status === "approved" && "bg-emerald-50 border-emerald-200 text-emerald-700",
                                        item.status === "rejected" && "bg-red-50 border-red-200 text-red-700"
                                    )}>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-zinc-500 py-4">Belum ada request cuti</p>
                    )}
                </CardContent>
            </Card>

            {/* Team Reports */}
            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-900">
                        <FileText className="h-5 w-5" />
                        Laporan Kerja Terbaru
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {teamReports.length > 0 ? (
                        <div className="space-y-3">
                            {teamReports.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                                    <div>
                                        <p className="font-medium text-zinc-900">{item.employeeName}</p>
                                        <p className="text-xs text-zinc-500">{item.date} - {item.itemsCount} task</p>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "capitalize rounded-md text-xs",
                                        item.status === "submitted" && "bg-blue-50 border-blue-200 text-blue-700",
                                        item.status === "approved" && "bg-emerald-50 border-emerald-200 text-emerald-700",
                                        item.status === "rejected" && "bg-red-50 border-red-200 text-red-700"
                                    )}>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-zinc-500 py-4">Belum ada laporan</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )

    const renderEmployeeDashboard = () => (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Dashboard Karyawan</h1>
                    <p className="text-zinc-500">Selamat datang, {user?.name}</p>
                </div>
            </div>

            {/* Quick Actions for Employee */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/hris/attendance">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-zinc-200 shadow-sm rounded-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900">Absensi</p>
                                    <p className="text-sm text-zinc-500">Check in/out</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hris/daily-report">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-zinc-200 shadow-sm rounded-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900">Laporan Kerja</p>
                                    <p className="text-sm text-zinc-500">Buat laporan harian</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hris/leave">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-zinc-200 shadow-sm rounded-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                    <CalendarDays className="h-6 w-6 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900">Cuti & Izin</p>
                                    <p className="text-sm text-zinc-500">Ajukan cuti</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hris/payroll">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-zinc-200 shadow-sm rounded-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-md bg-zinc-100 flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900">Slip Gaji</p>
                                    <p className="text-sm text-zinc-500">Lihat slip gaji</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )

    if (loading) {
      return <PageLoading />
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <p className="text-red-600">{error}</p>
                    <Button onClick={loadDashboard} variant="outline" className="border-zinc-200">Coba Lagi</Button>
                </div>
            </div>
        )
    }

    // Render based on role
    switch (user?.role) {
        case "HR_ADMIN":
            return renderHRDashboard()
        case "MANAGER":
            return renderManagerDashboard()
        default:
            return renderEmployeeDashboard()
    }
}

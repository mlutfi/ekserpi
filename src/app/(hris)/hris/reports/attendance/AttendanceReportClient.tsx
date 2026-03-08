"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store"
import { attendanceApi, employeesApi, Attendance, Employee } from "@/lib/hris"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Clock,
    User,
    Calendar,
    Search,
    Loader2,
    Users,
    UserCircle,
    Filter,
    Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Role type for access control
type UserRole = "OWNER" | "HR_ADMIN" | "MANAGER" | "TEAM_LEADER" | "EMPLOYEE" | "STAFF"

export default function AttendanceReportClient() {
    const user = useAuthStore((state) => state.user)
    // const { toast } = useToast()

    const [activeTab, setActiveTab] = useState("my-attendance")
    const [loading, setLoading] = useState(true)
    const [myAttendance, setMyAttendance] = useState<Attendance[]>([])
    const [staffAttendance, setStaffAttendance] = useState<Attendance[]>([])
    const [myEmployee, setMyEmployee] = useState<Employee | null>(null)
    const [employees, setEmployees] = useState<Employee[]>([])

    // Filters
    const [startDate, setStartDate] = useState<string>(() => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return date.toISOString().split("T")[0]
    })
    const [endDate, setEndDate] = useState<string>(() => {
        return new Date().toISOString().split("T")[0]
    })
    const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    const userRole = user?.role as UserRole

    // Check if user can view staff attendance
    const canViewStaffAttendance = ["OWNER", "HR_ADMIN", "MANAGER", "TEAM_LEADER"].includes(userRole)

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        if (activeTab === "my-attendance") {
            loadMyAttendance()
        } else if (activeTab === "staff-attendance" && canViewStaffAttendance) {
            loadStaffAttendance()
        }
    }, [activeTab, startDate, endDate, selectedEmployee])

    const loadInitialData = async () => {
        try {
            setLoading(true)
            // Get current employee info
            try {
                const emp = await employeesApi.getMe()
                setMyEmployee(emp)
            } catch {
                // Employee profile not found
            }

            // Load employees list for filter (for managers, team leaders)
            if (canViewStaffAttendance) {
                const emps = await employeesApi.getAll()
                setEmployees(emps)
            }

            // Load initial attendance data
            await loadMyAttendance()
        } catch (err) {
            console.error("Failed to load initial data:", err)
            toast.error("Error", {
                description: "Gagal memuat data",
            })
        } finally {
            setLoading(false)
        }
    }

    const loadMyAttendance = async () => {
        try {
            setLoading(true)
            const data = await attendanceApi.getHistory(undefined, startDate, endDate)
            setMyAttendance(data)
        } catch (err) {
            console.error("Failed to load my attendance:", err)
            toast.error("Error", {
                description: "Gagal memuat data absensi saya",
            })
        } finally {
            setLoading(false)
        }
    }

    const loadStaffAttendance = async () => {
        try {
            setLoading(true)
            let data: Attendance[]

            // For TEAM_LEADER, filter by their team members
            if (userRole === "TEAM_LEADER" && myEmployee) {
                // Get all attendance and filter by team leader's staff
                data = await attendanceApi.getHistory(undefined, startDate, endDate)
                // Filter for employees where this user is the team leader
                const myTeamIds = employees
                    .filter(emp => emp.teamLeaderId === myEmployee.id)
                    .map(emp => emp.id)
                data = data.filter(att => myTeamIds.includes(att.employeeId))
            } else {
                // For OWNER, HR_ADMIN, MANAGER - get all attendance
                data = await attendanceApi.getHistory(undefined, startDate, endDate)
            }

            // Apply employee filter if selected
            if (selectedEmployee && selectedEmployee !== "all") {
                data = data.filter(att => att.employeeId === selectedEmployee)
            }

            setStaffAttendance(data)
        } catch (err) {
            console.error("Failed to load staff attendance:", err)
            toast.error("Error", {
                description: "Gagal memuat data absensi staff",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        if (activeTab === "my-attendance") {
            loadMyAttendance()
        } else {
            loadStaffAttendance()
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PRESENT: "border-emerald-200 text-emerald-700 bg-emerald-50",
            LATE: "border-amber-200 text-amber-700 bg-amber-50",
            OUTSIDE_RADIUS: "border-red-200 text-red-700 bg-red-50",
            ABSENT: "border-zinc-200 text-zinc-700 bg-zinc-50",
            ON_LEAVE: "border-blue-200 text-blue-700 bg-blue-50",
            PENDING_APPROVAL: "border-yellow-200 text-yellow-700 bg-yellow-50",
            APPROVED: "border-green-200 text-green-700 bg-green-50",
            REJECTED: "border-red-200 text-red-700 bg-red-50",
        }

        const labels: Record<string, string> = {
            PRESENT: "Tepat Waktu",
            LATE: "Terlambat",
            OUTSIDE_RADIUS: "Luar Radius",
            ABSENT: "Tidak Hadir",
            ON_LEAVE: "Cuti",
            PENDING_APPROVAL: "Menunggu Approval",
            APPROVED: "Disetujui",
            REJECTED: "Ditolak",
        }

        return (
            <Badge variant="outline" className={cn("font-medium", styles[status] || "border-zinc-200 text-zinc-700 bg-zinc-50")}>
                {labels[status] || status}
            </Badge>
        )
    }

    const getWorkTypeBadge = (workType: string) => {
        const styles: Record<string, string> = {
            WFO: "border-blue-200 text-blue-700 bg-blue-50",
            WFH: "border-purple-200 text-purple-700 bg-purple-50",
            WFA: "border-orange-200 text-orange-700 bg-orange-50",
        }

        return (
            <Badge variant="outline" className={cn("font-medium", styles[workType] || "border-zinc-200 text-zinc-700 bg-zinc-50")}>
                {workType}
            </Badge>
        )
    }

    const calculateWorkHours = (checkin?: string, checkout?: string) => {
        if (!checkin || !checkout) return "-"
        const start = new Date(`2000-01-01T${checkin}`)
        const end = new Date(`2000-01-01T${checkout}`)
        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return `${diff.toFixed(1)} jam`
    }

    // Filter data based on search query
    const filteredMyAttendance = myAttendance.filter(att =>
        att.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.status.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredStaffAttendance = staffAttendance.filter(att =>
        att.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.status.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get filtered employees for staff tab (team leader only sees their team)
    const getFilteredEmployees = () => {
        if (userRole === "TEAM_LEADER" && myEmployee) {
            return employees.filter(emp => emp.teamLeaderId === myEmployee.id)
        }
        return employees
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Report Absensi</h1>
                    <p className="text-sm text-zinc-500 mt-1">Lihat riwayat absensi dan laporan kehadiran</p>
                </div>
                <Button variant="outline" className="gap-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md bg-zinc-100/80 p-1 rounded-lg">
                    <TabsTrigger value="my-attendance" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm text-zinc-500 rounded-md">
                        <UserCircle className="h-4 w-4" />
                        My Absensi
                    </TabsTrigger>
                    {canViewStaffAttendance && (
                        <TabsTrigger value="staff-attendance" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm text-zinc-500 rounded-md">
                            <Users className="h-4 w-4" />
                            Staff Absensi
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Filters */}
                <Card className="border border-zinc-200 shadow-sm rounded-lg">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-zinc-400" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-auto border-zinc-200"
                                />
                                <span className="text-zinc-400">-</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-auto border-zinc-200"
                                />
                            </div>

                            {activeTab === "staff-attendance" && canViewStaffAttendance && (
                                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                    <SelectTrigger className="w-[200px] border-zinc-200">
                                        <SelectValue placeholder="Pilih Karyawan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Karyawan</SelectItem>
                                        {getFilteredEmployees().map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <Input
                                        placeholder="Cari..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 border-zinc-200 focus-visible:ring-zinc-900"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSearch} variant="secondary" className="gap-2 bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200 border border-zinc-200/50 shadow-sm">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* My Attendance Tab */}
                <TabsContent value="my-attendance" className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-zinc-200 shadow-sm rounded-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Total Hadir</p>
                                        <p className="text-xl font-bold text-zinc-900">
                                            {myAttendance.filter(a => ["PRESENT", "LATE", "OUTSIDE_RADIUS"].includes(a.status)).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-zinc-200 shadow-sm rounded-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Tepat Waktu</p>
                                        <p className="text-xl font-bold text-zinc-900">
                                            {myAttendance.filter(a => a.status === "PRESENT").length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-zinc-200 shadow-sm rounded-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Terlambat</p>
                                        <p className="text-xl font-bold text-zinc-900">
                                            {myAttendance.filter(a => a.status === "LATE").length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-zinc-200 shadow-sm rounded-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">WFH/WFA</p>
                                        <p className="text-xl font-bold text-zinc-900">
                                            {myAttendance.filter(a => ["WFH", "WFA"].includes(a.workType)).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                        <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                            <CardTitle className="text-base font-semibold text-zinc-900">Riwayat Absensi Saya</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                            <TableHead className="font-semibold text-zinc-900">Tanggal</TableHead>
                                            <TableHead className="font-semibold text-zinc-900">Check In</TableHead>
                                            <TableHead className="font-semibold text-zinc-900">Check Out</TableHead>
                                            <TableHead className="font-semibold text-zinc-900">Jam Kerja</TableHead>
                                            <TableHead className="font-semibold text-zinc-900">Mode</TableHead>
                                            <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-400" />
                                                    <p className="text-sm font-medium text-zinc-500 mt-2">Memuat data...</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredMyAttendance.length > 0 ? (
                                            filteredMyAttendance.map((att) => (
                                                <TableRow key={att.id}>
                                                    <TableCell className="font-medium text-zinc-900">
                                                        {new Date(att.date).toLocaleDateString("id-ID", {
                                                            weekday: "long",
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="text-zinc-600">{att.checkinTime || "-"}</TableCell>
                                                    <TableCell className="text-zinc-600">{att.checkoutTime || "-"}</TableCell>
                                                    <TableCell className="text-zinc-600">
                                                        {calculateWorkHours(att.checkinTime, att.checkoutTime)}
                                                    </TableCell>
                                                    <TableCell>{getWorkTypeBadge(att.workType)}</TableCell>
                                                    <TableCell>{getStatusBadge(att.status)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center mb-1">
                                                            <Calendar className="h-5 w-5 text-zinc-400" />
                                                        </div>
                                                        <p className="font-medium text-zinc-900">Tidak ada data absensi</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Staff Attendance Tab */}
                {canViewStaffAttendance && (
                    <TabsContent value="staff-attendance" className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-zinc-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-500">Total Kehadiran</p>
                                            <p className="text-xl font-bold text-zinc-900">
                                                {staffAttendance.filter(a => ["PRESENT", "LATE", "OUTSIDE_RADIUS"].includes(a.status)).length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-500">Tepat Waktu</p>
                                            <p className="text-xl font-bold text-zinc-900">
                                                {staffAttendance.filter(a => a.status === "PRESENT").length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-500">Terlambat</p>
                                            <p className="text-xl font-bold text-zinc-900">
                                                {staffAttendance.filter(a => a.status === "LATE").length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border border-zinc-200 shadow-sm rounded-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-500">Luar Radius</p>
                                            <p className="text-xl font-bold text-zinc-900">
                                                {staffAttendance.filter(a => a.status === "OUTSIDE_RADIUS").length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table */}
                        <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
                            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                                <CardTitle className="text-base font-semibold text-zinc-900">
                                    {userRole === "TEAM_LEADER" ? "Riwayat Absensi Tim" : "Riwayat Absensi Staff"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                                <TableHead className="font-semibold text-zinc-900">Tanggal</TableHead>
                                                <TableHead className="font-semibold text-zinc-900">Nama</TableHead>
                                                <TableHead className="font-semibold text-zinc-900">Check In</TableHead>
                                                <TableHead className="font-semibold text-zinc-900">Check Out</TableHead>
                                                <TableHead className="font-semibold text-zinc-900">Jam Kerja</TableHead>
                                                <TableHead className="font-semibold text-zinc-900">Mode</TableHead>
                                                <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-400" />
                                                        <p className="text-sm font-medium text-zinc-500 mt-2">Memuat data...</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredStaffAttendance.length > 0 ? (
                                                filteredStaffAttendance.map((att) => (
                                                    <TableRow key={att.id}>
                                                        <TableCell className="font-medium text-zinc-900">
                                                            {new Date(att.date).toLocaleDateString("id-ID", {
                                                                weekday: "long",
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                                                                    <User className="h-4 w-4 text-zinc-500" />
                                                                </div>
                                                                <span className="font-medium text-zinc-900">{att.employee?.name || "-"}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-zinc-600">{att.checkinTime || "-"}</TableCell>
                                                        <TableCell className="text-zinc-600">{att.checkoutTime || "-"}</TableCell>
                                                        <TableCell className="text-zinc-600">
                                                            {calculateWorkHours(att.checkinTime, att.checkoutTime)}
                                                        </TableCell>
                                                        <TableCell>{getWorkTypeBadge(att.workType)}</TableCell>
                                                        <TableCell>{getStatusBadge(att.status)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center mb-1">
                                                                <Users className="h-5 w-5 text-zinc-400" />
                                                            </div>
                                                            <p className="font-medium text-zinc-900">Tidak ada data absensi staff</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}

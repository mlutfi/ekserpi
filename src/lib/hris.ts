// HRIS API Types
export interface User {
    id: string
    name: string
    email: string
    role: 'HR_ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'STAFF' | 'EMPLOYEE' | 'OWNER' | 'OPS' | 'CASHIER'
    employeeId?: string
    mustChangePassword: boolean
}

export interface Department {
    id: string
    name: string
    description: string
}

export interface Position {
    id: string
    name: string
    level: number
}

export interface Employee {
    id: string
    nip: string
    name: string
    email: string
    phone: string
    address: string
    departmentId: string
    positionId: string
    department?: Department
    position?: Position
    joinDate: string
    employeeType?: 'FREELANCE_BURUH' | 'PKWT' | 'KARYAWAN_TETAP' | 'PKWTT' | 'HARIAN_LEPAS'
    status: 'ACTIVE' | 'INACTIVE' | 'RESIGNED' | 'active' | 'inactive'
    photo?: string
    ktpPhoto?: string
    managerId?: string
    manager?: Employee
    teamLeaderId?: string
    teamLeader?: Employee
    teamLeaderName?: string
    basicSalary?: number
    baseSalary?: number
    allowance?: number
    dailyRate?: number
    salary?: number
}

export interface Attendance {
    id: string
    employeeId: string
    employee?: Employee
    date: string
    checkinTime?: string
    checkinPhoto?: string
    checkinLat?: number
    checkinLong?: number
    checkinRadius?: number
    checkoutTime?: string
    checkoutPhoto?: string
    checkoutLat?: number
    checkoutLong?: number
    workType: 'WFO' | 'WFH' | 'WFA'
    status: 'PRESENT' | 'LATE' | 'OUTSIDE_RADIUS' | 'ABSENT' | 'ON_LEAVE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
    reason?: string // Reason for WFH/WFA
    approvedBy?: string
    approvedAt?: string
    notes?: string
    createdAt: string
}

export interface AttendanceStats {
    totalEmployees: number
    wfoCount: number
    wfhCount: number
    wfaCount: number
    notCheckedIn: number
}

export interface DailyReport {
    id: string
    employeeId: string
    employee?: Employee
    date: string
    notes?: string
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending'
    approvedBy?: string
    approverName?: string
    approvedAt?: string
    rejectionReason?: string
    items?: DailyReportItem[]
    createdAt: string
}

export interface DailyReportItem {
    id: string
    reportId: string
    title: string
    description?: string
    progress: number
    status: 'pending' | 'in_progress' | 'completed'
}

export interface LeaveRequest {
    id: string
    employeeId: string
    employee?: Employee
    leaveType: 'annual' | 'sick' | 'personal'
    startDate: string
    endDate: string
    days: number
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    approvedBy?: string
    approver?: Employee
    approvedAt?: string
    rejectionReason?: string
    createdAt: string
}

export interface Payroll {
    id: string
    employeeId: string
    employeeName?: string
    employeeType?: 'FREELANCE_BURUH' | 'PKWT' | 'KARYAWAN_TETAP' | 'PKWTT' | 'HARIAN_LEPAS'
    employee?: Employee
    period: string
    basicSalary: number
    allowance: number
    bonus: number
    commission?: number
    overtime: number
    absentDeduction: number
    lateDeduction: number
    bpjs: number
    bpjsEmployee?: number
    bpjsEmployer?: number
    tht: number
    tax: number
    otherDeduction: number
    totalIncome: number
    totalDeduction: number
    netSalary: number
    workDays: number
    presentDays: number
    lateDays: number
    absentDays: number
    leaveDays: number
    isProrated?: boolean
    prorateDays?: number
    periodDays?: number
    prorateFactor?: number
    isPaid: boolean
    paidAt?: string
    status: 'draft' | 'calculated' | 'paid'
    createdAt: string
}

// Dashboard Types
export interface DashboardStats {
    totalEmployees: number
    todayAttendance: number
    lateEmployees: number
    onLeave: number
    pendingLeaves: number
}

export interface TodayAttendanceStats {
    totalEmployees: number
    wfoCount: number
    wfhCount: number
    wfaCount: number
    notCheckedIn: number
}

export interface TeamAttendance {
    employeeId: string
    employeeName: string
    status: string
    checkinTime?: string
}

export interface TeamLeave {
    employeeId: string
    employeeName: string
    leaveType: string
    startDate: string
    endDate: string
    status: string
}

export interface TeamReport {
    employeeId: string
    employeeName: string
    date: string
    status: string
    itemsCount: number
}

// API Functions
import { api } from './api'

// Auth API
export const authApi = {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
        const response = await api.post('/auth/login', { email, password })
        return response.data.data
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout')
    },

    getMe: async (): Promise<User> => {
        const response = await api.get('/auth/me')
        return response.data.data
    },
}

// Employee API
export const employeesApi = {
    getAll: async (): Promise<Employee[]> => {
        const response = await api.get('/employees')
        // Backend returns { data: { employees: [...], total: n } }
        return response.data.data?.employees ?? response.data.data ?? []
    },

    getById: async (id: string): Promise<Employee> => {
        const response = await api.get(`/employees/${id}`)
        return response.data.data
    },

    create: async (data: Partial<Employee>): Promise<Employee> => {
        const response = await api.post('/employees', data)
        return response.data.data
    },

    update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
        const response = await api.put(`/employees/${id}`, data)
        return response.data.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/employees/${id}`)
    },

    getMe: async (): Promise<Employee> => {
        const response = await api.get('/employees/me')
        return response.data.data
    },

    getTeamLeaders: async (): Promise<Employee[]> => {
        const response = await api.get('/employees/team-leaders')
        return response.data.data ?? []
    },

    uploadPhoto: async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('photo', file)

        const response = await api.post('/employees/upload-photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data.data.imageUrl
    },

}

// Department API
export const departmentsApi = {
    getAll: async (): Promise<Department[]> => {
        const response = await api.get('/departments')
        return response.data.data ?? []
    },

    create: async (data: Partial<Department>): Promise<Department> => {
        const response = await api.post('/departments', data)
        return response.data.data
    },

    update: async (id: string, data: Partial<Department>): Promise<Department> => {
        const response = await api.put(`/departments/${id}`, data)
        return response.data.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/departments/${id}`)
    },
}

// Position API
export const positionsApi = {
    getAll: async (): Promise<Position[]> => {
        const response = await api.get('/positions')
        return response.data.data ?? []
    },

    create: async (data: Partial<Position>): Promise<Position> => {
        const response = await api.post('/positions', data)
        return response.data.data
    },

    update: async (id: string, data: Partial<Position>): Promise<Position> => {
        const response = await api.put(`/positions/${id}`, data)
        return response.data.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/positions/${id}`)
    },
}

// Attendance API
export const attendanceApi = {
    checkIn: async (data: {
        employeeId: string
        checkinPhoto: string
        checkinLat: number
        checkinLong: number
        workType: 'WFO' | 'WFH' | 'WFA'
        reason?: string // Required for WFH/WFA
    }): Promise<Attendance> => {
        const response = await api.post('/attendance/checkin', data)
        return response.data.data
    },

    checkOut: async (data: {
        employeeId: string
        checkoutPhoto: string
        checkoutLat: number
        checkoutLong: number
    }): Promise<Attendance> => {
        const response = await api.post('/attendance/checkout', data)
        return response.data.data
    },

    approve: async (attendanceId: string): Promise<Attendance> => {
        const response = await api.post('/attendance/approve', { attendanceId })
        return response.data.data
    },

    reject: async (attendanceId: string, reason?: string): Promise<Attendance> => {
        const response = await api.post(`/attendance/reject?reason=${reason || ''}`, { attendanceId })
        return response.data.data
    },

    getPendingApprovals: async (): Promise<Attendance[]> => {
        const response = await api.get('/attendance/pending')
        return response.data.data ?? []
    },

    getToday: async (): Promise<Attendance | null> => {
        const response = await api.get('/attendance/my-today')
        return response.data.data ?? null
    },

    getHistory: async (employeeId?: string, startDate?: string, endDate?: string): Promise<Attendance[]> => {
        const params = new URLSearchParams()
        if (employeeId) params.append('employeeId', employeeId)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await api.get(`/attendance/history?${params.toString()}`)
        return response.data.data ?? []
    },

    getLate: async (date?: string): Promise<Attendance[]> => {
        const response = await api.get(`/attendance/late${date ? `?date=${date}` : ''}`)
        return response.data.data ?? []
    },

    getTodayStats: async (): Promise<AttendanceStats> => {
        const response = await api.get('/attendance/stats')
        return response.data.data
    },
}

// Daily Report API
export const dailyReportApi = {
    create: async (data: {
        date: string
        notes?: string
        items: { title: string; description?: string; progress: number; status: string }[]
    }): Promise<DailyReport> => {
        const response = await api.post('/daily-report', data)
        return response.data.data
    },

    getPending: async (): Promise<DailyReport[]> => {
        const response = await api.get('/daily-report/pending')
        return response.data.data ?? []
    },

    getMyReports: async (startDate?: string, endDate?: string): Promise<DailyReport[]> => {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        const response = await api.get(`/daily-report/my?${params.toString()}`)
        return response.data.data ?? []
    },

    getTeamReports: async (managerId: string, startDate?: string, endDate?: string): Promise<DailyReport[]> => {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        const response = await api.get(`/daily-report/team/${managerId}?${params.toString()}`)
        return response.data.data ?? []
    },

    approve: async (id: string, approvedBy: string): Promise<DailyReport> => {
        const response = await api.post(`/daily-report/${id}/approve/${approvedBy}`, { status: 'APPROVED' })
        return response.data.data
    },

    reject: async (id: string, approvedBy: string, reason?: string): Promise<DailyReport> => {
        const response = await api.post(`/daily-report/${id}/reject/${approvedBy}`, { status: 'REJECTED', reason })
        return response.data.data
    },

    update: async (id: string, data: {
        date: string
        notes?: string
        items: { title: string; description?: string; progress: number; status: string }[]
    }): Promise<DailyReport> => {
        const response = await api.put(`/daily-report/${id}`, data)
        return response.data.data
    },
}

// Leave API
export const leaveApi = {
    request: async (data: {
        employeeId: string
        leaveType: 'annual' | 'sick' | 'personal'
        startDate: string
        endDate: string
        reason: string
    }): Promise<LeaveRequest> => {
        const response = await api.post('/leave', data)
        return response.data.data
    },

    getMyRequests: async (employeeId: string): Promise<LeaveRequest[]> => {
        const response = await api.get(`/leave/employee/${employeeId}`)
        return response.data.data ?? []
    },

    getPending: async (): Promise<LeaveRequest[]> => {
        const response = await api.get('/leave/pending')
        return response.data.data ?? []
    },

    getTeamLeaves: async (managerId: string): Promise<LeaveRequest[]> => {
        const response = await api.get(`/leave/team/${managerId}`)
        return response.data.data ?? []
    },

    approve: async (id: string): Promise<LeaveRequest> => {
        const response = await api.post(`/leave/${id}/approve`)
        return response.data.data
    },

    reject: async (id: string, reason: string): Promise<LeaveRequest> => {
        const response = await api.post(`/leave/${id}/reject`, { reason })
        return response.data.data
    },
}

// Payroll API
export const payrollApi = {
    getAll: async (period?: string, employeeId?: string): Promise<Payroll[]> => {
        const params = new URLSearchParams()
        if (period) params.append('period', period)
        if (employeeId) params.append('employeeId', employeeId)

        const response = await api.get(`/payroll?${params.toString()}`)
        return response.data.data ?? []
    },

    getMyPayroll: async (): Promise<Payroll[]> => {
        const response = await api.get('/payroll/my')
        return response.data.data ?? []
    },

    create: async (data: {
        employeeId: string
        period: string
        workDays?: number
        bonus?: number
        commission?: number
        overtime?: number
        lateDeduction?: number
        absentDeduction?: number
        bpjs?: number
        tht?: number
        tax?: number
        otherDeduction?: number
        notes?: string
    }): Promise<Payroll> => {
        const response = await api.post('/payroll', data)
        return response.data.data
    },

    calculate: async (period: string, employeeId?: string): Promise<Payroll[]> => {
        const url = employeeId
            ? `/payroll/calculate/${employeeId}?period=${period}`
            : `/payroll/calculate?period=${period}`
        const response = await api.post(url)
        return response.data.data ?? []
    },

    markAsPaid: async (id: string): Promise<Payroll> => {
        const response = await api.post(`/payroll/${id}/mark-paid`)
        return response.data.data
    },
    downloadSlipPdf: async (id: string): Promise<Blob> => {
        const response = await api.get(`/payroll/${id}/pdf`, {
            responseType: 'blob'
        })
        return response.data
    },
}

// Dashboard API
export const dashboardApi = {
    getHRStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/hr')
        return response.data.data
    },

    getManagerStats: async (): Promise<{
        teamAttendance: TeamAttendance[]
        teamLeaves: TeamLeave[]
        teamReports: TeamReport[]
    }> => {
        const response = await api.get('/dashboard/manager')
        return response.data.data
    },

    getEmployeeStats: async (): Promise<{
        employee: Employee | null
        todayAttendance: Attendance | null
        todayReport: DailyReport | null
        remainingLeave: number
        recentPayroll: Payroll | null
    }> => {
        const response = await api.get('/dashboard/employee')
        return response.data.data
    },
}

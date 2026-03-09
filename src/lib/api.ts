import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// Types
export interface User {
    id: string
    name: string
    email: string
    role: string
    permissions?: string[]
    mustChangePassword: boolean
    teamLeaderId?: string | null
    twoFactorEnabled: boolean
}

export interface LoginResponse {
    token?: string
    twoFactorRequired: boolean
    twoFactorToken?: string
    user: User
}

export interface Product {
    id: string
    categoryId?: string
    category?: string
    sku?: string
    barcode?: string
    name: string
    price: number
    cost?: number
    imageUrl?: string
    isActive: boolean
    qtyOnHand: number
}

export interface Category {
    id: string
    name: string
}

export interface SaleItem {
    id: string
    productId: string
    productName: string
    qty: number
    price: number
    subtotal: number
}

export interface Sale {
    id: string
    cashierId: string
    cashierName: string
    locationId: string
    locationName: string
    customerName?: string
    status: string
    total: number
    items: SaleItem[]
    createdAt: string
}

export type SplitPaymentMethod = 'cash' | 'qris_static' | 'transfer'

export interface SplitPaymentLine {
    method: SplitPaymentMethod
    amount: number
    bankDetails?: string
}

export interface SplitPaymentResult {
    method: SplitPaymentMethod
    amount: number
    bankDetails?: string
}

export interface SplitPaymentResponse {
    saleId: string
    total: number
    payments: SplitPaymentResult[]
}

import {
    ReportFilter,
    ReportSummary,
    DailyChartPoint,
    SaleItemDetail,
    SaleDetail,
    CashierOption,
    TopProduct,
    ProfitReportItem,
    ProfitReportResponse,
} from './reports'

import {
    StockIn,
    StockInRequest,
    StockOut,
    StockOutRequest,
    Inventory
} from './stock'

export type {
    ReportFilter,
    ReportSummary,
    DailyChartPoint,
    SaleItemDetail,
    SaleDetail,
    CashierOption,
    TopProduct,
    ProfitReportItem,
    ProfitReportResponse,
    StockIn,
    StockInRequest,
    StockOut,
    StockOutRequest,
    Inventory
}

// Auth API
export const authApi = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await api.post('/auth/login', { email, password })
        console.log('Login response:', response.data);
        return response.data.data
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout')
    },

    getMe: async (): Promise<User> => {
        const response = await api.get('/auth/me')
        return response.data.data
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.post('/auth/change-password', { currentPassword, newPassword })
    },

    verify2FALogin: async (code: string, twoFactorToken: string): Promise<LoginResponse> => {
        const response = await api.post('/auth/verify-2fa', { code, twoFactorToken })
        return response.data.data
    },

    setup2FA: async (): Promise<{ secret: string; qrUrl: string }> => {
        const response = await api.post('/auth/2fa/setup')
        return response.data.data
    },

    enable2FA: async (code: string): Promise<void> => {
        await api.post('/auth/2fa/enable', { code })
    },

    disable2FA: async (): Promise<void> => {
        await api.post('/auth/2fa/disable')
    },
}

// Products API
export const productsApi = {
    getAll: async (): Promise<Product[]> => {
        const response = await api.get('/products')
        return response.data.data ?? []
    },

    getById: async (id: string): Promise<Product> => {
        const response = await api.get(`/products/${id}`)
        return response.data.data
    },

    search: async (query: string): Promise<Product[]> => {
        const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`)
        return response.data.data ?? []
    },

    getByCategory: async (categoryId: string): Promise<Product[]> => {
        const response = await api.get(`/products/by-category?categoryId=${categoryId}`)
        return response.data.data ?? []
    },

    create: async (data: Partial<Product>): Promise<Product> => {
        const response = await api.post('/products', data)
        return response.data.data
    },

    update: async (id: string, data: Partial<Product>): Promise<Product> => {
        const response = await api.put(`/products/${id}`, data)
        return response.data.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/products/${id}`)
    },

    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('image', file)

        const response = await api.post('/products/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data.data.imageUrl
    },
}

// Categories API
export const categoriesApi = {
    getAll: async (): Promise<Category[]> => {
        const response = await api.get('/categories')
        return response.data.data ?? []
    },

    create: async (name: string): Promise<Category> => {
        const response = await api.post('/categories', { name })
        return response.data.data
    },

    update: async (id: string, name: string): Promise<Category> => {
        const response = await api.put(`/categories/${id}`, { name })
        return response.data.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`)
    },
}

// Sales API
export const salesApi = {
    getAll: async (status?: string): Promise<Sale[]> => {
        const suffix = status ? `?status=${encodeURIComponent(status)}` : ''
        const response = await api.get(`/sales${suffix}`)
        return response.data.data ?? []
    },

    create: async (locationId: string, items: { productId: string; qty: number }[], customerName?: string): Promise<Sale> => {
        const response = await api.post('/sales', { locationId, items, customerName })
        return response.data.data
    },

    getById: async (id: string): Promise<Sale> => {
        const response = await api.get(`/sales/${id}`)
        return response.data.data
    },

    updateStatus: async (id: string, status: "CANCELLED"): Promise<Sale> => {
        const response = await api.put(`/sales/${id}/status`, { status })
        return response.data.data
    },

    payCash: async (id: string, amount: number): Promise<void> => {
        await api.post(`/sales/${id}/pay-cash`, { amount })
    },

    paySplit: async (id: string, payments: SplitPaymentLine[]): Promise<SplitPaymentResponse> => {
        const response = await api.post(`/sales/${id}/pay-split`, { payments })
        return response.data.data
    },

    payQRIS: async (id: string): Promise<{ id: string; qrisUrl: string | null; providerRef: string | null; status: string }> => {
        const response = await api.post(`/sales/${id}/pay-qris`)
        return response.data.data
    },

    payQRISStatic: async (id: string): Promise<void> => {
        await api.post(`/sales/${id}/pay-qris-static`)
    },

    payTransfer: async (id: string, bankDetails: string): Promise<void> => {
        await api.post(`/sales/${id}/pay-transfer`, { bankDetails })
    },

    generateSnapToken: async (id: string): Promise<{ token: string; redirectUrl: string }> => {
        const response = await api.post(`/sales/${id}/snap`)
        return response.data.data
    },

    getQRISStatus: async (saleId: string): Promise<{ paymentId: string; saleId: string; status: string; transactionId: string }> => {
        const response = await api.get(`/sales/${saleId}/qris-status`)
        return response.data.data
    },

    getDailyReport: async (date?: string): Promise<{
        date: string
        totalSales: number
        totalRevenue: number
        totalItems: number
        cashSales: number
        qrisSales: number
    }> => {
        const response = await api.get(`/sales/daily-report${date ? `?date=${date}` : ''}`)
        return response.data.data
    },
}

// Reports API
export const reportsApi = {
    getSummary: async (filter?: ReportFilter): Promise<ReportSummary> => {
        const params = new URLSearchParams()
        if (filter?.startDate) params.append('startDate', filter.startDate)
        if (filter?.endDate) params.append('endDate', filter.endDate)
        if (filter?.cashierId) params.append('cashierId', filter.cashierId)
        if (filter?.paymentMethod) params.append('paymentMethod', filter.paymentMethod)

        const response = await api.get(`/reports/summary?${params.toString()}`)
        return response.data.data
    },

    getChart: async (filter?: ReportFilter): Promise<DailyChartPoint[]> => {
        const params = new URLSearchParams()
        if (filter?.startDate) params.append('startDate', filter.startDate)
        if (filter?.endDate) params.append('endDate', filter.endDate)
        if (filter?.cashierId) params.append('cashierId', filter.cashierId)
        if (filter?.paymentMethod) params.append('paymentMethod', filter.paymentMethod)

        const response = await api.get(`/reports/chart?${params.toString()}`)
        return response.data.data ?? []
    },

    getSales: async (filter?: ReportFilter): Promise<SaleDetail[]> => {
        const params = new URLSearchParams()
        if (filter?.startDate) params.append('startDate', filter.startDate)
        if (filter?.endDate) params.append('endDate', filter.endDate)
        if (filter?.cashierId) params.append('cashierId', filter.cashierId)
        if (filter?.paymentMethod) params.append('paymentMethod', filter.paymentMethod)

        const response = await api.get(`/reports/sales?${params.toString()}`)
        return response.data.data ?? []
    },

    exportExcel: async (filter?: ReportFilter): Promise<Blob> => {
        const params = new URLSearchParams()
        if (filter?.startDate) params.append('startDate', filter.startDate)
        if (filter?.endDate) params.append('endDate', filter.endDate)
        if (filter?.cashierId) params.append('cashierId', filter.cashierId)
        if (filter?.paymentMethod) params.append('paymentMethod', filter.paymentMethod)

        const response = await api.get(`/reports/export?${params.toString()}`, {
            responseType: 'blob'
        })
        return response.data
    },

    getCashiers: async (): Promise<CashierOption[]> => {
        const response = await api.get('/reports/cashiers')
        return response.data.data ?? []
    },

    getTopProducts: async (limit: number = 10): Promise<TopProduct[]> => {
        const response = await api.get(`/reports/top-products?limit=${limit}`)
        return response.data.data ?? []
    },
    getProfitReport: async (filter?: ReportFilter): Promise<ProfitReportResponse> => {
        const response = await api.get('/reports/profit', { params: filter })
        return response.data.data
    },
}

export const stockApi = {
    addStockIn: async (data: StockInRequest): Promise<StockIn> => {
        const response = await api.post('/stock/in', data)
        return response.data.data
    },
    getStockIns: async (page = 1, limit = 20): Promise<{ data: StockIn[]; meta: any }> => {
        const response = await api.get('/stock/in', { params: { page, limit } })
        return { data: response.data.data ?? [], meta: response.data.meta }
    },
    addStockOut: async (data: StockOutRequest): Promise<StockOut> => {
        const response = await api.post('/stock/out', data)
        return response.data.data
    },
    getStockOuts: async (page = 1, limit = 20): Promise<{ data: StockOut[]; meta: any }> => {
        const response = await api.get('/stock/out', { params: { page, limit } })
        return { data: response.data.data ?? [], meta: response.data.meta }
    },
    getInventory: async (locationId?: string): Promise<Inventory[]> => {
        const response = await api.get('/stock/inventory', { params: { locationId } })
        return response.data.data ?? []
    }
}

// Settings API
export interface Setting {
    id: string
    key: string
    value: string
}

export interface BankAccount {
    id: string
    bankName: string
    accountNumber: string
    accountName: string
}

export interface PosPaymentSettings {
    cash: boolean
    qrisMidtrans: boolean
    qrisStatic: boolean
    qrisStaticImage: string
    bankTransfer: boolean
    bankAccounts: BankAccount[]
}

export const settingsApi = {
    getModules: async (): Promise<Setting> => {
        const response = await api.get('/settings/modules')
        return response.data.data
    },
    updateModules: async (modules: string[]): Promise<Setting> => {
        const response = await api.put('/settings/modules', { value: JSON.stringify(modules) })
        return response.data.data
    },
    getPosPayment: async (): Promise<PosPaymentSettings> => {
        const response = await api.get('/settings/pos-payment')
        return JSON.parse(response.data.data.value)
    },
    updatePosPayment: async (data: PosPaymentSettings): Promise<Setting> => {
        const response = await api.put('/settings/pos-payment', { value: JSON.stringify(data) })
        return response.data.data
    },
    uploadQrisImage: async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('image', file)
        const response = await api.post('/settings/upload-qris', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data.data.imageUrl
    },
}

// Users API
export interface CreateUserRequest {
    name: string
    email: string
    password: string
    role: string
    teamLeaderId?: string | null
}

export interface UpdateUserRequest {
    name?: string
    email?: string
    password?: string
    role?: string
    teamLeaderId?: string | null
}

export interface RoleSummary {
    role: string
    label: string
    userCount: number
}

export interface RolePermission {
    id: string
    resource: string
    action: string
    code: string
    isAllowed: boolean
    description: string
}

export interface RolePermissionsResponse {
    role: string
    label: string
    permissions: RolePermission[]
}

export const usersApi = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get('/users')
        return response.data.data ?? []
    },
    getById: async (id: string): Promise<User> => {
        const response = await api.get(`/users/${id}`)
        return response.data.data
    },
    create: async (data: CreateUserRequest): Promise<User> => {
        const response = await api.post('/users', data)
        return response.data.data
    },
    update: async (id: string, data: UpdateUserRequest): Promise<User> => {
        const response = await api.put(`/users/${id}`, data)
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`)
    },
}

export const rolesApi = {
    getAll: async (): Promise<RoleSummary[]> => {
        const response = await api.get('/roles')
        return response.data.data ?? []
    },
    getPermissions: async (role: string): Promise<RolePermissionsResponse> => {
        const response = await api.get(`/roles/${encodeURIComponent(role)}/permissions`)
        return response.data.data
    },
    updatePermissions: async (
        role: string,
        permissions: Array<{
            resource: string
            action: string
            isAllowed: boolean
            description?: string
        }>
    ): Promise<RolePermissionsResponse> => {
        const response = await api.put(`/roles/${encodeURIComponent(role)}/permissions`, {
            permissions,
        })
        return response.data.data
    },
}

// Location API
export interface Location {
    id: string
    name: string
    address?: string
    isDefault: boolean
}

export const locationsApi = {
    getAll: async (): Promise<Location[]> => {
        const response = await api.get('/locations')
        return response.data.data ?? []
    },
    create: async (data: Partial<Location>): Promise<Location> => {
        const response = await api.post('/locations', data)
        return response.data.data
    },
    update: async (id: string, data: Partial<Location>): Promise<Location> => {
        const response = await api.put(`/locations/${id}`, data)
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/locations/${id}`)
    },
}

// Supplier API
export interface Supplier {
    id: string
    name: string
    contactName?: string
    // Backward compatibility with existing frontend usage
    contactPerson?: string
    phone?: string
    email?: string
    address?: string
    isActive?: boolean
}

export const suppliersApi = {
    getAll: async (): Promise<Supplier[]> => {
        const response = await api.get('/suppliers')
        return response.data.data ?? []
    },
    create: async (data: Partial<Supplier>): Promise<Supplier> => {
        const response = await api.post('/suppliers', data)
        return response.data.data
    },
    update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
        const response = await api.put(`/suppliers/${id}`, data)
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/suppliers/${id}`)
    },
}

// Purchase Order API
export interface PurchaseOrderItem {
    id?: string
    productId: string
    productName?: string
    qtyOrdered: number
    qtyReceived?: number
    costPerUnit: number
    subtotal?: number
}

export interface PurchaseOrder {
    id: string
    poNumber: string
    supplierId: string
    supplierName?: string
    locationId: string
    locationName?: string
    status: string
    totalAmount: number
    note?: string
    orderDate?: string
    items: PurchaseOrderItem[]
    createdAt: string
}

export const purchaseOrdersApi = {
    getAll: async (): Promise<PurchaseOrder[]> => {
        const response = await api.get('/purchase-orders')
        return response.data.data ?? []
    },
    getById: async (id: string): Promise<PurchaseOrder> => {
        const response = await api.get(`/purchase-orders/${id}`)
        return response.data.data
    },
    create: async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
        const response = await api.post('/purchase-orders', data)
        return response.data.data
    },
    updateStatus: async (id: string, status: string): Promise<PurchaseOrder> => {
        const response = await api.put(`/purchase-orders/${id}/status`, { status })
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/purchase-orders/${id}`)
    },
}

// Stock Transfer API
export interface StockTransferItem {
    id?: string
    productId: string
    productName?: string
    qty: number
}

export interface StockTransfer {
    id: string
    transferNumber: string
    sourceLocationId: string
    sourceLocationName?: string
    destLocationId: string
    destLocationName?: string
    status: string
    note?: string
    items: StockTransferItem[]
    createdAt: string
}

export const stockTransfersApi = {
    getAll: async (): Promise<StockTransfer[]> => {
        const response = await api.get('/stock-transfers')
        return response.data.data ?? []
    },
    getById: async (id: string): Promise<StockTransfer> => {
        const response = await api.get(`/stock-transfers/${id}`)
        return response.data.data
    },
    create: async (data: Partial<StockTransfer>): Promise<StockTransfer> => {
        const response = await api.post('/stock-transfers', data)
        return response.data.data
    },
    updateStatus: async (id: string, status: string): Promise<StockTransfer> => {
        const response = await api.put(`/stock-transfers/${id}/status`, { status })
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/stock-transfers/${id}`)
    },
}

// Stock Opname API
export interface StockOpnameItem {
    id?: string
    productId: string
    productName?: string
    qtySystem: number
    qtyActual: number
    qtyDelta?: number
}

export interface StockOpname {
    id: string
    opnameNumber: string
    locationId: string
    locationName?: string
    status: string
    note?: string
    items: StockOpnameItem[]
    createdAt: string
}

export const stockOpnamesApi = {
    getAll: async (): Promise<StockOpname[]> => {
        const response = await api.get('/stock-opnames')
        return response.data.data ?? []
    },
    getById: async (id: string): Promise<StockOpname> => {
        const response = await api.get(`/stock-opnames/${id}`)
        return response.data.data
    },
    create: async (data: Partial<StockOpname>): Promise<StockOpname> => {
        const response = await api.post('/stock-opnames', data)
        return response.data.data
    },
    updateStatus: async (id: string, status: string): Promise<StockOpname> => {
        const response = await api.put(`/stock-opnames/${id}/status`, { status })
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/stock-opnames/${id}`)
    },
}

// Assets API
export interface Asset {
    id: string
    assetCode: string
    name: string
    category: string
    purchaseDate: string
    acquisitionCost: number
    residualValue: number
    usefulLifeMonths: number
    depreciationMethod: string
    status: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "DISPOSED"
    locationId?: string | null
    locationName?: string
    note?: string | null
    createdById: string
    createdByName?: string
    createdAt: string
    currentBookValue: number
}

export interface CreateAssetRequest {
    assetCode: string
    name: string
    category: string
    purchaseDate: string
    acquisitionCost: number
    residualValue: number
    usefulLifeMonths: number
    locationId?: string
    note?: string
}

export interface UpdateAssetRequest {
    assetCode?: string
    name?: string
    category?: string
    purchaseDate?: string
    acquisitionCost?: number
    residualValue?: number
    usefulLifeMonths?: number
    locationId?: string
    status?: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "DISPOSED"
    note?: string
}

export interface AssetAssignment {
    id: string
    assetId: string
    assetCode: string
    assetName: string
    assigneeType: "USER" | "DEPARTMENT" | "LOCATION" | "OTHER"
    assigneeRef?: string | null
    assigneeName: string
    assignedAt: string
    returnedAt?: string | null
    conditionOut?: string | null
    conditionIn?: string | null
    note?: string | null
    status: "ACTIVE" | "RETURNED"
    createdById: string
    createdByName?: string
    createdAt: string
}

export interface CreateAssetAssignmentRequest {
    assetId: string
    assigneeType: "USER" | "DEPARTMENT" | "LOCATION" | "OTHER"
    assigneeRef?: string
    assigneeName: string
    assignedAt: string
    conditionOut?: string
    note?: string
}

export interface ReturnAssetAssignmentRequest {
    returnedAt?: string
    conditionIn?: string
    note?: string
}

export interface AssetMaintenance {
    id: string
    assetId: string
    assetCode: string
    assetName: string
    maintenanceDate: string
    type: "PREVENTIVE" | "CORRECTIVE" | "INSPECTION"
    vendor?: string | null
    cost: number
    description?: string | null
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
    completedAt?: string | null
    createdById: string
    createdByName?: string
    createdAt: string
}

export interface CreateAssetMaintenanceRequest {
    assetId: string
    maintenanceDate: string
    type: "PREVENTIVE" | "CORRECTIVE" | "INSPECTION"
    vendor?: string
    cost: number
    description?: string
    status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
}

export interface AssetDepreciation {
    id: string
    assetId: string
    assetCode: string
    assetName: string
    period: string
    openingBookValue: number
    depreciationValue: number
    closingBookValue: number
    status: "DRAFT" | "POSTED"
    postedAt?: string | null
    createdById: string
    createdByName?: string
    createdAt: string
}

export const assetsApi = {
    getAll: async (): Promise<Asset[]> => {
        const response = await api.get('/assets')
        return response.data.data ?? []
    },
    getById: async (id: string): Promise<Asset> => {
        const response = await api.get(`/assets/${id}`)
        return response.data.data
    },
    create: async (data: CreateAssetRequest): Promise<Asset> => {
        const response = await api.post('/assets', data)
        return response.data.data
    },
    update: async (id: string, data: UpdateAssetRequest): Promise<Asset> => {
        const response = await api.put(`/assets/${id}`, data)
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/assets/${id}`)
    },
}

export const assetAssignmentsApi = {
    getAll: async (): Promise<AssetAssignment[]> => {
        const response = await api.get('/asset-assignments')
        return response.data.data ?? []
    },
    create: async (data: CreateAssetAssignmentRequest): Promise<AssetAssignment> => {
        const response = await api.post('/asset-assignments', data)
        return response.data.data
    },
    returnAsset: async (id: string, data: ReturnAssetAssignmentRequest): Promise<AssetAssignment> => {
        const response = await api.put(`/asset-assignments/${id}/return`, data)
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/asset-assignments/${id}`)
    },
}

export const assetMaintenancesApi = {
    getAll: async (): Promise<AssetMaintenance[]> => {
        const response = await api.get('/asset-maintenances')
        return response.data.data ?? []
    },
    create: async (data: CreateAssetMaintenanceRequest): Promise<AssetMaintenance> => {
        const response = await api.post('/asset-maintenances', data)
        return response.data.data
    },
    updateStatus: async (id: string, status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"): Promise<AssetMaintenance> => {
        const response = await api.put(`/asset-maintenances/${id}/status`, { status })
        return response.data.data
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/asset-maintenances/${id}`)
    },
}

export const assetDepreciationsApi = {
    getAll: async (period?: string): Promise<AssetDepreciation[]> => {
        const suffix = period ? `?period=${encodeURIComponent(period)}` : ''
        const response = await api.get(`/asset-depreciations${suffix}`)
        return response.data.data ?? []
    },
    generate: async (period: string): Promise<AssetDepreciation[]> => {
        const response = await api.post('/asset-depreciations/generate', { period })
        return response.data.data ?? []
    },
    updateStatus: async (id: string, status: "DRAFT" | "POSTED"): Promise<AssetDepreciation> => {
        const response = await api.put(`/asset-depreciations/${id}/status`, { status })
        return response.data.data
    },
}

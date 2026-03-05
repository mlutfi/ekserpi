export interface ReportFilter {
    startDate?: string
    endDate?: string
    cashierId?: string
    paymentMethod?: string
}

export interface DailySummary {
    date: string
    totalSales: number
    totalRevenue: number
    totalItems: number
    cashSales: number
    qrisSales: number
}

export interface DailyChartPoint {
    date: string
    revenue: number
    salesCount: number
}

export interface ReportSummary {
    totalRevenue: number
    totalTransactions: number
    totalItems: number
    averageOrder: number
    cashRevenue: number
    cashTransactions: number
    qrisRevenue: number
    qrisTransactions: number
}

export interface SaleItemDetail {
    productName: string
    quantity: number
    price: number
    subtotal: number
}

export interface SaleDetail {
    id: string
    cashierName: string
    customerName?: string
    total: number
    paymentMethod: string
    itemCount: number
    items: SaleItemDetail[]
    createdAt: string
}

export interface CashierOption {
    id: string
    name: string
}

export interface TopProduct {
    productId: string
    productName: string
    imageUrl: string
    totalQty: number
    totalSales: number
}

export interface ProfitReportItem {
    productId: string
    productName: string
    categoryName: string
    qtySold: number
    avgCost: number
    sellingPrice: number
    revenue: number
    cogs: number
    profit: number
    profitMargin: number
}

export interface ProfitReportResponse {
    items: ProfitReportItem[]
    totalRevenue: number
    totalCogs: number
    totalProfit: number
}

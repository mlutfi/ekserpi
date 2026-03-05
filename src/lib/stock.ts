export interface StockIn {
    id: string
    productId: string
    productName: string
    qty: number
    costPerUnit: number
    note: string
    createdBy: string
    createdAt: string
}

export interface StockInRequest {
    productId: string
    qty: number
    costPerUnit: number
    note?: string
}

export interface StockOut {
    id: string
    productId: string
    productName: string
    qty: number
    reason: string
    note: string
    createdBy: string
    createdAt: string
}

export interface StockOutRequest {
    productId: string
    qty: number
    reason: 'REFUND' | 'EXPIRED' | 'DAMAGED' | 'OTHER'
    note?: string
}

export interface Inventory {
    productId: string
    productName: string
    category: string
    sku: string
    qtyOnHand: number
}

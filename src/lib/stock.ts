export interface StockIn {
    id: string
    productId: string
    productName: string
    locationId: string
    locationName: string
    supplierId?: string | null
    supplierName?: string | null
    purchaseOrderId?: string | null
    purchaseOrderNumber?: string | null
    qty: number
    costPerUnit: number
    note: string
    expiryDate?: string | null
    batchNumber?: string | null
    createdBy: string
    createdAt: string
}

export interface StockInRequest {
    productId: string
    locationId: string
    supplierId?: string
    purchaseOrderId?: string
    qty: number
    costPerUnit: number
    note?: string
    expiryDate?: string
    batchNumber?: string
}

export interface StockOut {
    id: string
    productId: string
    productName: string
    locationId: string
    locationName: string
    qty: number
    reason: string
    note: string
    createdBy: string
    createdAt: string
}

export interface StockOutRequest {
    productId: string
    locationId: string
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
    avgCost: number
    locationId: string
    locationName: string
    batchNumber?: string
    expiryDate?: string
}

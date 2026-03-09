import type { Metadata } from "next"
import StockTransfersClient from "../../stock-transfers/StockTransfersClient"

export const metadata: Metadata = {
  title: "Stock Transfer - Admin XRP",
}

export default function InventoryStockTransfersPage() {
  return <StockTransfersClient />
}

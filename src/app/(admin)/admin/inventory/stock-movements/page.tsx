import type { Metadata } from "next"
import StockClient from "../../stock/StockClient"

export const metadata: Metadata = {
  title: "Stock Movement - Admin XRP",
}

export default function InventoryStockMovementsPage() {
  return <StockClient />
}

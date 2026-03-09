import type { Metadata } from "next"
import StockOpnamesClient from "../../stock-opnames/StockOpnamesClient"

export const metadata: Metadata = {
  title: "Stock Opname - Admin XRP",
}

export default function InventoryStockOpnamesPage() {
  return <StockOpnamesClient />
}

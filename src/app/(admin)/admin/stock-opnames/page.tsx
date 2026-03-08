import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Stock Opname - Admin XRP",
}

import StockOpnamesClient from "./StockOpnamesClient"

export default function StockOpnamesPage() {
    return <StockOpnamesClient />
}

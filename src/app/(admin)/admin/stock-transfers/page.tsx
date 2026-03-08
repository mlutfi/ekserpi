import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Transfer Stok - Admin XRP",
}

import StockTransfersClient from "./StockTransfersClient"

export default function StockTransfersPage() {
    return <StockTransfersClient />
}

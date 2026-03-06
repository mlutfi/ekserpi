import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Stok",
}

import StockClient from "./StockClient"

export default function StockPage() {
    return <StockClient />
}

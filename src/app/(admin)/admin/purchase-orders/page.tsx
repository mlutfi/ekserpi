import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Purchase Order - Admin XRP",
}

import PurchaseOrdersClient from "./PurchaseOrdersClient"

export default function PurchaseOrdersPage() {
    return <PurchaseOrdersClient />
}

import type { Metadata } from "next"
import PurchaseOrdersClient from "../../purchase-orders/PurchaseOrdersClient"

export const metadata: Metadata = {
  title: "Purchase Order - Admin XRP",
}

export default function PurchaseOrdersPage() {
  return <PurchaseOrdersClient />
}

import type { Metadata } from "next"
import PurchaseRequestsClient from "./PurchaseRequestsClient"

export const metadata: Metadata = {
  title: "Purchase Request - Admin XRP",
}

export default function PurchaseRequestsPage() {
  return <PurchaseRequestsClient />
}

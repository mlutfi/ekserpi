import type { Metadata } from "next"
import PurchaseReturnsClient from "./PurchaseReturnsClient"

export const metadata: Metadata = {
  title: "Purchase Return - Admin XRP",
}

export default function PurchaseReturnsPage() {
  return <PurchaseReturnsClient />
}

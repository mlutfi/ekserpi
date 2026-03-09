import type { Metadata } from "next"
import SuppliersClient from "../../suppliers/SuppliersClient"

export const metadata: Metadata = {
  title: "Suppliers - Admin XRP",
}

export default function PurchaseSuppliersPage() {
  return <SuppliersClient />
}

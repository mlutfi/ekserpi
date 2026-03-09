import type { Metadata } from "next"
import SalesPosClient from "./SalesPosClient"

export const metadata: Metadata = {
  title: "POS - Admin XRP",
}

export default function SalesPosPage() {
  return <SalesPosClient />
}

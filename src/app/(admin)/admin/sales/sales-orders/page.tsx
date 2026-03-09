import type { Metadata } from "next"
import SalesOrdersClient from "./SalesOrdersClient"

export const metadata: Metadata = {
  title: "Sales Order - Admin XRP",
}

export default function SalesOrdersPage() {
  return <SalesOrdersClient />
}

import type { Metadata } from "next"
import SalesReturnsClient from "./SalesReturnsClient"

export const metadata: Metadata = {
  title: "Sales Return - Admin XRP",
}

export default function SalesReturnsPage() {
  return <SalesReturnsClient />
}

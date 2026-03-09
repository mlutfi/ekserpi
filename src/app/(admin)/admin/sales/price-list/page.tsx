import type { Metadata } from "next"
import PriceListClient from "./PriceListClient"

export const metadata: Metadata = {
  title: "Price List - Admin XRP",
}

export default function PriceListPage() {
  return <PriceListClient />
}

import type { Metadata } from "next"
import GoodsReceiptsClient from "./GoodsReceiptsClient"

export const metadata: Metadata = {
  title: "Penerimaan Barang - Admin XRP",
}

export default function GoodsReceiptsPage() {
  return <GoodsReceiptsClient />
}

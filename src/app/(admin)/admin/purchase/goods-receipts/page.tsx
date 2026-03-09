import type { Metadata } from "next"
import GoodsReceiptsClient from "./GoodsReceiptsClient"

export const metadata: Metadata = {
  title: "Goods Receipt - Admin XRP",
}

export default function GoodsReceiptsPage() {
  return <GoodsReceiptsClient />
}

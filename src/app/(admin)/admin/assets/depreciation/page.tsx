import type { Metadata } from "next"
import DepreciationClient from "./DepreciationClient"

export const metadata: Metadata = {
  title: "Depreciation - Admin XRP",
}

export default function DepreciationPage() {
  return <DepreciationClient />
}

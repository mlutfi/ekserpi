import type { Metadata } from "next"
import AssetAssignmentsClient from "./AssetAssignmentsClient"

export const metadata: Metadata = {
  title: "Asset Assignment - Admin XRP",
}

export default function AssetAssignmentsPage() {
  return <AssetAssignmentsClient />
}

import type { Metadata } from "next"
import AssetRegisterClient from "./AssetRegisterClient"

export const metadata: Metadata = {
  title: "Asset Register - Admin XRP",
}

export default function AssetRegisterPage() {
  return <AssetRegisterClient />
}

import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Payments - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Payments"
      description="Kelola arus pembayaran masuk dan keluar."
    />
  )
}

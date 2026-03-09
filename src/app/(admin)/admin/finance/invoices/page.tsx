import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Invoices - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Invoices"
      description="Kelola invoice penjualan dan pembelian."
    />
  )
}

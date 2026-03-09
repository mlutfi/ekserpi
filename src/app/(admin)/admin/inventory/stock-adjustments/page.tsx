import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Stock Adjustment - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Stock Adjustment"
      description="Kelola penyesuaian stok karena selisih atau koreksi."
    />
  )
}

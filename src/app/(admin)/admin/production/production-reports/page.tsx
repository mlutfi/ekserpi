import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Production Report - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Production Report"
      description="Lihat laporan hasil produksi periodik."
    />
  )
}

import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Journal Entries - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Journal Entries"
      description="Kelola jurnal transaksi akuntansi."
    />
  )
}

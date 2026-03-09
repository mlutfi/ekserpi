import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Bill of Materials - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Bill of Materials"
      description="Kelola komposisi bahan baku untuk proses produksi."
    />
  )
}

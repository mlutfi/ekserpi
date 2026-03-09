import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Expenses - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Expenses"
      description="Kelola pengeluaran operasional perusahaan."
    />
  )
}

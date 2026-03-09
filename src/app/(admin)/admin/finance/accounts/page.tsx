import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Accounts - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Accounts"
      description="Kelola akun keuangan (chart of accounts)."
    />
  )
}

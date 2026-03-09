import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Production Order - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Production Order"
      description="Kelola perintah produksi dan target output."
    />
  )
}

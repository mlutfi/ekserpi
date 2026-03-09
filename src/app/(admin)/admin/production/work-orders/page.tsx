import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Work Orders - Admin XRP",
}

export default function Page() {
  return (
    <ErpModulePage
      title="Work Orders"
      description="Kelola pekerjaan detail di tiap stasiun kerja."
    />
  )
}

import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Production - Admin XRP",
}

export default function ProductionPage() {
  return (
    <ErpModulePage
      title="Production"
      description="Pantau proses manufaktur dari BOM sampai laporan produksi."
      modules={[
        { href: "/admin/production/bill-of-materials", label: "Bill of Materials", description: "Komposisi bahan baku per produk" },
        { href: "/admin/production/production-orders", label: "Production Order", description: "Perintah produksi utama" },
        { href: "/admin/production/work-orders", label: "Work Orders", description: "Detail pekerjaan di lini produksi" },
        { href: "/admin/production/production-reports", label: "Production Report", description: "Ringkasan hasil produksi" },
      ]}
    />
  )
}

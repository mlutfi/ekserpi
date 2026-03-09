import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Purchase - Admin XRP",
}

export default function PurchasePage() {
  return (
    <ErpModulePage
      title="Purchase"
      description="Kelola proses pengadaan mulai dari permintaan sampai retur pembelian."
      modules={[
        { href: "/admin/purchase/suppliers", label: "Suppliers", description: "Data supplier dan relasi pembelian" },
        { href: "/admin/purchase/purchase-requests", label: "Purchase Request", description: "Permintaan pembelian internal" },
        { href: "/admin/purchase/purchase-orders", label: "Purchase Order", description: "Order pembelian ke supplier" },
        { href: "/admin/purchase/goods-receipts", label: "Goods Receipt", description: "Penerimaan barang dari supplier" },
        { href: "/admin/purchase/purchase-returns", label: "Purchase Return", description: "Retur pembelian ke supplier" },
      ]}
    />
  )
}

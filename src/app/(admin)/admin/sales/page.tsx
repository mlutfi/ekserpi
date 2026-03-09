import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Sales - Admin XRP",
}

export default function SalesPage() {
  return (
    <ErpModulePage
      title="Sales"
      description="Kelola proses penjualan dari POS sampai retur penjualan."
      modules={[
        { href: "/admin/sales/pos", label: "POS", description: "Akses point of sale untuk transaksi kasir" },
        { href: "/admin/sales/sales-orders", label: "Sales Order", description: "Kelola order penjualan pelanggan" },
        { href: "/admin/sales/price-list", label: "Price List", description: "Atur daftar harga penjualan" },
        { href: "/admin/sales/sales-returns", label: "Sales Return", description: "Catat retur dari pelanggan" },
      ]}
    />
  )
}

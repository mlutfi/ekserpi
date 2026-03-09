import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Inventory - Admin XRP",
}

export default function InventoryPage() {
  return (
    <ErpModulePage
      title="Inventory"
      description="Kontrol data master barang dan seluruh pergerakan stok."
      modules={[
        { href: "/admin/inventory/items", label: "Items", description: "Master data barang" },
        { href: "/admin/inventory/categories", label: "Categories", description: "Kategori barang" },
        { href: "/admin/inventory/warehouses", label: "Warehouses", description: "Lokasi gudang penyimpanan" },
        { href: "/admin/inventory/stock-movements", label: "Stock Movement", description: "Mutasi masuk dan keluar stok" },
        { href: "/admin/inventory/stock-transfers", label: "Stock Transfer", description: "Transfer antar gudang" },
        { href: "/admin/inventory/stock-adjustments", label: "Stock Adjustment", description: "Penyesuaian stok" },
        { href: "/admin/inventory/stock-opnames", label: "Stock Opname", description: "Perhitungan fisik stok" },
      ]}
    />
  )
}

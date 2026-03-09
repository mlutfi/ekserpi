import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Finance - Admin XRP",
}

export default function FinancePage() {
  return (
    <ErpModulePage
      title="Finance"
      description="Kelola transaksi keuangan dan pencatatan akuntansi."
      modules={[
        { href: "/admin/finance/invoices", label: "Invoices", description: "Tagihan penjualan dan pembelian" },
        { href: "/admin/finance/payments", label: "Payments", description: "Pembayaran masuk dan keluar" },
        { href: "/admin/finance/expenses", label: "Expenses", description: "Pengeluaran operasional" },
        { href: "/admin/finance/accounts", label: "Accounts", description: "Chart of accounts" },
        { href: "/admin/finance/journal-entries", label: "Journal Entries", description: "Jurnal transaksi" },
      ]}
    />
  )
}

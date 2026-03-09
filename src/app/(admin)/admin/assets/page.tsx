import type { Metadata } from "next"
import ErpModulePage from "@/components/admin/ErpModulePage"

export const metadata: Metadata = {
  title: "Assets - Admin XRP",
}

export default function AssetsPage() {
  return (
    <ErpModulePage
      title="Assets"
      description="Kelola siklus hidup aset perusahaan dari registrasi sampai depresiasi."
      modules={[
        { href: "/admin/assets/asset-register", label: "Asset Register", description: "Master data aset" },
        { href: "/admin/assets/asset-assignments", label: "Asset Assignment", description: "Penempatan aset ke user/divisi" },
        { href: "/admin/assets/maintenance", label: "Maintenance", description: "Jadwal dan riwayat perawatan" },
        { href: "/admin/assets/depreciation", label: "Depreciation", description: "Perhitungan penyusutan aset" },
      ]}
    />
  )
}

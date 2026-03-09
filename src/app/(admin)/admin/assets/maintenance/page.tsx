import type { Metadata } from "next"
import MaintenanceClient from "./MaintenanceClient"

export const metadata: Metadata = {
  title: "Maintenance - Admin XRP",
}

export default function MaintenancePage() {
  return <MaintenanceClient />
}

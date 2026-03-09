import type { Metadata } from "next"
import LocationsClient from "../../locations/LocationsClient"

export const metadata: Metadata = {
  title: "Warehouses - Admin XRP",
}

export default function InventoryWarehousesPage() {
  return <LocationsClient />
}

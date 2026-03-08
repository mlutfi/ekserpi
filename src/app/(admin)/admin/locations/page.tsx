import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Lokasi & Gudang - Admin XRP",
}

import LocationsClient from "./LocationsClient"

export default function LocationsPage() {
    return <LocationsClient />
}

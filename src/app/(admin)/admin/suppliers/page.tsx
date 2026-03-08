import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Supplier - Admin XRP",
}

import SuppliersClient from "./SuppliersClient"

export default function SuppliersPage() {
    return <SuppliersClient />
}

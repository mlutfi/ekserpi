import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Laporan",
}

import ReportsClient from "./ReportsClient"

export default function ReportsPage() {
    return <ReportsClient />
}

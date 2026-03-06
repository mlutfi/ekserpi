import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Laporan - POS XRP",
}

import PosReportClient from "./PosReportClient"

export default function PosReportPage() {
    return <PosReportClient />
}

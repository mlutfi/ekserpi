import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Daily Report - HRIS XRP",
}

import DailyReportClient from "./DailyReportClient"

export default function DailyReportPage() {
    return <DailyReportClient />
}

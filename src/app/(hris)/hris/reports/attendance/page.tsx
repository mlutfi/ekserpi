import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Attendance Report - HRIS XRP",
}

import AttendanceReportClient from "./AttendanceReportClient"

export default function AttendanceReportPage() {
    return <AttendanceReportClient />
}

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Attendance - HRIS XRP",
}

import AttendanceClient from "./AttendanceClient"

export default function AttendancePage() {
    return <AttendanceClient />
}

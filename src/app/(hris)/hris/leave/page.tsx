import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Leave - HRIS XRP",
}

import LeaveClient from "./LeaveClient"

export default function LeavePage() {
    return <LeaveClient />
}

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Dashboard - HRIS XRP",
}

import HRISDashboardClient from "./HRISDashboardClient"

export default function HRISDashboardPage() {
    return <HRISDashboardClient />
}

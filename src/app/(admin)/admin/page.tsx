import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Dashboard - XRP",
}

import AdminDashboardClient from "./AdminDashboardClient"

export default function AdminDashboardPage() {
    return <AdminDashboardClient />
}

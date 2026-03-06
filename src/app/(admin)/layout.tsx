import { Metadata } from "next"

export const metadata: Metadata = {
    title: {
        template: "%s - Admin XRP",
        default: "Admin - XRP",
    },
    description: "Admin panel for XRP Community Based System",
}

import AdminLayoutClient from "./AdminLayout"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>
}

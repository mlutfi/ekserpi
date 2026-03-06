import { Metadata } from "next"

export const metadata: Metadata = {
    title: "POS - XRP",
    description: "Point of Sale for XRP Community Based System",
}

import PosLayoutClient from "./PosLayout"

export default function PosLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <PosLayoutClient>{children}</PosLayoutClient>
}

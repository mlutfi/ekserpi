import { Metadata } from "next"

export const metadata: Metadata = {
    title: "HRIS - XRP",
    description: "Human Resources Information System for XRP Community Based System",
}

import HRISLayoutClient from "./HRISLayout"

export default function HRISLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <HRISLayoutClient>{children}</HRISLayoutClient>
}

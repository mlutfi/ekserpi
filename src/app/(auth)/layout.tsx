import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
    title: "XRP - Community Based System",
    description: "Community Based System",
}

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {children}
        </div>
    )
}

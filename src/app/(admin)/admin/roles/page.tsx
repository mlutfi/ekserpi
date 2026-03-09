import { Metadata } from "next"

import RolesClient from "./RolesClient"

export const metadata: Metadata = {
    title: "Role Management",
}

export default function RolesPage() {
    return <RolesClient />
}

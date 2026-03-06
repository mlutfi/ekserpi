import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Users",
}

import UsersClient from "./UsersClient"

export default function UsersPage() {
    return <UsersClient />
}

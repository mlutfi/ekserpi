import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Modul",
}

import ModulesClient from "./ModulesClient"

export default function ModulesPage() {
    return <ModulesClient />
}

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Pengaturan POS",
}

import PosSettingsClient from "./PosSettingsClient"

export default function PosSettingsPage() {
    return <PosSettingsClient />
}

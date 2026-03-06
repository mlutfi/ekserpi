import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Positions - HRIS XRP",
}

import PositionsClient from "./PositionsClient"

export default function MasterDataPositionsPage() {
    return <PositionsClient />
}

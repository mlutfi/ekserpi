import { Metadata } from "next"

export const metadata: Metadata = {
  title: "POS - POS XRP",
}

import PosClient from "./PosClient"

export default function PosPage() {
  return <PosClient />
}
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Kategori",
}

import CategoriesClient from "./CategoriesClient"

export default function CategoriesPage() {
    return <CategoriesClient />
}

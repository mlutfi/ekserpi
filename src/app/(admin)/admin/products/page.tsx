import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Produk",
}

import ProductsClient from "./ProductsClient"

export default function ProductsPage() {
    return <ProductsClient />
}

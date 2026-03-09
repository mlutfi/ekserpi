import type { Metadata } from "next"
import ProductsClient from "../../products/ProductsClient"

export const metadata: Metadata = {
  title: "Items - Admin XRP",
}

export default function InventoryItemsPage() {
  return <ProductsClient />
}

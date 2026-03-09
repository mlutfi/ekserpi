import type { Metadata } from "next"
import CategoriesClient from "../../categories/CategoriesClient"

export const metadata: Metadata = {
  title: "Categories - Admin XRP",
}

export default function InventoryCategoriesPage() {
  return <CategoriesClient />
}

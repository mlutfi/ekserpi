import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Departments - HRIS XRP",
}

import DepartmentsClient from "./DepartmentsClient"

export default function MasterDataDepartmentsPage() {
    return <DepartmentsClient />
}

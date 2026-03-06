import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Employees - HRIS XRP",
}

import EmployeesClient from "./EmployeesClient"

export default function EmployeesPage() {
    return <EmployeesClient />
}

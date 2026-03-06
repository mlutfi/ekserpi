import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Payroll - HRIS XRP",
}

import PayrollClient from "./PayrollClient"

export default function PayrollPage() {
    return <PayrollClient />
}

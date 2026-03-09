import Link from "next/link"
import { ArrowRight, Clock3 } from "lucide-react"

interface ErpModuleLink {
  href: string
  label: string
  description?: string
}

interface ErpModulePageProps {
  title: string
  description: string
  modules?: ErpModuleLink[]
}

export default function ErpModulePage({ title, description, modules = [] }: ErpModulePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      {modules.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-zinc-900">{module.label}</h2>
                <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-600" />
              </div>
              {module.description && (
                <p className="mt-2 text-sm text-zinc-500">{module.description}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-900">
            <Clock3 className="h-4 w-4" />
            <p className="font-medium">Modul sedang disiapkan</p>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Halaman ini sudah masuk struktur ERP dan siap dilanjutkan ke implementasi fitur detail.
          </p>
        </div>
      )}
    </div>
  )
}

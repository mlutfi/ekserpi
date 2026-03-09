import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type PageLoadingProps = {
  label?: string
  fullScreen?: boolean
  className?: string
}

export function PageLoading({
  label = "Memuat data...",
  fullScreen = false,
  className,
}: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full items-center justify-center",
        fullScreen ? "min-h-screen" : "min-h-[240px]",
        className
      )}
    >
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-black" />
        <span>{label}</span>
      </div>
    </div>
  )
}

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  )
}

function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card-flat flex items-start justify-between gap-3 p-4 sm:p-5", className)}>
      <div className="space-y-2.5 w-full">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="size-9 shrink-0 rounded-lg" />
    </div>
  )
}

function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/60 gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4 flex-1", i === 0 ? "w-1/3" : "w-1/6")} />
      ))}
    </div>
  )
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card-flat p-5 space-y-4", className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}

export { Skeleton, MetricCardSkeleton, TableRowSkeleton, CardSkeleton }

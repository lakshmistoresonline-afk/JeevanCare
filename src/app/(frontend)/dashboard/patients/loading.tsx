export default function PatientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-4 w-28" />
        </div>
        <div className="skeleton h-10 w-44" />
      </div>

      <div className="card-flat overflow-hidden p-4 space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-14 items-center gap-4 px-2">
              <div className="skeleton h-8 size-8 rounded-full" />
              <div className="skeleton h-4 w-44" />
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'

export function AppointmentDateSelector({ dateStr, isToday }: { dateStr: string; isToday: boolean }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1 px-2">
      <input
        type="date"
        value={dateStr}
        onChange={(e) => {
          if (e.target.value) {
            router.push(`/dashboard/appointments?date=${e.target.value}`)
          }
        }}
        className="bg-transparent text-[13px] font-medium text-ink cursor-pointer focus:outline-none"
        title="Click to open calendar date picker"
      />
      {!isToday && (
        <button
          type="button"
          onClick={() => router.push('/dashboard/appointments')}
          className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  )
}

'use client'

import React from 'react'

export type DoctorPaceInfo = {
  id: string
  name: string
  onToday: boolean
  waitingCount: number
  avgConsultMinutes?: number
  delayMinutes?: number
}

export function DoctorPaceBanner({ doctors }: { doctors: DoctorPaceInfo[] }) {
  const activeDocs = doctors.filter((d) => d.onToday)
  if (activeDocs.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between text-xs font-bold text-ink">
        <span className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md bg-primary-soft text-primary text-[11px]">
            ⏱️
          </span>
          <span>Live Doctor Schedule Pace &amp; Estimated Wait Times</span>
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold">
          Auto-updated by front-desk check-ins
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {activeDocs.map((doc) => {
          const avgMins = doc.avgConsultMinutes || 12
          const estWait = doc.waitingCount * avgMins
          const isDelayed = (doc.delayMinutes || 0) > 5

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-canvas/70 text-xs"
            >
              <div className="min-w-0 flex-1">
                <span className="font-bold text-ink truncate block">{doc.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {doc.waitingCount > 0
                    ? `~${estWait} mins est. wait (${doc.waitingCount} in queue)`
                    : 'Queue clear — ready for walk-ins'}
                </span>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isDelayed
                    ? 'bg-amber-soft text-amber'
                    : 'bg-green-soft text-green-strong'
                }`}
              >
                {isDelayed ? `+${doc.delayMinutes}m delay` : '⚡ On Schedule'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

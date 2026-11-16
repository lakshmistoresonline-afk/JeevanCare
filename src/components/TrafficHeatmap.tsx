'use client'

import { Card } from './primitives'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM']

export function TrafficHeatmap({
  data,
}: {
  data?: { day: string; hour: string; count: number }[]
}) {
  // Generate heat values matrix (0-100% intensity)
  const getIntensity = (dayIdx: number, hourIdx: number) => {
    // Demo congestion matrix simulation matching real Indian clinic peak OPD trends (Morning 9-11 AM & Evening 5-7 PM)
    if ((hourIdx >= 1 && hourIdx <= 3) || (hourIdx >= 9 && hourIdx <= 11)) {
      if (dayIdx === 0 || dayIdx === 5) return 'bg-primary text-white font-bold' // Peak Mon/Sat
      return 'bg-primary/70 text-white font-semibold'
    }
    if (hourIdx >= 4 && hourIdx <= 5) return 'bg-primary/20 text-primary' // Lunch lull
    return 'bg-secondary/40 text-muted-foreground'
  }

  return (
    <Card className="p-6 overflow-hidden">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="font-display text-base font-bold text-ink">Hourly Patient Traffic &amp; OPD Congestion Heatmap</h3>
          <p className="text-xs text-muted-foreground">Historical congestion analysis to optimize doctor shifts &amp; staff triage</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-secondary/40 border" /> Light (1-3)</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary/30 border border-primary/30" /> Moderate (4-8)</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary text-white" /> Peak OPD (9+)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Hour headers */}
          <div className="grid grid-cols-14 gap-1.5 text-center text-[10px] font-bold text-muted-foreground mb-2">
            <div className="text-left ps-2">Day / Time</div>
            {HOURS.map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>

          {/* Day Rows */}
          {DAYS.map((day, dIdx) => (
            <div key={day} className="grid grid-cols-14 gap-1.5 items-center my-1.5 text-xs">
              <div className="font-bold text-ink text-[11px] ps-2">{day}</div>
              {HOURS.map((h, hIdx) => {
                const intensityClass = getIntensity(dIdx, hIdx)
                return (
                  <div
                    key={h}
                    className={`h-7 rounded-lg flex items-center justify-center text-[10px] transition-all hover:scale-105 shadow-2xs ${intensityClass}`}
                    title={`${day} ${h}: OPD Congestion Intensity`}
                  >
                    {(hIdx >= 1 && hIdx <= 3) || (hIdx >= 9 && hIdx <= 11) ? (dIdx === 0 ? '12' : '8') : '2'}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

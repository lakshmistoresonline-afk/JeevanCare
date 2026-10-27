'use client'

import { Card } from './primitives'

export function VitalsTrendChart({
  vitalsHistory = [],
}: {
  vitalsHistory: { date: string; systolic?: number; pulse?: number; weight?: number }[]
}) {
  if (vitalsHistory.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-muted-foreground">
        No recorded vitals history available for trend analysis.
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-display text-sm font-bold text-ink">Patient Health Trends (Vitals)</h3>
        <p className="text-xs text-muted-foreground">Historical progression across recent consultations</p>
      </div>
      <div className="space-y-3">
        {vitalsHistory.map((v, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-canvas text-xs">
            <span className="font-bold text-ink">{v.date}</span>
            <div className="flex gap-4">
              {v.systolic && <span className="tabular text-muted-foreground">BP: <strong className="text-ink">{v.systolic} mmHg</strong></span>}
              {v.pulse && <span className="tabular text-muted-foreground">Pulse: <strong className="text-ink">{v.pulse} bpm</strong></span>}
              {v.weight && <span className="tabular text-muted-foreground">Weight: <strong className="text-ink">{v.weight} kg</strong></span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

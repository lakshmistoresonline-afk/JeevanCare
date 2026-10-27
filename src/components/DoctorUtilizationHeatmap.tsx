'use client'

import { Card } from './primitives'
import { IconCalendar } from './icons'

export function DoctorUtilizationHeatmap({
  doctors = [],
}: {
  doctors: { name: string; appointmentsCount: number; maxCapacity?: number }[]
}) {
  return (
    <Card className="p-6 space-y-4 border-border/80">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
          <IconCalendar size={16} />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold text-ink">Doctor Utilization &amp; Schedule Heatmap</h3>
          <p className="text-xs text-muted-foreground">Active appointment load distribution across clinic staff</p>
        </div>
      </div>

      <div className="space-y-3">
        {doctors.map((doc, idx) => {
          const cap = doc.maxCapacity || 20
          const pct = Math.min(100, Math.round((doc.appointmentsCount / cap) * 100))
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ink">{doc.name}</span>
                <span className="tabular text-muted-foreground">{doc.appointmentsCount} / {cap} slots ({pct}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-border/80 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    pct > 80 ? 'bg-amber' : pct > 95 ? 'bg-red' : 'bg-primary'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {doctors.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No doctor utilization data available.</p>
        )}
      </div>
    </Card>
  )
}

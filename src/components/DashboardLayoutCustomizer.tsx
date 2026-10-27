'use client'

import { useState } from 'react'
import { Card } from '@/components/primitives'
import { IconSettings } from '@/components/icons'

export function DashboardLayoutCustomizer() {
  const [widgets, setWidgets] = useState([
    { id: 'kpis', label: 'Key Performance Metrics', visible: true },
    { id: 'queue', label: 'Live OPD Token Queue', visible: true },
    { id: 'revenue', label: 'Revenue & Daily Collections', visible: true },
    { id: 'appointments', label: 'Today\'s Appointment Roster', visible: true },
  ])

  const toggleWidget = (id: string) => {
    setWidgets((w) => w.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)))
  }

  return (
    <Card className="p-5 border-border/80">
      <div className="flex items-center gap-2 mb-3">
        <IconSettings size={18} className="text-primary" />
        <h3 className="font-display text-sm font-bold text-ink">Customize Dashboard Widgets</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Choose which operational widgets appear on your primary clinic workspace overview.
      </p>

      <div className="space-y-2">
        {widgets.map((w) => (
          <label key={w.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-canvas cursor-pointer hover:border-primary/30 transition-colors">
            <span className="text-xs font-semibold text-ink">{w.label}</span>
            <input
              type="checkbox"
              checked={w.visible}
              onChange={() => toggleWidget(w.id)}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>
        ))}
      </div>
    </Card>
  )
}

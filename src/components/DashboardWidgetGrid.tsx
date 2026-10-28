'use client'

import { useState } from 'react'
import { Card } from './primitives'
import { IconSettings } from './icons'

export function DashboardWidgetGrid({
  children,
}: {
  children: { id: string; title: string; node: React.ReactNode }[]
}) {
  const [widgets, setWidgets] = useState(
    children.map((c, i) => ({ id: c.id, title: c.title, visible: true, order: i }))
  )

  const toggleWidget = (id: string) => {
    setWidgets((w) => w.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)))
  }

  const [customizing, setCustomizing] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Clinic Workspace Overview</h2>
          <p className="text-xs text-muted-foreground">Real-time OPD queue and clinic operational metrics</p>
        </div>
        <button
          type="button"
          onClick={() => setCustomizing((c) => !c)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-colors hover:border-primary hover:text-primary"
        >
          <IconSettings size={14} />
          <span>{customizing ? 'Done Customizing' : 'Customize Layout'}</span>
        </button>
      </div>

      {customizing && (
        <Card className="p-4 bg-secondary/30 border-primary/30 animate-fade-up">
          <h3 className="font-display text-xs font-bold text-primary uppercase tracking-wider mb-2">Toggle Dashboard Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {widgets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleWidget(w.id)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors border ${
                  w.visible ? 'border-primary/40 bg-primary text-white' : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {w.visible ? '✓ ' : '+ '} {w.title}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {children.map((c) => {
          const config = widgets.find((w) => w.id === c.id)
          if (config && !config.visible) return null
          return <div key={c.id}>{c.node}</div>
        })}
      </div>
    </div>
  )
}

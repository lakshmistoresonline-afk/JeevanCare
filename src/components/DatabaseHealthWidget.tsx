'use client'

import { useState, useEffect } from 'react'
import { Card } from './primitives'

export function DatabaseHealthWidget() {
  const [latency, setLatency] = useState(12)
  const [replicaStatus] = useState('PRIMARY (Healthy)')

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 15) + 10)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-5 border-border/80 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <span className="size-2 rounded-full bg-primary animate-ping" />
          </span>
          <h3 className="font-display text-sm font-bold text-ink">Database Cluster Health</h3>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-primary">
          Replica Set: rs0
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="rounded-xl border border-border bg-canvas p-2.5">
          <span className="text-[10px] text-muted-foreground block">State</span>
          <span className="font-bold text-primary mt-0.5 block">{replicaStatus}</span>
        </div>
        <div className="rounded-xl border border-border bg-canvas p-2.5">
          <span className="text-[10px] text-muted-foreground block">Ping Latency</span>
          <span className="tabular font-bold text-ink mt-0.5 block">{latency} ms</span>
        </div>
        <div className="rounded-xl border border-border bg-canvas p-2.5">
          <span className="text-[10px] text-muted-foreground block">Failover Protection</span>
          <span className="font-bold text-emerald-600 mt-0.5 block">Active (Auto)</span>
        </div>
      </div>
    </Card>
  )
}

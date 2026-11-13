'use client'

import { Card } from './primitives'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

export type VitalsPoint = {
  date: string
  bpSystolic?: number | null
  bpDiastolic?: number | null
  temperatureC?: number | null
  weightKg?: number | null
  pulse?: number | null
}

export function PatientVitalsTrendChart({
  vitalsHistory = [],
  patientName,
}: {
  vitalsHistory: VitalsPoint[]
  patientName: string
}) {
  if (vitalsHistory.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-muted-foreground">
        No recorded vitals history available yet for {patientName}.
      </Card>
    )
  }

  const chartData = vitalsHistory.map((v) => ({
    date: v.date,
    'BP Sys (mmHg)': v.bpSystolic || null,
    'BP Dia (mmHg)': v.bpDiastolic || null,
    'Temp (°C)': v.temperatureC || null,
    'Weight (kg)': v.weightKg || null,
    'Pulse (bpm)': v.pulse || null,
  }))

  return (
    <Card className="p-6 space-y-4 bg-card border-border/80 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-ink">Longitudinal Vitals &amp; Health Trend</h3>
          <p className="text-xs text-muted-foreground">BP, Temperature, Weight &amp; Pulse trajectory over past visits</p>
        </div>
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-bold text-primary">
          {vitalsHistory.length} recorded visits
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Line type="monotone" dataKey="BP Sys (mmHg)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="BP Dia (mmHg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Weight (kg)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Pulse (bpm)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

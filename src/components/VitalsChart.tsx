'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export type VitalsPoint = {
  date: string
  bpSystolic?: number | null
  bpDiastolic?: number | null
  weightKg?: number | null
  pulse?: number | null
}

export function VitalsChart({ vitalsHistory }: { vitalsHistory: VitalsPoint[] }) {
  if (!vitalsHistory || vitalsHistory.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        No vital signs recorded yet to display trend charts.
      </div>
    )
  }

  const data = vitalsHistory.map((v) => ({
    date: v.date,
    Systolic: v.bpSystolic ?? null,
    Diastolic: v.bpDiastolic ?? null,
    Weight: v.weightKg ?? null,
    Pulse: v.pulse ?? null,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Blood Pressure Chart */}
      <div>
        <div className="mb-2 text-xs font-semibold text-ink flex items-center justify-between">
          <span>Blood Pressure Trend (mmHg)</span>
          <span className="text-[10px] text-muted-foreground font-normal">Normal: 120/80 mmHg</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis domain={[50, 180]} tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <Line type="monotone" dataKey="Systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight & Pulse Chart */}
      <div>
        <div className="mb-2 text-xs font-semibold text-ink">Weight (kg) &amp; Pulse (bpm)</div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis domain={[30, 140]} tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <Line type="monotone" dataKey="Weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Pulse" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

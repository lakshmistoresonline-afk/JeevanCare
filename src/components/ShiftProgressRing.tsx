'use client'

import React from 'react'

export function ShiftProgressRing({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  const percentage = Math.min(100, Math.round((completed / (total || 1)) * 100))
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs backdrop-blur-md">
      <div className="relative flex size-12 items-center justify-center shrink-0">
        <svg className="size-12 -rotate-90 transform" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/40"
            fill="transparent"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-500 ease-out"
            fill="transparent"
          />
        </svg>
        <span className="absolute font-display text-[11px] font-extrabold text-ink tabular">
          {percentage}%
        </span>
      </div>

      <div>
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          OPD Shift Progress
        </div>
        <div className="text-xs font-bold text-ink mt-0.5">
          <span className="text-primary font-extrabold">{completed}</span> of {total} Visits Done
        </div>
      </div>
    </div>
  )
}

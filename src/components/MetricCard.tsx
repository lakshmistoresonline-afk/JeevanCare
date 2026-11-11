'use client'

import React from 'react'

export interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: {
    value: string
    isPositive?: boolean
    neutral?: boolean
  }
  icon?: React.ReactNode
  badge?: string
  className?: string
  accent?: 'primary' | 'blue' | 'purple' | 'amber' | 'green'
}

const ACCENT_BORDER = {
  primary: 'border-t-4 border-t-primary',
  blue: 'border-t-4 border-t-blue',
  purple: 'border-t-4 border-t-purple',
  amber: 'border-t-4 border-t-amber',
  green: 'border-t-4 border-t-green-strong',
}

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon,
  badge,
  className = '',
  accent = 'primary',
}: MetricCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${ACCENT_BORDER[accent]} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/20">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="tabular font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {value}
        </span>
        {badge && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-primary">
            {badge}
          </span>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-border/40">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                trend.neutral
                  ? 'text-muted-foreground'
                  : trend.isPositive !== false
                    ? 'text-primary'
                    : 'text-red'
              }`}
            >
              <span>{trend.isPositive !== false ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </span>
          )}
          {subtext && (
            <span className="text-muted-foreground text-[11px] truncate font-medium">{subtext}</span>
          )}
        </div>
      )}
    </div>
  )
}

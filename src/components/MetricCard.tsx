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
  icon?: React.ComponentType<{ size?: number; className?: string }>
  badge?: string
  className?: string
}

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  badge,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-150 hover:border-primary/30 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary ring-1 ring-primary/20">
            <Icon size={16} />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="tabular font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {value}
        </span>
        {badge && (
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
            {badge}
          </span>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-2.5 flex items-center justify-between text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
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
            <span className="text-muted-foreground text-[11px] truncate">{subtext}</span>
          )}
        </div>
      )}
    </div>
  )
}

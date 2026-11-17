'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, inputClass } from './primitives'
import { IconCalendar } from './icons'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function InvoicePeriodFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentRange = searchParams.get('range') || 'all'
  const currentDate = searchParams.get('date') || ''
  const currentMonth = searchParams.get('m') || ''
  const currentYear = searchParams.get('y') || ''

  const setFilter = (range: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams()
    if (range !== 'all') params.set('range', range)
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
    }
    const queryStr = params.toString()
    router.push(`/dashboard/invoices${queryStr ? `?${queryStr}` : ''}`)
  }

  return (
    <Card className="p-4 bg-card border-border/80 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <IconCalendar size={14} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-ink">Timeframe &amp; Period Filter</span>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex rounded-xl border border-border bg-canvas p-1 text-xs gap-1">
          {[
            { id: 'all', label: '📊 All Time' },
            { id: 'today', label: '📅 Today' },
            { id: 'month', label: '📆 This Month' },
            { id: 'custom', label: '🗓️ Custom' },
          ].map((tab) => {
            const isActive = currentRange === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-ink hover:bg-card'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Date or Month Selector when Custom Tab is active */}
      {currentRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 animate-fade-down text-xs">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-muted-foreground">Exact Date:</label>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setFilter('custom', { date: e.target.value, m: '', y: '' })}
              className={`${inputClass} text-xs py-1 px-2.5 h-8 w-auto`}
            />
          </div>

          <span className="text-muted-foreground font-bold text-[10px] uppercase">OR</span>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-muted-foreground">Select Month:</label>
            <select
              value={currentMonth}
              onChange={(e) => setFilter('custom', { m: e.target.value, y: currentYear || '2026', date: '' })}
              className={`${inputClass} text-xs py-1 px-2 h-8 w-auto`}
            >
              <option value="">Choose Month…</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={String(idx + 1)}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={currentYear || '2026'}
              onChange={(e) => setFilter('custom', { m: currentMonth || '11', y: e.target.value, date: '' })}
              className={`${inputClass} text-xs py-1 px-2 h-8 w-auto`}
            >
              {['2025', '2026', '2027'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </Card>
  )
}

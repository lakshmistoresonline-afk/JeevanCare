'use client'

import React from 'react'

export function LiveQueueTicker({
  currentPatient,
  currentDoctor,
  waitingCount,
}: {
  currentPatient?: string
  currentDoctor?: string
  waitingCount?: number
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/85 backdrop-blur-md p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full size-3 bg-primary"></span>
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              Live OPD Queue Status Ticker
            </div>
            <div className="text-sm font-semibold text-ink mt-0.5">
              {currentPatient ? (
                <>
                  Now Serving: <span className="text-primary font-bold">{currentPatient}</span>
                  {currentDoctor ? ` with Dr. ${currentDoctor}` : ''}
                </>
              ) : (
                'Live queue active — ready for consultations.'
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {waitingCount !== undefined && waitingCount >= 0 && (
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary">
              {waitingCount} waiting in queue
            </span>
          )}
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
            ⚡ Live Ticker
          </span>
        </div>
      </div>
    </div>
  )
}

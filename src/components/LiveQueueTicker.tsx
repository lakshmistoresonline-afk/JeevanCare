'use client'

import React from 'react'

export function LiveQueueTicker({
  currentPatient,
  currentDoctor,
  waitingCount = 0,
}: {
  currentPatient?: string
  currentDoctor?: string
  waitingCount?: number
}) {
  const completedTodayEstimate = Math.max(0, Math.round(waitingCount * 1.5))

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/90 backdrop-blur-md p-5 shadow-sm space-y-4">
      {/* Top Ticker Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-3.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full size-3.5 bg-primary"></span>
          </span>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
              <span>Live OPD Queue Manager</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                ⚡ Active Flow
              </span>
            </div>
            <div className="text-sm font-semibold text-ink mt-0.5">
              {currentPatient ? (
                <>
                  Now Serving: <span className="text-primary font-bold">{currentPatient}</span>
                  {currentDoctor ? ` with ${currentDoctor.startsWith('Dr.') ? currentDoctor : `Dr. ${currentDoctor}`}` : ''}
                </>
              ) : (
                'Live queue operational — consultations in progress.'
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="rounded-xl border border-primary/20 bg-secondary/60 px-3 py-1.5 font-bold text-primary shadow-2xs">
            👥 {waitingCount} Waiting in Lobby
          </span>
          <a
            href="/dashboard/queue-display"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-primary px-3 py-1.5 font-bold text-white shadow-2xs transition-transform hover:scale-[1.02] active:scale-95"
          >
            📺 Open Waiting Room TV →
          </a>
        </div>
      </div>

      {/* Visual Queue Stepper Progression Rail */}
      <div className="pt-2 border-t border-border/60">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-canvas/60 p-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-soft text-blue font-bold text-xs">
              1
            </span>
            <div>
              <span className="font-bold text-ink block leading-none">Checked-In</span>
              <span className="text-[10px] text-muted-foreground">Front-Desk Token</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary-soft/40 p-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              2
            </span>
            <div>
              <span className="font-bold text-primary block leading-none">{waitingCount} Waiting</span>
              <span className="text-[10px] text-muted-foreground">Lobby Queue</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-purple/30 bg-purple-soft/40 p-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-purple text-white font-bold text-xs">
              3
            </span>
            <div>
              <span className="font-bold text-purple block leading-none">
                {currentPatient ? 'In Consult' : 'Room Ready'}
              </span>
              <span className="text-[10px] text-muted-foreground">OPD Room</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-canvas/60 p-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-green-soft text-green-strong font-bold text-xs">
              4
            </span>
            <div>
              <span className="font-bold text-green-strong block leading-none">Completed</span>
              <span className="text-[10px] text-muted-foreground">Billing &amp; Rx</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

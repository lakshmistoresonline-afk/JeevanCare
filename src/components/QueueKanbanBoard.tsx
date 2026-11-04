'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from './primitives'
import { updateAppointmentStatus } from '@/app/(frontend)/dashboard/appointments/actions'
import { toast } from 'sonner'
import type { AppointmentStatus } from '@/lib/constants'
import type { DoctorColumn } from './DayRail'
import { IconWhatsApp, IconCheck, IconChevronRight, IconChevronLeft } from './icons'

const COLUMNS: { id: AppointmentStatus; title: string; color: string; border: string; bg: string }[] = [
  { id: 'scheduled', title: 'Scheduled', color: 'text-primary', border: 'border-primary/20', bg: 'bg-card' },
  { id: 'checked-in', title: 'Checked-In', color: 'text-blue', border: 'border-blue/20', bg: 'bg-blue-soft/30' },
  { id: 'in-consultation', title: 'In Consultation', color: 'text-purple', border: 'border-purple/20', bg: 'bg-purple-soft/30' },
  { id: 'completed', title: 'Completed', color: 'text-green-strong', border: 'border-green-strong/20', bg: 'bg-green-soft/30' },
]

const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  scheduled: 'checked-in',
  'checked-in': 'in-consultation',
  'in-consultation': 'completed',
}

const PREV_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  'checked-in': 'scheduled',
  'in-consultation': 'checked-in',
  completed: 'in-consultation',
}

export function QueueKanbanBoard({
  columns: doctorColumns,
}: {
  columns: DoctorColumn[]
}) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all')
  const [, startTransition] = useTransition()

  const allBlocks = doctorColumns.flatMap((c) => {
    return c.blocks.map((b) => ({
      ...b,
      doctorId: c.id,
      doctorName: c.name,
    }))
  })

  const filteredBlocks = selectedDoctorId === 'all'
    ? allBlocks
    : allBlocks.filter((b) => b.doctorId === selectedDoctorId)

  const handleStatusChange = (blockId: string, newStatus: AppointmentStatus) => {
    setPendingId(blockId)
    startTransition(async () => {
      const res = await updateAppointmentStatus(blockId, newStatus)
      setPendingId(null)
      if (res.ok) {
        toast.success(`Appointment moved to ${newStatus}.`)
        router.refresh()
      } else {
        toast.error(res.message || 'Failed to update status.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter by doctor */}
      {doctorColumns.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-medium text-muted-foreground">Filter Doctor:</span>
          <button
            onClick={() => setSelectedDoctorId('all')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              selectedDoctorId === 'all'
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-ink'
            }`}
          >
            All Doctors ({allBlocks.length})
          </button>
          {doctorColumns.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctorId(doc.id)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedDoctorId === doc.id
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:text-ink'
              }`}
            >
              {doc.name} ({doc.blocks.length})
            </button>
          ))}
        </div>
      )}

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = filteredBlocks.filter((b) => (b.status || 'scheduled') === col.id)
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border ${col.border} ${col.bg} p-4 min-h-[500px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${col.id === 'scheduled' ? 'bg-primary' : col.id === 'checked-in' ? 'bg-blue' : col.id === 'in-consultation' ? 'bg-purple' : 'bg-green-strong'}`} />
                  <h3 className="font-semibold text-ink text-sm">{col.title}</h3>
                </div>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted-foreground border border-border">
                  {items.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/80 text-xs text-muted-foreground">
                    No patients in {col.title.toLowerCase()}
                  </div>
                ) : (
                  items.map((b) => {
                    const isBusy = pendingId === b.id
                    const nextSt = NEXT_STATUS[b.status]
                    const prevSt = PREV_STATUS[b.status]

                    return (
                      <div
                        key={b.id}
                        className="group relative rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-ink text-sm truncate">{b.patientName}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span className="tabular font-medium text-foreground">{b.timeLabel}</span>
                              <span>•</span>
                              <span className="truncate">{b.doctorName}</span>
                            </div>
                          </div>
                          {b.token && (
                            <span className="shrink-0 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                              {b.token}
                            </span>
                          )}
                        </div>

                        {b.reason && (
                          <div className="text-xs text-muted-foreground line-clamp-2 bg-canvas p-2 rounded-lg">
                            {b.reason}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                          <div className="flex items-center gap-1">
                            {prevSt && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(b.id, prevSt)}
                                className="flex size-7 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-canvas hover:text-ink transition-colors"
                                title="Move back"
                              >
                                <IconChevronLeft size={13} />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {b.waHref && (
                              <a
                                href={b.waHref}
                                target="_blank"
                                rel="noreferrer"
                                className="flex size-7 items-center justify-center rounded-lg bg-green-soft text-green-strong hover:bg-green hover:text-white transition-colors"
                                title="WhatsApp Reminder"
                              >
                                <IconWhatsApp size={13} />
                              </a>
                            )}
                            {nextSt && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(b.id, nextSt)}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                              >
                                {isBusy && <Spinner />}
                                <span>{nextSt === 'checked-in' ? 'Check In' : nextSt === 'in-consultation' ? 'Start Consult' : 'Complete'}</span>
                                <IconChevronRight size={13} />
                              </button>
                            )}
                            {b.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-strong">
                                <IconCheck size={13} /> Done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

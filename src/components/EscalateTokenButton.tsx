'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { escalateAppointmentPriority } from '@/app/(frontend)/dashboard/appointments/actions'
import { toast } from 'sonner'
import { Spinner } from './primitives'

export function EscalateTokenButton({
  appointmentId,
  currentPriority = 'normal',
}: {
  appointmentId: string
  currentPriority?: 'normal' | 'urgent' | 'emergency' | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleSelect = (newPriority: 'normal' | 'urgent' | 'emergency') => {
    setOpen(false)
    startTransition(async () => {
      const res = await escalateAppointmentPriority(appointmentId, newPriority)
      if (res.ok) {
        if (newPriority === 'emergency') {
          toast.error(`🚨 Token escalated to EMERGENCY priority!`)
        } else if (newPriority === 'urgent') {
          toast.warning(`⚡ Token escalated to URGENT priority.`)
        } else {
          toast.success(`Token priority reset to Normal.`)
        }
        router.refresh()
      } else {
        toast.error(res.message || 'Failed to update token priority.')
      }
    })
  }

  const badgeColor =
    currentPriority === 'emergency'
      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
      : currentPriority === 'urgent'
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
        : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'

  const priorityLabel =
    currentPriority === 'emergency'
      ? '🚨 Emergency'
      : currentPriority === 'urgent'
        ? '⚡ Urgent'
        : 'Priority'

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((o) => !o)}
        className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${badgeColor}`}
        title="Escalate OPD Token Priority"
      >
        {pending && <Spinner />}
        <span>{priorityLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-44 rounded-xl border border-border/80 bg-sidebar p-1 shadow-xl ring-1 ring-black/5">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Escalate Token Queue
          </div>
          <button
            type="button"
            onClick={() => handleSelect('emergency')}
            className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2"
          >
            🚨 Emergency Priority
          </button>
          <button
            type="button"
            onClick={() => handleSelect('urgent')}
            className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 flex items-center gap-2"
          >
            ⚡ Urgent Priority
          </button>
          <button
            type="button"
            onClick={() => handleSelect('normal')}
            className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 flex items-center gap-2"
          >
            ⚪ Normal Queue
          </button>
        </div>
      )}
    </div>
  )
}

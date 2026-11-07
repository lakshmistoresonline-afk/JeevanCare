'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, btnGhost, inputClass, Field, Spinner } from './primitives'
import { rescheduleAppointment } from '@/app/(frontend)/dashboard/appointments/actions'
import { toast } from 'sonner'

export function RescheduleModal({
  appointmentId,
  patientName,
  isOpen,
  onClose,
}: {
  appointmentId: string
  patientName: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const todayStr = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(todayStr)
  const [time, setTime] = useState('10:00')

  if (!isOpen) return null

  const handleReschedule = () => {
    start(async () => {
      const res = await rescheduleAppointment(appointmentId, date, time)
      if (res.ok) {
        toast.success(`Rescheduled ${patientName} to ${date} at ${time}!`)
        onClose()
        router.refresh()
      } else {
        toast.error(res.message || 'Failed to reschedule appointment.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-fade-up">
        <div>
          <h3 className="font-display text-base font-bold text-ink">Reschedule Appointment</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Move <strong className="text-ink">{patientName}</strong> to a new date and time slot</p>
        </div>

        <div className="space-y-3">
          <Field label="New Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="New Time Slot">
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleReschedule}
            className={`${btnPrimary} flex-1`}
            disabled={pending}
          >
            {pending && <Spinner />}
            {pending ? 'Rescheduling…' : 'Confirm Reschedule'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost} disabled={pending}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

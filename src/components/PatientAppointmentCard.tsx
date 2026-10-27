'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, StatusBadge, Spinner } from './primitives'
import { formatDateTime } from '@/lib/format'
import { formatDoctorName } from '@/lib/utils'
import { patientCancelAppointment } from '@/app/(frontend)/patient/appointments/actions'
import { toast } from 'sonner'

export function PatientAppointmentCard({ appt, tenant }: { appt: any; tenant: any }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    start(async () => {
      const res = await patientCancelAppointment(String(appt.id))
      if (res.ok) {
        toast.success('Appointment cancelled successfully.')
        router.refresh()
      } else {
        toast.error(res.message || 'Failed to cancel appointment.')
      }
    })
  }

  const isUpcoming = appt.status === 'scheduled' || appt.status === 'checked-in'

  return (
    <Card className="p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-ink">{formatDoctorName(appt.doctor?.name)}</div>
          <div className="tabular mt-0.5 text-xs text-muted-foreground">
            {formatDateTime(appt.start, tenant)}
          </div>
          {appt.reason && <div className="mt-1 text-xs text-muted-foreground">Reason: {appt.reason}</div>}
          {appt.tokenNumber && (
            <div className="mt-2 inline-block rounded-md bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
              Token: {appt.tokenNumber}
            </div>
          )}
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {isUpcoming && (
        <div className="mt-4 pt-3 border-t border-border/85 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="rounded-lg border border-red/30 bg-red-soft px-3 py-1.5 text-xs font-semibold text-red hover:bg-red hover:text-white transition-colors"
          >
            {pending && <Spinner />}
            {pending ? 'Cancelling…' : 'Cancel Appointment'}
          </button>
        </div>
      )}
    </Card>
  )
}

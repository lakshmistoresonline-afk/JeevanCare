'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDoctorName } from '@/lib/utils'

export function BookingContextBanner({ doctorId }: { doctorId: string | null }) {
  const [doctor, setDoctor] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (!doctorId) return
    setLoading(true)
    setInvalid(false)

    fetch(`/api/users/${doctorId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invalid doctor')
        return res.json()
      })
      .then((data) => {
        if (data && data.role === 'doctor' && data.active !== false) {
          setDoctor(data)
        } else {
          setInvalid(true)
        }
      })
      .catch(() => {
        setInvalid(true)
      })
      .finally(() => setLoading(false))
  }, [doctorId])

  if (!doctorId) return null

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-primary/20 bg-secondary/40 p-4 text-xs text-muted-foreground animate-pulse flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary animate-ping" />
        Loading selected appointment context...
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="mb-6 rounded-2xl border border-amber/30 bg-amber-soft p-4 text-xs text-amber animate-fade-up">
        <div className="font-semibold text-amber">Selected doctor is currently unavailable</div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          The requested doctor is inactive or not found.{' '}
          <Link href="/patient/appointments/book" className="font-medium text-primary hover:underline">
            Choose another doctor &rarr;
          </Link>
        </p>
      </div>
    )
  }

  if (!doctor) return null

  const clinicName = typeof doctor.tenant === 'object' ? doctor.tenant?.name : 'JeevanCare Clinic'

  return (
    <div className="mb-6 rounded-2xl border border-primary/30 bg-secondary/30 p-4 shadow-sm animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Continue Appointment
        </span>
        {doctor.consultationFee && (
          <span className="tabular text-xs font-semibold text-primary">
            Fee: ₹{doctor.consultationFee}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary ring-1 ring-primary/30">
          {doctor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'DR'}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-semibold text-sm text-ink truncate">
            {formatDoctorName(doctor.name)}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {doctor.specialty || 'General Practitioner'} · {clinicName}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-primary/15 pt-2 text-[11px] text-muted-foreground">
        Sign in to lock your appointment slot with {formatDoctorName(doctor.name)}.
      </div>
    </div>
  )
}

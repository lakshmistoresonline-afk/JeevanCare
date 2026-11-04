import React from 'react'

export type DoctorPresenceStatus = 'on-duty' | 'in-consultation' | 'off-duty' | 'on-call' | 'by-appointment' | string

export function DoctorStatusBadge({
  status = 'on-duty',
  label,
  showIcon = true,
  className = '',
}: {
  status?: DoctorPresenceStatus
  label?: string
  showIcon?: boolean
  className?: string
}) {
  const normalized = (status || 'on-duty').toLowerCase()

  let bg = 'bg-green-soft text-green-strong border-green/20'
  let dot = 'bg-green-strong animate-pulse'
  let defaultLabel = 'On Duty'

  if (normalized === 'in-consultation' || normalized === 'consulting') {
    bg = 'bg-blue-soft text-blue border-blue/20'
    dot = 'bg-blue animate-ping'
    defaultLabel = 'In Consultation'
  } else if (normalized === 'off-duty' || normalized === 'offline' || normalized === 'off') {
    bg = 'bg-red-soft text-red border-red/20'
    dot = 'bg-red'
    defaultLabel = 'Off Duty'
  } else if (normalized === 'on-call' || normalized === 'onCall') {
    bg = 'bg-amber-soft text-amber border-amber/20'
    dot = 'bg-amber'
    defaultLabel = 'On Call'
  } else if (normalized === 'by-appointment' || normalized === 'byAppointment') {
    bg = 'bg-purple-soft text-purple border-purple/20'
    dot = 'bg-purple'
    defaultLabel = 'By Appointment'
  }

  const text = label || defaultLabel

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${bg} ${className}`}
    >
      {showIcon && <span className={`size-2 rounded-full ${dot}`} />}
      <span>{text}</span>
    </span>
  )
}

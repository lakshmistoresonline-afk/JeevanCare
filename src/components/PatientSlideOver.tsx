'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AllergyBanner, btnPrimary, btnGhost } from './primitives'
import { IconChevronRight, IconPhone, IconPlus, IconX } from './icons'

export function PatientSlideOver({
  patient,
}: {
  patient?: {
    id: string
    name: string
    mrn?: string | null
    phone?: string | null
    ageYears?: number | null
    gender?: string | null
    allergies?: string | null
    city?: string | null
  } | null
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (!patient) return null

  const handleOpenProfile = () => {
    setOpen(false)
    router.push(`/dashboard/patients/${patient.id}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-medium text-ink hover:text-primary transition-colors flex items-center gap-1 group text-left"
      >
        <span>{patient.name}</span>
        <IconChevronRight size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fade-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <button
                  type="button"
                  onClick={handleOpenProfile}
                  className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                >
                  <Avatar name={patient.name} size="md" />
                  <div>
                    <h2 className="text-base font-semibold text-ink hover:text-primary transition-colors">{patient.name}</h2>
                    <div className="text-xs text-muted-foreground">
                      MRN: {patient.mrn || 'N/A'} {patient.gender ? `· ${patient.gender}` : ''}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <IconX size={18} />
                </button>
              </div>

              {patient.allergies && (
                <div className="mt-4">
                  <AllergyBanner allergies={patient.allergies} />
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span className="font-medium flex items-center gap-1">
                    <IconPhone size={12} className="text-primary" />
                    {patient.phone || 'Not recorded'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{patient.ageYears ? `${patient.ageYears} years` : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">City / Locality</span>
                  <span className="font-medium">{patient.city || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-4 flex gap-3">
              <button
                type="button"
                onClick={handleOpenProfile}
                className={`${btnGhost} flex-1 text-center text-xs justify-center`}
              >
                View Full Profile
              </button>
              <Link
                href="/dashboard/appointments/new"
                onClick={() => setOpen(false)}
                className={`${btnPrimary} flex-1 text-center text-xs justify-center`}
              >
                <IconPlus size={14} /> Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

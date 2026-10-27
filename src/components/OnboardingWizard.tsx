'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/primitives'
import { IconCheck, IconX, IconCalendar, IconPlus, IconSettings, IconUsers } from '@/components/icons'

export function OnboardingWizard({ clinicName }: { clinicName?: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  if (dismissed) return null

  const steps = [
    { id: 1, title: 'Configure Clinic Profile & Settings', desc: 'Set consultation hours and currency', href: '/dashboard/settings', icon: IconSettings },
    { id: 2, title: 'Add Your First Doctor', desc: 'Set up specialist profiles and fees', href: '/dashboard/staff', icon: IconUsers },
    { id: 3, title: 'Register First Patient', desc: 'Create patient medical profile with MRN', href: '/dashboard/patients/new', icon: IconPlus },
    { id: 4, title: 'Book First Appointment', desc: 'Schedule a visit and test OPD queue', href: '/dashboard/appointments/new', icon: IconCalendar },
  ]

  const toggleStep = (id: number) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const progress = Math.round((completedSteps.length / steps.length) * 100)

  return (
    <Card className="p-6 mb-6 border-primary/30 bg-gradient-to-r from-primary-soft/50 via-card to-card shadow-md animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Getting Started Guide</span>
          <h2 className="font-display text-lg font-bold text-ink mt-0.5">
            Welcome to {clinicName || 'your clinic'}, setup your workspace
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-ink p-1 rounded-lg hover:bg-secondary/50 transition-colors"
          title="Dismiss guide"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-5 space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Setup Progress</span>
          <span className="tabular text-primary font-bold">{progress}% completed</span>
        </div>
        <div className="h-2 w-full rounded-full bg-border/80 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const Icon = step.icon
          const isDone = completedSteps.includes(step.id)
          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                isDone ? 'border-primary/40 bg-secondary/30 opacity-75' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`flex size-9 items-center justify-center rounded-xl ${isDone ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}>
                  {isDone ? <IconCheck size={18} /> : <Icon size={18} />}
                </span>
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className="text-[10px] font-bold text-muted-foreground hover:text-primary px-2 py-1 rounded border border-border bg-canvas transition-colors"
                >
                  {isDone ? 'Completed ✓' : 'Mark Done'}
                </button>
              </div>

              <div>
                <h3 className="font-bold text-xs text-ink">{step.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{step.desc}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-border/60">
                <Link href={step.href} className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                  Open &rarr;
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

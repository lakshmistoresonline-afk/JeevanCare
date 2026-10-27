'use client'

import Link from 'next/link'
import { Card } from './primitives'
import { IconCalendar, IconPlus, IconReceipt, IconStethoscope, IconUsers } from './icons'

export function RoleQuickActions({ role }: { role: string }) {
  const actionsMap: Record<string, { label: string; href: string; icon: any; desc: string }[]> = {
    receptionist: [
      { label: 'Register Patient', href: '/dashboard/patients/new', icon: IconPlus, desc: 'Add new patient record' },
      { label: 'Book Appointment', href: '/dashboard/appointments/new', icon: IconCalendar, desc: 'Schedule new consultation' },
      { label: 'OPD Queue Display', href: '/dashboard/queue-display', icon: IconStethoscope, desc: 'Open waiting room TV screen' },
      { label: 'View Billing', href: '/dashboard/invoices', icon: IconReceipt, desc: 'Process payments & receipts' },
    ],
    doctor: [
      { label: 'Today’s Appointments', href: '/dashboard/appointments', icon: IconCalendar, desc: 'View scheduled roster' },
      { label: 'Patients Directory', href: '/dashboard/patients', icon: IconUsers, desc: 'Search EMR records' },
      { label: 'OPD Queue Display', href: '/dashboard/queue-display', icon: IconStethoscope, desc: 'Live consultation queue' },
    ],
    owner: [
      { label: 'Register Staff', href: '/dashboard/staff', icon: IconUsers, desc: 'Add doctors & receptionists' },
      { label: 'Financial Reports', href: '/dashboard/reports', icon: IconReceipt, desc: 'View monthly revenue KPIs' },
      { label: 'Clinic Settings', href: '/dashboard/settings', icon: IconPlus, desc: 'Configure hours & currency' },
      { label: 'Book Appointment', href: '/dashboard/appointments/new', icon: IconCalendar, desc: 'Schedule visit' },
    ],
  }

  const roleActions = actionsMap[role] || actionsMap.owner

  return (
    <Card className="p-5 border-border/80">
      <h3 className="font-display text-sm font-bold text-ink mb-1">Quick Action Hub ({role.toUpperCase()})</h3>
      <p className="text-xs text-muted-foreground mb-4">Frequently used shortcuts for your daily clinical workflow.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roleActions.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.label}
              href={a.href}
              className="rounded-xl border border-border bg-canvas p-3 flex flex-col justify-between hover:border-primary/40 hover:bg-secondary/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon size={14} />
                </span>
                <span className="font-bold text-xs text-ink">{a.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{a.desc}</p>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

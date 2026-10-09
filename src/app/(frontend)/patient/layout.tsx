import React from 'react'
import Link from 'next/link'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { patientLogoutAction } from './login/actions'
import { Avatar, btnGhost } from '@/components/primitives'
import { IconHome, IconCalendar, IconPlus, IconClock, IconPill, IconFileText, IconReceipt, IconUsers } from '@/components/icons'
import { getTenantID, getPatientID } from '@/access'
import { relId } from '@/lib/utils'
import { PatientBottomNav } from '@/components/PatientBottomNav'

const NAV_ITEMS = [
  { href: '/patient/dashboard', label: 'Home', icon: IconHome },
  { href: '/patient/appointments', label: 'Appointments', icon: IconCalendar },
  { href: '/patient/appointments/book', label: 'Book', icon: IconPlus },
  { href: '/patient/history', label: 'History', icon: IconClock },
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: IconPill },
  { href: '/patient/documents', label: 'Documents', icon: IconFileText },
  { href: '/patient/billing', label: 'Billing', icon: IconReceipt },
  { href: '/patient/profile', label: 'Profile', icon: IconUsers },
]

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const isAuthPage = !user || (user as any).role !== 'patient'

  if (isAuthPage) {
    return <>{children}</>
  }

  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)
  let tenant: any = null
  if (tenantID) {
    tenant = await payload.findByID({ collection: 'tenants', id: tenantID, depth: 0, overrideAccess: true }).catch(() => null)
  }

  let patient: any = null
  const pid = getPatientID(user)
  if (pid) {
    patient = await payload.findByID({ collection: 'patients', id: pid, depth: 0, overrideAccess: true }).catch(() => null)
  }
  // Fail closed: patient identity must come from the authenticated patientProfile link only.
  // If the profile is missing or belongs to a different tenant, deny access.
  if (!patient || String(relId(patient.tenant)) !== String(tenantID)) {
    patient = null
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Patient Sidebar (desktop) */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
          </span>
          <div>
            <span className="font-display font-semibold tracking-tight">JeevanCare</span>
            <span className="block text-[10px] text-muted-foreground">Patient Portal</span>
          </div>
        </div>

        {patient && (
          <div className="p-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              <Avatar name={patient.name} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{patient.name}</div>
                <div className="tabular text-xs text-muted-foreground">{patient.mrn}</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] font-medium text-primary">{tenant?.name}</div>
          </div>
        )}

        <nav className="flex-1 space-y-1 p-4" aria-label="Patient navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <form action={patientLogoutAction}>
            <button type="submit" className={`${btnGhost} w-full justify-start text-red hover:text-red`}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold">JeevanCare</span>
            <span className="text-xs text-muted-foreground">· Patient</span>
          </div>
          {patient && (
            <div className="flex items-center gap-2">
              <span className="tabular text-xs text-muted-foreground">{patient.mrn}</span>
              <Avatar name={patient.name} size="sm" />
            </div>
          )}
        </header>

        <main className="flex-1 overflow-x-hidden px-4 pt-6 pb-24 sm:px-6 md:pb-8">
          <div className="mx-auto max-w-5xl animate-fade-up">{children}</div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <PatientBottomNav />
    </div>
  )
}

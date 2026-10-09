'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconCalendar, IconPlus, IconClock, IconMore, IconPill, IconFileText, IconReceipt, IconUsers, IconLogout } from '@/components/icons'
import { patientLogoutAction } from '@/app/(frontend)/patient/login/actions'

const PRIMARY_NAV = [
  { href: '/patient/dashboard', label: 'Home', icon: IconHome },
  { href: '/patient/appointments', label: 'Appointments', icon: IconCalendar },
  { href: '/patient/appointments/book', label: 'Book', icon: IconPlus },
  { href: '/patient/history', label: 'History', icon: IconClock },
]

const MORE_NAV = [
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: IconPill },
  { href: '/patient/documents', label: 'Documents', icon: IconFileText },
  { href: '/patient/billing', label: 'Billing', icon: IconReceipt },
  { href: '/patient/profile', label: 'Profile', icon: IconUsers },
]

export function PatientBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/patient/dashboard' ? pathname === href : pathname.startsWith(href)

  const moreActive = MORE_NAV.some((item) => isActive(item.href))

  return (
    <>
      {/* More sheet overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}

      {/* More sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t bg-card p-4 pb-8 transition-transform duration-200 md:hidden ${
          moreOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-label="More options"
        aria-hidden={!moreOpen}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">More</h2>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="text-xs font-medium text-muted-foreground"
            aria-label="Close more menu"
          >
            Close
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {MORE_NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-1.5 rounded-lg py-2"
              >
                <span className={`flex size-10 items-center justify-center rounded-xl ${active ? 'bg-primary-soft text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  <Icon size={18} />
                </span>
                <span className={`text-[11px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
        <div className="mt-4 border-t pt-3">
          <form action={patientLogoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-red"
            >
              <IconLogout size={16} /> Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Patient navigation"
      >
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className={`flex flex-1 min-h-[56px] flex-col items-center justify-center gap-1 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          aria-label="More options"
          className={`flex flex-1 min-h-[56px] flex-col items-center justify-center gap-1 ${
            moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <IconMore size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  )
}

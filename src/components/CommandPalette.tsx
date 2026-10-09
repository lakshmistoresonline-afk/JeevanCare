'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconCalendar,
  IconPlus,
  IconReceipt,
  IconSearch,
  IconSettings,
  IconStethoscope,
  IconUsers,
  IconX,
} from '@/components/icons'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const actions = [
    {
      id: 'book-appt',
      title: 'Book New Appointment',
      subtitle: 'Schedule a patient for today or upcoming date',
      icon: IconCalendar,
      href: '/dashboard/appointments/new',
      shortcut: 'Shift + A',
    },
    {
      id: 'new-patient',
      title: 'Register New Patient',
      subtitle: 'Add new patient record with auto MRN',
      icon: IconPlus,
      href: '/dashboard/patients/new',
      shortcut: 'Shift + P',
    },
    {
      id: 'patients-dir',
      title: 'Patients Directory',
      subtitle: 'Search and manage all patient files',
      icon: IconUsers,
      href: '/dashboard/patients',
    },
    {
      id: 'queue-display',
      title: 'Live OPD Queue TV Display',
      subtitle: 'Open waiting room token screen with voice callout',
      icon: IconStethoscope,
      href: '/dashboard/queue-display',
    },
    {
      id: 'invoices',
      title: 'Billing & Invoices',
      subtitle: 'View payments, balance due, and print receipts',
      icon: IconReceipt,
      href: '/dashboard/invoices',
    },
    {
      id: 'settings',
      title: 'Clinic Settings & QR Poster',
      subtitle: 'Configure clinic profile, slot length, and print reception QR',
      icon: IconSettings,
      href: '/dashboard/settings',
    },
    {
      id: 'patient-portal',
      title: 'Go to Patient Portal',
      subtitle: 'Switch to patient view, appointments, and prescriptions',
      icon: IconUsers,
      href: '/patient/dashboard',
    },
  ]

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <>
      {/* Trigger Button in Navigation Header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-canvas/80 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-ink"
      >
        <IconSearch size={14} />
        <span>Search actions...</span>
        <kbd className="ms-3 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold">
          ⌘K
        </kbd>
      </button>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <IconSearch size={18} className="text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full bg-transparent text-sm text-ink placeholder:text-muted-foreground outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="max-h-80 overflow-y-auto p-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Navigation &amp; Actions
              </div>
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No actions found matching "{query}".
                </div>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item.href)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-ink">
                                {item.title}
                              </div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          {item.shortcut && (
                            <kbd className="ms-2 shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border bg-canvas/60 px-4 py-2 text-[10px] text-muted-foreground">
              <span>Use <kbd className="font-semibold">↑</kbd> <kbd className="font-semibold">↓</kbd> to navigate</span>
              <span>Press <kbd className="font-semibold">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

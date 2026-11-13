'use client'

import { useState, useEffect, useRef } from 'react'
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

type ActionItem = {
  id: string
  title: string
  subtitle: string
  category: 'action' | 'navigation' | 'patient'
  icon: any
  href: string
  shortcut?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState<'all' | 'actions' | 'navigation'>('all')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.shiftKey && e.key.toUpperCase() === 'A' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        router.push('/dashboard/appointments/new')
      } else if (e.shiftKey && e.key.toUpperCase() === 'P' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        router.push('/dashboard/patients/new')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  const actions: ActionItem[] = [
    {
      id: 'book-appt',
      title: 'Book New Appointment',
      subtitle: 'Schedule a patient for today or upcoming date',
      category: 'action',
      icon: IconCalendar,
      href: '/dashboard/appointments/new',
      shortcut: 'Shift + A',
    },
    {
      id: 'new-patient',
      title: 'Register New Patient',
      subtitle: 'Add new patient record with auto MRN assignment',
      category: 'action',
      icon: IconPlus,
      href: '/dashboard/patients/new',
      shortcut: 'Shift + P',
    },
    {
      id: 'queue-display',
      title: 'Live OPD Queue TV Display',
      subtitle: 'Open waiting room token screen with audio callout',
      category: 'action',
      icon: IconStethoscope,
      href: '/dashboard/queue-display',
      shortcut: 'Alt + Q',
    },
    {
      id: 'patients-dir',
      title: 'Patients Directory Roster',
      subtitle: 'Search and manage all patient profiles, vitals, & MRNs',
      category: 'navigation',
      icon: IconUsers,
      href: '/dashboard/patients',
    },
    {
      id: 'invoices',
      title: 'Billing & Invoices Summary',
      subtitle: 'View payments, balance due, and dynamic UPI receipts',
      category: 'navigation',
      icon: IconReceipt,
      href: '/dashboard/invoices',
    },
    {
      id: 'reports',
      title: 'Monthly Financial Reports',
      subtitle: 'Owner revenue reports and per-doctor collection splits',
      category: 'navigation',
      icon: IconReceipt,
      href: '/dashboard/reports',
    },
    {
      id: 'settings',
      title: 'Clinic Settings & QR Poster',
      subtitle: 'Configure clinic profile, slot length, and print reception QR',
      category: 'navigation',
      icon: IconSettings,
      href: '/dashboard/settings',
    },
    {
      id: 'patient-portal',
      title: 'Patient Self-Service Portal',
      subtitle: 'Switch to patient dashboard, slot booking, and Rx history',
      category: 'navigation',
      icon: IconUsers,
      href: '/patient/dashboard',
    },
  ]

  const filtered = actions.filter((a) => {
    const matchesCategory = activeCategory === 'all' || (activeCategory === 'actions' ? a.category === 'action' : a.category === 'navigation')
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  const handleSelect = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].href)
      }
    }
  }

  return (
    <>
      {/* Header Search Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border/80 bg-canvas/90 px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-card hover:text-ink hover:shadow-2xs"
        title="Global Search Command Palette (Ctrl+K)"
      >
        <IconSearch size={14} className="text-primary" />
        <span className="font-medium">Search actions &amp; commands...</span>
        <kbd className="ms-4 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Modal Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-xs animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleListKeyDown}
          >
            {/* Search Input Rail */}
            <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3.5 bg-card">
              <IconSearch size={18} className="text-primary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                placeholder="Type a command, patient MRN, or action (e.g. 'book', 'patient')..."
                className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-muted-foreground outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-ink transition-colors"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 border-b border-border/60 bg-secondary/30 px-4 py-2 text-xs">
              {(
                [
                  { key: 'all', label: 'All Commands' },
                  { key: 'actions', label: '⚡ Quick Actions' },
                  { key: 'navigation', label: '📌 Navigation' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(tab.key)
                    setSelectedIndex(0)
                  }}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    activeCategory === tab.key
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-ink mb-1">No matching commands found</p>
                  <p>Try searching for "appointment", "patient", "invoices", or "settings".</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((item, idx) => {
                    const Icon = item.icon
                    const isSelected = idx === selectedIndex
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                            isSelected
                              ? 'bg-primary-soft/80 border border-primary/20 text-ink shadow-2xs'
                              : 'hover:bg-secondary/40 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-bold ${
                                isSelected ? 'bg-primary text-white' : 'bg-primary-soft text-primary'
                              }`}
                            >
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-ink">
                                {item.title}
                              </div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          {item.shortcut && (
                            <kbd className="ms-2 shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-ink border border-border">
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

            {/* Modal Navigation Footer */}
            <div className="flex items-center justify-between border-t border-border bg-canvas/80 px-4 py-2.5 text-[11px] text-muted-foreground font-medium">
              <div className="flex items-center gap-3">
                <span><kbd className="font-bold text-ink">↑↓</kbd> Select</span>
                <span><kbd className="font-bold text-ink">↵</kbd> Confirm</span>
              </div>
              <span>Press <kbd className="font-bold text-ink">Esc</kbd> to exit</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

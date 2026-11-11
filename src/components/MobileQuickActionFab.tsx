'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconPlus, IconCalendar, IconUserPlus, IconReceipt, IconClock } from './icons'

export function MobileQuickActionFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-20 end-4 z-40 sm:hidden">
      {/* Speed Dial Menu Items */}
      {open && (
        <div className="mb-3 flex flex-col items-end gap-2.5 animate-fade-up">
          <Link
            href="/dashboard/appointments/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-ink shadow-lg transition-transform active:scale-95"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-primary">
              <IconCalendar size={14} />
            </span>
            <span>Book Slot</span>
          </Link>

          <Link
            href="/dashboard/patients/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-ink shadow-lg transition-transform active:scale-95"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-soft text-blue">
              <IconUserPlus size={14} />
            </span>
            <span>Register Patient</span>
          </Link>

          <Link
            href="/dashboard/appointments/new?walkin=1"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-ink shadow-lg transition-transform active:scale-95"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-purple-soft text-purple">
              <IconClock size={14} />
            </span>
            <span>Walk-in Token</span>
          </Link>

          <Link
            href="/dashboard/invoices"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-ink shadow-lg transition-transform active:scale-95"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-green-soft text-green-strong">
              <IconReceipt size={14} />
            </span>
            <span>Create Invoice</span>
          </Link>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-xl ring-4 ring-primary/20 transition-all active:scale-90"
        title="Quick Reception Actions"
        aria-label="Quick Reception Actions"
      >
        <IconPlus
          size={24}
          strokeWidth={2.5}
          className={`transition-transform duration-200 ${open ? 'rotate-45' : 'rotate-0'}`}
        />
      </button>
    </div>
  )
}

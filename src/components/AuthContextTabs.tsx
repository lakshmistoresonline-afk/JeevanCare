'use client'

import Link from 'next/link'

export function AuthContextTabs({ active }: { active: 'patient' | 'clinic' }) {
  return (
    <div className="mb-6 flex rounded-xl border border-border bg-card p-1 shadow-2xs">
      <Link
        href="/patient/login"
        className={`flex-1 rounded-lg py-2.5 text-center text-xs font-semibold transition-all ${
          active === 'patient'
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-ink'
        }`}
      >
        PATIENT PORTAL
      </Link>
      <Link
        href="/login"
        className={`flex-1 rounded-lg py-2.5 text-center text-xs font-semibold transition-all ${
          active === 'clinic'
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-ink'
        }`}
      >
        CLINIC WORKSPACE
      </Link>
    </div>
  )
}

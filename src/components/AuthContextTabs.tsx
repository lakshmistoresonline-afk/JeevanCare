'use client'

import Link from 'next/link'

export function AuthContextTabs({
  active,
  doctorQuery,
}: {
  active: 'patient' | 'clinic'
  doctorQuery?: string
}) {
  const patientHref = doctorQuery ? `/patient/login?doctor=${doctorQuery}` : '/patient/login'
  const clinicHref = doctorQuery ? `/login?doctor=${doctorQuery}` : '/login'

  return (
    <div className="mb-6 flex rounded-xl border border-border bg-card p-1.5 shadow-2xs">
      <Link
        href={patientHref}
        className={`flex-1 rounded-lg py-2.5 px-2 text-center transition-all ${
          active === 'patient'
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-ink'
        }`}
      >
        <div className="text-xs font-bold tracking-wide">PATIENT PORTAL</div>
        <div className={`text-[10px] mt-0.5 ${active === 'patient' ? 'text-white/80' : 'text-faint'}`}>
          For patients &amp; families
        </div>
      </Link>

      <Link
        href={clinicHref}
        className={`flex-1 rounded-lg py-2.5 px-2 text-center transition-all ${
          active === 'clinic'
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-ink'
        }`}
      >
        <div className="text-xs font-bold tracking-wide">CLINIC WORKSPACE</div>
        <div className={`text-[10px] mt-0.5 ${active === 'clinic' ? 'text-white/80' : 'text-faint'}`}>
          For doctors, owners &amp; staff
        </div>
      </Link>
    </div>
  )
}

import Link from 'next/link'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, StatusBadge, btnPrimary, btnGhost } from '@/components/primitives'
import { formatDateTime } from '@/lib/format'
import { formatDoctorName } from '@/lib/utils'
import { IconCalendar, IconPlus, IconReceipt, IconStethoscope } from '@/components/icons'

export default async function PatientDashboard() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const apptsRes = await payload.find({
    collection: 'appointments',
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
      status: { in: ['scheduled', 'checked-in'] },
    },
    sort: 'start',
    limit: 5,
    depth: 1,
    overrideAccess: true,
  })
  const upcomingAppts = apptsRes.docs

  const visitsRes = await payload.find({
    collection: 'visits',
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
    },
    sort: '-visitDate',
    limit: 5,
    depth: 1,
    overrideAccess: true,
  })
  const recentVisits = visitsRes.docs

  const docsRes = await payload.find({
    collection: 'medical-documents' as any,
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
      status: { equals: 'active' },
    },
    sort: '-documentDate',
    limit: 5,
    overrideAccess: true,
  })
  const recentDocs = docsRes.docs as any[]

  // Live Queue Position calculation for today's checked-in appointment
  const checkedInAppt = upcomingAppts.find((a: any) => a.status === 'checked-in')
  let queuePosition = 0
  let estWaitMins = 0

  if (checkedInAppt) {
    const docId = typeof checkedInAppt.doctor === 'object' ? checkedInAppt.doctor.id : checkedInAppt.doctor
    const queueAheadRes = await payload.find({
      collection: 'appointments',
      where: {
        tenant: { equals: tenant.id },
        doctor: { equals: docId },
        status: { equals: 'checked-in' },
        start: { less_than: checkedInAppt.start },
      },
      overrideAccess: true,
    })
    queuePosition = queueAheadRes.totalDocs + 1
    const duration = tenant.settings?.appointmentDurationMins || 15
    estWaitMins = queueAheadRes.totalDocs * duration
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold">Welcome back, {patient.name}</h1>
          <p className="text-sm text-muted-foreground">{tenant.name} · MRN: {patient.mrn}</p>
        </div>
        <Link href="/patient/appointments" className={btnPrimary}>
          <IconPlus size={15} /> Book Appointment
        </Link>
      </div>

      {/* Live Queue Position & Stepper Progress Tracker */}
      {checkedInAppt && (
        <Card className="border-primary/30 bg-secondary/30 p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-primary/15 pb-4">
            <div>
              <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Live OPD Queue Tracker
              </span>
              <h2 className="mt-2 text-lg font-semibold text-ink">
                Token: {(checkedInAppt as any).tokenNumber || 'Checked In'} · Doctor: {formatDoctorName((checkedInAppt as any).doctor?.name)}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {queuePosition === 1
                  ? "🎉 You're next in line! Please be ready near consultation room."
                  : `There are ${queuePosition - 1} patient(s) ahead of you in line.`}
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-card p-3.5 text-center sm:text-end">
              <div className="text-2xl font-extrabold text-primary">~{estWaitMins} mins</div>
              <div className="text-[11px] font-medium text-muted-foreground">Estimated Wait Time</div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                ✓
              </div>
              <span className="font-semibold text-ink">Checked-In</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex size-7 items-center justify-center rounded-full font-bold text-xs ${
                queuePosition > 1 ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse' : 'bg-primary text-white'
              }`}>
                #{queuePosition}
              </div>
              <span className="font-semibold text-ink">In Queue</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex size-7 items-center justify-center rounded-full font-bold text-xs ${
                queuePosition === 1 ? 'bg-amber text-white ring-4 ring-amber/20 animate-pulse' : 'bg-muted text-muted-foreground'
              }`}>
                {queuePosition === 1 ? '!' : '3'}
              </div>
              <span className={`font-semibold ${queuePosition === 1 ? 'text-amber font-bold' : 'text-muted-foreground'}`}>
                {queuePosition === 1 ? 'Next Up!' : 'Next Up'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">
                4
              </div>
              <span className="font-semibold text-muted-foreground">Doctor Room</span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/patient/appointments', label: 'Appointments', icon: IconCalendar },
          { href: '/patient/history', label: 'Medical History', icon: IconStethoscope },
          { href: '/patient/documents', label: 'Documents', icon: IconReceipt },
          { href: '/patient/billing', label: 'Billing & Invoices', icon: IconReceipt },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-primary/40">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon size={18} />
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Upcoming Appointments</h2>
          <Link href="/patient/appointments" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {upcomingAppts.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            You don't have any upcoming appointments.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {upcomingAppts.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <div>
                  <div className="font-medium">{formatDoctorName(a.doctor?.name)}</div>
                  <div className="tabular text-xs text-muted-foreground">{formatDateTime(a.start, tenant)}</div>
                  {a.reason && <div className="text-xs text-muted-foreground">Reason: {a.reason}</div>}
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Recent Visits & Diagnoses</h2>
          <Link href="/patient/history" className="text-xs font-medium text-primary hover:underline">
            View history
          </Link>
        </div>
        {recentVisits.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            No consultation history recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentVisits.map((v: any) => (
              <li key={v.id} className="px-5 py-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{v.diagnosis || 'Consultation Visit'}</span>
                  <span className="tabular text-xs text-muted-foreground">{formatDateTime(v.visitDate, tenant)}</span>
                </div>
                {v.symptoms && <p className="mt-1 text-xs text-muted-foreground">Symptoms: {v.symptoms}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Recent Medical Documents</h2>
          <Link href="/patient/documents" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {recentDocs.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            No medical documents are available yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentDocs.map((d: any) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <div>
                  <span className="me-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {d.documentType}
                  </span>
                  <span className="font-medium">{d.title}</span>
                  <div className="tabular text-xs text-muted-foreground">{formatDateTime(d.documentDate, tenant)}</div>
                </div>
                <a href={`/api/medical-documents/${d.id}`} target="_blank" rel="noreferrer" className={btnGhost}>
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

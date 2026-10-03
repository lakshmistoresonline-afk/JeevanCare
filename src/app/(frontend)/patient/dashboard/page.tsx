import Link from 'next/link'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, StatusBadge, btnPrimary, btnGhost } from '@/components/primitives'
import { formatDateTime } from '@/lib/format'
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
                  <div className="font-medium">Dr. {a.doctor?.name ?? 'Doctor'}</div>
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

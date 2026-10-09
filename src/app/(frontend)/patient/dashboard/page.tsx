import Link from 'next/link'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, StatusBadge, btnPrimary, btnGhost, Avatar } from '@/components/primitives'
import { formatDateTime } from '@/lib/format'
import { formatDoctorName } from '@/lib/utils'
import { IconCalendar, IconPlus, IconReceipt, IconStethoscope, IconFileText, IconPill } from '@/components/icons'

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

  const upcomingAppt = upcomingAppts[0] as any

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Header Banner (Matching Panel 11 in Reference Image) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Good morning</span>
          <h1 className="text-2xl font-bold font-display text-ink mt-0.5">Your health, our priority.</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{tenant.name} · Patient MRN: {patient.mrn}</p>
        </div>
        <Link href="/patient/appointments/book" className={btnPrimary}>
          <IconPlus size={15} /> Book Appointment
        </Link>
      </div>

      {/* Live Queue Stepper Progress Tracker */}
      {checkedInAppt && (
        <Card className="border-primary/30 bg-secondary/30 p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-primary/15 pb-4">
            <div>
              <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Live OPD Queue Tracker
              </span>
              <h2 className="mt-2 text-lg font-bold text-ink">
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
              <div className="text-[11px] font-semibold text-muted-foreground">Estimated Wait Time</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                ✓
              </div>
              <span className="text-ink">Checked-In</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex size-7 items-center justify-center rounded-full font-bold text-xs ${
                queuePosition > 1 ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse' : 'bg-primary text-white'
              }`}>
                #{queuePosition}
              </div>
              <span className="text-ink">In Queue</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex size-7 items-center justify-center rounded-full font-bold text-xs ${
                queuePosition === 1 ? 'bg-amber text-white ring-4 ring-amber/20 animate-pulse' : 'bg-muted text-muted-foreground'
              }`}>
                {queuePosition === 1 ? '!' : '3'}
              </div>
              <span className={queuePosition === 1 ? 'text-amber font-bold' : 'text-muted-foreground'}>
                {queuePosition === 1 ? 'Next Up!' : 'Next Up'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">
                4
              </div>
              <span className="text-muted-foreground">Doctor Room</span>
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid: Upcoming Appointment Card + Quick Action Buttons (Matching Panel 11) */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Upcoming Appointment Card */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
            <h2 className="font-display text-base font-bold text-ink">Upcoming Appointment</h2>
            <StatusBadge status={upcomingAppt?.status || 'scheduled'} />
          </div>

          {upcomingAppt ? (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3.5">
                <Avatar name={formatDoctorName(upcomingAppt.doctor?.name)} size="md" />
                <div>
                  <div className="font-bold text-base text-ink">{formatDoctorName(upcomingAppt.doctor?.name)}</div>
                  <div className="text-xs text-primary font-semibold">{upcomingAppt.doctor?.specialty || 'General Medicine'}</div>
                  <div className="text-xs text-muted-foreground">{tenant.name}</div>
                </div>
              </div>
              <div className="rounded-xl border border-border/80 bg-canvas/80 p-3 text-xs flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Slot Time:</span>
                <span className="tabular font-bold text-ink">{formatDateTime(upcomingAppt.start, tenant)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No upcoming appointment scheduled.</p>
          )}

          <div className="pt-2">
            <Link href="/patient/appointments" className={`${btnGhost} w-full justify-center text-xs font-bold`}>
              View Details &rarr;
            </Link>
          </div>
        </Card>

        {/* Quick Action Navigation Grid (Matching Panel 11) */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/patient/appointments/book', label: 'Book Appointment', icon: IconCalendar },
            { href: '/patient/prescriptions', label: 'View Prescriptions', icon: IconPill },
            { href: '/patient/documents', label: 'My Documents', icon: IconFileText },
            { href: '/patient/billing', label: 'My Bills & Receipts', icon: IconReceipt },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Card className="flex flex-col items-center justify-center p-5 text-center gap-2.5 h-full transition-all hover:border-primary/40 hover:shadow-xs">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/20">
                    <Icon size={20} />
                  </span>
                  <span className="text-xs font-bold text-ink">{item.label}</span>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Prescriptions & Recent Documents Lists (Panel 11) */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Recent Prescriptions List */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <h2 className="font-display text-base font-bold text-ink">Recent Prescriptions</h2>
            <Link href="/patient/prescriptions" className="text-xs font-bold text-primary hover:underline">
              View All &rarr;
            </Link>
          </div>
          {recentVisits.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-muted-foreground italic">
              No prescriptions on record.
            </p>
          ) : (
            <ul className="divide-y divide-border/80">
              {recentVisits.slice(0, 3).map((v: any) => (
                <li key={v.id} className="flex items-center justify-between px-5 py-3.5 text-xs">
                  <div>
                    <div className="font-bold text-ink">{v.diagnosis || 'Consultation Visit'}</div>
                    <div className="tabular text-[11px] text-muted-foreground mt-0.5">{formatDateTime(v.visitDate, tenant)}</div>
                  </div>
                  <Link href="/patient/prescriptions" className={`${btnGhost} h-8 px-3 text-xs font-bold`}>
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Medical Documents List */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <h2 className="font-display text-base font-bold text-ink">Recent Documents</h2>
            <Link href="/patient/documents" className="text-xs font-bold text-primary hover:underline">
              View All &rarr;
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-muted-foreground italic">
              No medical documents available yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/80">
              {recentDocs.slice(0, 3).map((d: any) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-3.5 text-xs">
                  <div>
                    <span className="me-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {d.documentType}
                    </span>
                    <span className="font-bold text-ink">{d.title}</span>
                    <div className="tabular text-[11px] text-muted-foreground mt-0.5">{formatDateTime(d.documentDate, tenant)}</div>
                  </div>
                  <a href={`/api/medical-documents/${d.id}`} target="_blank" rel="noreferrer" className={`${btnGhost} h-8 px-3 text-xs font-bold`}>
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

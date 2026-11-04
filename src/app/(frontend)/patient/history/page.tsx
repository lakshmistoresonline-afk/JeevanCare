import Link from 'next/link'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { getPatientTimeline } from '@/lib/timeline'
import { Card, StatusBadge } from '@/components/primitives'
import { formatDateTime, formatMoney } from '@/lib/format'
import { IconPrinter, IconStethoscope, IconReceipt, IconCalendar, IconFileText, IconPill, IconClock } from '@/components/icons'

export default async function PatientHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()
  const params = await searchParams

  const filter = params.filter || 'all'
  const timeline = await getPatientTimeline(payload, String(tenant.id), String(patient.id), 100)

  const filtered = filter === 'all' ? timeline : timeline.filter((e) => e.kind === filter)

  const filters = [
    { value: 'all', label: 'All Records' },
    { value: 'visit', label: 'Visits & Rx' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'appointment', label: 'Appointments' },
    { value: 'document', label: 'Documents' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Medical History &amp; Timeline</h1>
          <p className="text-sm text-muted-foreground">Your complete chronological medical record and health milestones.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/patient/history/print"
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-ink shadow-xs transition-colors hover:border-primary hover:text-primary"
          >
            <IconPrinter size={16} /> Print Summary PDF
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-border/80 bg-card p-1.5 shadow-xs" role="tablist">
        {filters.map((f) => (
          <a
            key={f.value}
            href={`/patient/history?filter=${f.value}`}
            role="tab"
            aria-selected={filter === f.value}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-xs font-bold transition-all ${
              filter === f.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-ink'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="relative">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No medical history records found for this filter.</p>
          </Card>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:bottom-3 before:left-3 sm:before:left-4 before:top-3 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
            {filtered.map((e) => {
              const iconMap = {
                visit: <IconStethoscope size={18} className="text-white" />,
                invoice: <IconReceipt size={18} className="text-white" />,
                appointment: <IconCalendar size={18} className="text-white" />,
                document: <IconFileText size={18} className="text-white" />,
              }
              const bgMap = {
                visit: 'bg-primary ring-4 ring-primary/20 shadow-lg shadow-primary/25',
                invoice: 'bg-emerald-600 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/25',
                appointment: 'bg-blue-600 ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/25',
                document: 'bg-violet-600 ring-4 ring-violet-500/20 shadow-lg shadow-violet-500/25',
              }
              const badgeMap = {
                visit: { label: 'Visit', cls: 'bg-primary-soft text-primary border-primary/20' },
                invoice: { label: 'Invoice', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300' },
                appointment: { label: 'Appointment', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300' },
                document: { label: 'Document', cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300' },
              }

              const info = badgeMap[e.kind] || { label: e.kind, cls: 'bg-secondary text-ink' }

              return (
                <div key={`${e.kind}-${e.id}`} className="relative flex items-start gap-4 group">
                  {/* Glowing Icon Node */}
                  <div className={`absolute -left-6 sm:-left-8 flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${bgMap[e.kind]}`}>
                    {iconMap[e.kind]}
                  </div>

                  {/* Polished Modern Card */}
                  <Card className="flex-1 p-5 transition-all duration-200 hover:shadow-md hover:border-primary/40 bg-card/95 backdrop-blur-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${info.cls}`}>
                          {info.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <IconClock size={13} /> {formatDateTime(e.at, tenant)}
                        </span>
                      </div>
                      <div>
                        {e.kind === 'invoice' && <StatusBadge status={e.status} />}
                        {e.kind === 'appointment' && <StatusBadge status={e.status} />}
                      </div>
                    </div>

                    <div className="text-sm">
                      {e.kind === 'visit' && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-display font-bold text-ink text-base">{e.diagnosis || 'Consultation Visit'}</h3>
                            {e.doctorName && <p className="text-xs text-muted-foreground">Attending Physician: <span className="font-semibold text-ink">{e.doctorName}</span></p>}
                          </div>
                          <div className="flex items-center gap-3">
                            {e.rxCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                                <IconPill size={13} /> {e.rxCount} Prescribed Rx
                              </span>
                            )}
                            <a
                              href={`/print/prescription/${e.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary transition-colors"
                              title="Print prescription"
                            >
                              <IconPrinter size={14} /> Print Rx
                            </a>
                          </div>
                        </div>
                      )}

                      {e.kind === 'invoice' && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-display font-bold text-ink text-base">Invoice #{e.invoiceNumber}</h3>
                            <p className="text-xs text-muted-foreground">Amount: <span className="font-tabular font-bold text-ink text-sm">{formatMoney(e.amount, { settings: { currency: e.currency } })}</span></p>
                          </div>
                        </div>
                      )}

                      {e.kind === 'appointment' && (
                        <div className="space-y-1">
                          <h3 className="font-display font-bold text-ink text-base">{e.doctorName ? `Appointment with ${e.doctorName}` : 'Appointment'}</h3>
                          {e.reason && <p className="text-xs text-muted-foreground">Reason: <span className="font-medium text-ink">{e.reason}</span></p>}
                        </div>
                      )}

                      {e.kind === 'document' && (
                        <div className="space-y-1">
                          <div className="inline-block rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-primary mb-1">
                            {e.documentType}
                          </div>
                          <h3 className="font-display font-bold text-ink text-base">{e.title}</h3>
                          {e.filename && <p className="text-xs text-muted-foreground font-mono truncate">{e.filename}</p>}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

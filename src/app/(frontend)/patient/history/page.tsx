import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { getPatientTimeline } from '@/lib/timeline'
import { Card, StatusBadge } from '@/components/primitives'
import { formatDateTime, formatMoney } from '@/lib/format'
import { IconPrinter } from '@/components/icons'

export default async function PatientHistoryPage() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const timeline = await getPatientTimeline(payload, String(tenant.id), String(patient.id), 50)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Medical History & Timeline</h1>
        <p className="text-sm text-muted-foreground">Your complete chronological medical record.</p>
      </div>

      <Card className="overflow-hidden">
        {timeline.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No medical history recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {timeline.map((e) => (
              <li key={`${e.kind}-${e.id}`} className="flex items-center gap-4 px-5 py-4 text-sm">
                <span className="tabular w-44 shrink-0 text-[13px] text-muted-foreground">
                  {formatDateTime(e.at, tenant)}
                </span>
                {e.kind === 'visit' && (
                  <>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="me-1.5 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        Visit
                      </span>
                      <span className="font-medium">{e.diagnosis || 'Consultation'}</span>
                      {e.doctorName && <span className="text-muted-foreground"> · {e.doctorName}</span>}
                    </span>
                    {e.rxCount > 0 && (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
                        {e.rxCount} Rx
                      </span>
                    )}
                    <a href={`/print/prescription/${e.id}`} target="_blank" rel="noreferrer" className="shrink-0 text-faint hover:text-primary" title="Print prescription">
                      <IconPrinter size={14} />
                    </a>
                  </>
                )}
                {e.kind === 'invoice' && (
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="me-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Invoice
                      </span>
                      <span className="tabular font-medium">{e.invoiceNumber}</span>
                      <span className="tabular text-muted-foreground"> · {formatMoney(e.amount, { settings: { currency: e.currency } })}</span>
                    </span>
                    <StatusBadge status={e.status} />
                  </div>
                )}
                {e.kind === 'appointment' && (
                  <>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="me-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Appt
                      </span>
                      {e.doctorName && <span className="font-medium">{e.doctorName}</span>}
                      {e.reason && <span className="text-muted-foreground"> · {e.reason}</span>}
                    </span>
                    <StatusBadge status={e.status} />
                  </>
                )}
                {e.kind === 'document' && (
                  <div className="min-w-0 flex-1 truncate">
                    <span className="me-1.5 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      {e.documentType}
                    </span>
                    <span className="font-medium">{e.title}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

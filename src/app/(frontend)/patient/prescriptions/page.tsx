import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, btnGhost } from '@/components/primitives'
import { formatDateTime } from '@/lib/format'
import { formatDoctorName } from '@/lib/utils'
import { IconPrinter } from '@/components/icons'

export default async function PatientPrescriptionsPage() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const res = await payload.find({
    collection: 'visits',
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
    },
    sort: '-visitDate',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })
  const visits = res.docs.filter((v: any) => v.prescription && Array.isArray(v.prescription) && v.prescription.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Prescriptions</h1>
        <p className="text-sm text-muted-foreground">View and print your medical prescriptions.</p>
      </div>

      <Card className="overflow-hidden">
        {visits.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No prescriptions available yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {visits.map((v: any) => (
              <div key={v.id} className="p-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <div className="font-semibold">{v.diagnosis || 'Consultation Prescription'}</div>
                    <div className="tabular text-xs text-muted-foreground">
                      {formatDoctorName(v.doctor?.name)} · {formatDateTime(v.visitDate, tenant)}
                    </div>
                  </div>
                  <a href={`/print/prescription/${v.id}`} target="_blank" rel="noreferrer" className={btnGhost}>
                    <IconPrinter size={14} /> Print
                  </a>
                </div>
                <ul className="mt-3 space-y-2">
                  {(v.prescription ?? []).map((rx: any, idx: number) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span className="font-medium">
                        {rx.medicine} ({rx.dosage}) — {rx.frequency}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {rx.durationDays ? `${rx.durationDays} days` : ''} {rx.instructions ? `· ${rx.instructions}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

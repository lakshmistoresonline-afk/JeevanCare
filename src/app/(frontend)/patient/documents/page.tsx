import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, btnGhost } from '@/components/primitives'
import { formatDateTime } from '@/lib/format'

export default async function PatientDocumentsPage() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const res = await payload.find({
    collection: 'medical-documents' as any,
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
      status: { equals: 'active' },
    },
    sort: '-documentDate',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })
  const docs = res.docs as any[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Medical Documents & Reports</h1>
        <p className="text-sm text-muted-foreground">Access your lab results, X-rays, and medical reports securely.</p>
      </div>

      <Card className="overflow-hidden">
        {docs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No medical documents available yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map((d: any) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div>
                  <span className="me-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {d.documentType}
                  </span>
                  <span className="font-medium">{d.title}</span>
                  {d.description && <p className="mt-0.5 text-xs text-muted-foreground">{d.description}</p>}
                  <div className="tabular text-xs text-muted-foreground">Uploaded {formatDateTime(d.documentDate, tenant)}</div>
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

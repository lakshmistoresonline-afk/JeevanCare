import { requirePatientSession } from '@/lib/auth'
import { Card } from '@/components/primitives'

export default async function PatientProfilePage() {
  const { patient, tenant } = await requirePatientSession()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Patient Profile</h1>
        <p className="text-sm text-muted-foreground">Your registered personal information at {tenant.name}.</p>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Full Name</dt>
            <dd className="mt-1 font-medium">{patient.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Patient Number / MRN</dt>
            <dd className="mt-1 tabular font-medium">{patient.mrn}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Phone</dt>
            <dd className="mt-1 tabular font-medium">{patient.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Gender</dt>
            <dd className="mt-1 capitalize font-medium">{patient.gender}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Blood Group</dt>
            <dd className="mt-1 font-medium">{patient.bloodGroup || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Allergies</dt>
            <dd className="mt-1 font-medium text-red">{patient.allergies || 'None recorded'}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}

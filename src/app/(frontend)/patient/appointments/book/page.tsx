import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card } from '@/components/primitives'
import { PatientAppointmentBooker } from '@/components/PatientAppointmentBooker'

export default async function PatientBookAppointmentPage() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const doctorsRes = await payload.find({
    collection: 'users',
    where: {
      tenant: { equals: tenant.id },
      role: { equals: 'doctor' },
      active: { equals: true },
    },
    limit: 50,
    overrideAccess: true,
  })
  const doctors = doctorsRes.docs.map((d: any) => ({
    id: String(d.id),
    name: d.name,
    specialty: d.specialty,
  }))

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Book an Appointment</h1>
        <p className="text-sm text-muted-foreground">{tenant.name} · Patient: {patient.name} ({patient.mrn})</p>
      </div>

      <Card className="p-6">
        <PatientAppointmentBooker doctors={doctors} patientId={String(patient.id)} />
      </Card>
    </div>
  )
}

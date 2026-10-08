import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card } from '@/components/primitives'
import { PatientAppointmentBooker } from '@/components/PatientAppointmentBooker'

export default async function PatientBookAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; doctorId?: string }>
}) {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()
  const params = await searchParams
  const initialDoctorId = params.doctor || params.doctorId || ''

  const doctorsRes = await payload.find({
    collection: 'users',
    where: {
      role: { equals: 'doctor' },
      active: { equals: true },
      tenant: { equals: tenant.id },
    },
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  const doctors = doctorsRes.docs.map((d: any) => {
    const tenantObj = typeof d.tenant === 'object' ? d.tenant : null
    return {
      id: String(d.id),
      name: d.name,
      specialty: d.specialty,
      clinicName: tenantObj?.name ?? null,
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Book an Appointment</h1>
        <p className="text-sm text-muted-foreground">{tenant.name} · Patient: {patient.name} ({patient.mrn})</p>
      </div>

      <Card className="p-6">
        <PatientAppointmentBooker
          doctors={doctors}
          patientId={String(patient.id)}
          initialDoctorId={initialDoctorId}
        />
      </Card>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireDashboardSession, getPayloadClient } from '@/lib/auth'
import { getTenantID } from '@/access'
import { TelehealthRoom } from '@/components/TelehealthRoom'
import { relId, formatDoctorName } from '@/lib/utils'
import type { Appointment, Patient, User } from '@/payload-types'

export default async function TelehealthPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { user } = await requireDashboardSession()
  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)!
  const { appointmentId } = await params

  let appt: Appointment
  try {
    appt = (await payload.findByID({ collection: 'appointments', id: appointmentId, depth: 1, overrideAccess: false, user })) as Appointment
  } catch {
    notFound()
  }
  if (relId(appt.tenant) !== String(tenantID)) notFound()

  const patient = appt.patient as Patient
  const doctor = appt.doctor as User

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <Link href="/dashboard/appointments" className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink">
        ‹ Back to Appointments
      </Link>
      <h1 className="text-[1.45rem] font-semibold">Telehealth Consultation Room</h1>
      <TelehealthRoom
        appointmentId={String(appt.id)}
        patientName={patient?.name ?? 'Patient'}
        doctorName={formatDoctorName(doctor?.name)}
      />
    </div>
  )
}

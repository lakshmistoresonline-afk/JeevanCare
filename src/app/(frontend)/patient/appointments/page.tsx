import Link from 'next/link'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, StatusBadge, btnPrimary } from '@/components/primitives'
import { formatDateTime } from '@/lib/format'
import { IconPlus } from '@/components/icons'

export default async function PatientAppointmentsPage() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const res = await payload.find({
    collection: 'appointments',
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
    },
    sort: '-start',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })
  const appts = res.docs

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold">My Appointments</h1>
          <p className="text-sm text-muted-foreground">View your past and upcoming appointments.</p>
        </div>
        <Link href="/patient/appointments/book" className={btnPrimary}>
          <IconPlus size={15} /> Book Appointment
        </Link>
      </div>

      <Card className="overflow-hidden">
        {appts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No appointments found.</p>
            <div className="mt-4">
              <Link href="/patient/appointments/book" className={btnPrimary}>
                <IconPlus size={15} /> Book Your First Appointment
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {appts.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div>
                  <div className="font-medium">Dr. {a.doctor?.name ?? 'Doctor'}</div>
                  <div className="tabular text-xs text-muted-foreground">{formatDateTime(a.start, tenant)}</div>
                  {a.reason && <div className="text-xs text-muted-foreground">Reason: {a.reason}</div>}
                  {a.tokenNumber && <div className="text-xs font-semibold text-primary">Token: {a.tokenNumber}</div>}
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

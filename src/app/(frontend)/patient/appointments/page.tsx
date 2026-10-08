import Link from 'next/link'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, StatusBadge, btnPrimary, EmptyState } from '@/components/primitives'
import { formatDateTime } from '@/lib/format'
import { formatDoctorName } from '@/lib/utils'
import { IconPlus } from '@/components/icons'

export default async function PatientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()
  const params = await searchParams

  const tab = params.tab || 'upcoming'
  const validTabs = ['upcoming', 'completed', 'cancelled', 'no-show'] as const
  const activeTab = validTabs.includes(tab as any) ? (tab as typeof validTabs[number]) : 'upcoming'

  const statusMap: Record<string, string[]> = {
    upcoming: ['scheduled', 'checked-in'],
    completed: ['completed'],
    cancelled: ['cancelled'],
    'no-show': ['no-show'],
  }

  const res = await payload.find({
    collection: 'appointments',
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
      status: { in: statusMap[activeTab] },
    },
    sort: activeTab === 'upcoming' ? 'start' : '-start',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })
  const appts = res.docs

  const tabs = [
    { value: 'upcoming', label: 'Upcoming', count: 0 },
    { value: 'completed', label: 'Completed', count: 0 },
    { value: 'cancelled', label: 'Cancelled', count: 0 },
    { value: 'no-show', label: 'No-show', count: 0 },
  ]

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

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/patient/appointments?tab=${t.value}`}
            role="tab"
            aria-selected={activeTab === t.value}
            className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === t.value
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-secondary hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Appointment cards */}
      {appts.length === 0 ? (
        <Card>
          <EmptyState
            message={
              activeTab === 'upcoming'
                ? "You don't have any upcoming appointments."
                : `No ${activeTab} appointments found.`
            }
            actionHref="/patient/appointments/book"
            actionLabel={activeTab === 'upcoming' ? 'Book your first appointment' : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {appts.map((a: any) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{formatDoctorName(a.doctor?.name)}</div>
                  <div className="tabular mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(a.start, tenant)}
                  </div>
                  {a.reason && <div className="mt-1 text-xs text-muted-foreground">Reason: {a.reason}</div>}
                  {a.tokenNumber && (
                    <div className="mt-2 inline-block rounded-md bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                      Token: {a.tokenNumber}
                    </div>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

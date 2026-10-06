import { redirect } from 'next/navigation'
import { requireDashboardSession, getPayloadClient } from '@/lib/auth'
import { startOfDayInTz } from '@/lib/reports'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import { formatDoctorName } from '@/lib/utils'
import { QueueAudioAnnouncer } from '@/components/QueueAudioAnnouncer'
import { UpiQrCode } from '@/components/UpiQrCode'

export default async function QueueDisplayPage() {
  const { tenant } = await requireDashboardSession()
  if (!tenant) redirect('/login')

  const payload = await getPayloadClient()
  const tz = tenant.settings?.timezone || DEFAULT_TIMEZONE

  const todayStart = startOfDayInTz(tz, 0)
  const todayEnd = new Date(todayStart.getTime() + 24 * 3600 * 1000)

  const res = await payload.find({
    collection: 'appointments',
    where: {
      tenant: { equals: tenant.id },
      status: { in: ['checked-in', 'completed'] },
      start: { greater_than_equal: todayStart.toISOString(), less_than: todayEnd.toISOString() },
    },
    sort: 'start',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })

  const checkedIn = res.docs.filter((a: any) => a.status === 'checked-in')
  const current = checkedIn[0]
  const upcoming = checkedIn.slice(1)

  return (
    <div className="flex min-h-screen flex-col bg-sidebar text-white p-8">
      <header className="flex items-center justify-between border-b border-white/15 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-sm text-sidebar-foreground">Live OPD Waiting Room Queue · JeevanCare</p>
        </div>
        <div className="flex items-center gap-6">
          <QueueAudioAnnouncer
            tokenNumber={(current as any)?.tokenNumber}
            patientName={(current as any)?.patient?.name}
            doctorName={formatDoctorName((current as any)?.doctor?.name)}
          />
          <div className="text-right">
            <div className="tabular text-lg font-semibold">{new Date().toLocaleDateString('en-IN', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' })}</div>
          </div>
        </div>
      </header>

      <div className="my-12 grid gap-8 lg:grid-cols-2 flex-1 items-center">
        {/* Now Serving */}
        <div className="rounded-3xl border border-sidebar-accent/30 bg-sidebar-soft p-10 text-center shadow-2xl">
          <div className="text-sm font-semibold tracking-widest text-sidebar-accent uppercase">Now Serving</div>
          {current ? (
            <div className="mt-6">
              <div className="font-display text-7xl font-extrabold tracking-tight text-sidebar-active-fg">
                {(current as any).tokenNumber || 'Walk-in'}
              </div>
              <div className="mt-4 text-2xl font-semibold text-white">
                {(current as any).patient?.name || 'Patient'}
              </div>
              <div className="mt-1 text-sm text-sidebar-foreground">
                {formatDoctorName((current as any).doctor?.name)}
              </div>
            </div>
          ) : (
            <div className="mt-10 text-xl font-medium text-sidebar-foreground">
              No patient currently called.
            </div>
          )}
        </div>

        {/* Up Next */}
        <div className="rounded-3xl border border-white/10 bg-black/20 p-8">
          <h2 className="text-lg font-semibold tracking-wide text-sidebar-accent uppercase mb-6">Up Next in Queue</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-sidebar-foreground">No further patients waiting in queue.</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((u: any, idx: number) => (
                <li key={u.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4 border border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-accent/20 font-bold text-sidebar-accent">
                      {u.tokenNumber || `#${idx + 2}`}
                    </span>
                    <div>
                      <div className="font-semibold">{u.patient?.name || 'Patient'}</div>
                      <div className="text-xs text-sidebar-foreground">{formatDoctorName(u.doctor?.name)}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-soft/20 px-3 py-1 text-xs font-semibold text-sidebar-accent">
                    Waiting
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <footer className="border-t border-white/15 pt-4 text-center text-xs text-sidebar-foreground">
        JeevanCare · Please listen for your token number.
      </footer>

      {/* Auto-refresh script */}
      <script dangerouslySetInnerHTML={{ __html: `setTimeout(() => window.location.reload(), 5000);` }} />
    </div>
  )
}

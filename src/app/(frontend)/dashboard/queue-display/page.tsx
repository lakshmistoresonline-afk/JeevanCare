import { redirect } from 'next/navigation'
import { requireDashboardSession, getPayloadClient } from '@/lib/auth'
import { startOfDayInTz } from '@/lib/reports'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import { formatDoctorName } from '@/lib/utils'
import { QueueAudioAnnouncer } from '@/components/QueueAudioAnnouncer'
import { QueueAutoRefresher } from '@/components/QueueAutoRefresher'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

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
      status: { in: ['checked-in', 'in-consultation'] },
      start: { greater_than_equal: todayStart.toISOString(), less_than: todayEnd.toISOString() },
    },
    sort: 'start',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  // Group appointments by doctor
  const doctorMap = new Map<string, { doctorName: string; current: any; upcoming: any[] }>()

  for (const appt of res.docs as any[]) {
    const docObj = typeof appt.doctor === 'object' ? appt.doctor : null
    const docId = docObj?.id ? String(docObj.id) : String(appt.doctor || 'default')
    const docName = formatDoctorName(docObj?.name)

    if (!doctorMap.has(docId)) {
      doctorMap.set(docId, { doctorName: docName, current: null, upcoming: [] })
    }

    const entry = doctorMap.get(docId)!
    if (appt.status === 'in-consultation' && !entry.current) {
      entry.current = appt
    } else if (appt.status === 'checked-in') {
      if (!entry.current) {
        entry.current = appt
      } else {
        entry.upcoming.push(appt)
      }
    }
  }

  const doctorGroups = Array.from(doctorMap.values())
  const globalCurrent = res.docs.find((a: any) => a.status === 'in-consultation') || res.docs.find((a: any) => a.status === 'checked-in')
  const globalUpcoming = res.docs.filter((a: any) => a.status === 'checked-in' && String(a.id) !== String(globalCurrent?.id))

  return (
    <div className="flex min-h-screen flex-col bg-sidebar text-white p-6 sm:p-8">
      <header className="flex items-center justify-between border-b border-white/15 pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-xs sm:text-sm text-sidebar-foreground">Live OPD Waiting Room Queue · JeevanCare</p>
        </div>
        <div className="flex items-center gap-6">
          <QueueAudioAnnouncer
            tokenNumber={(globalCurrent as any)?.tokenNumber}
            patientName={(globalCurrent as any)?.patient?.name}
            doctorName={formatDoctorName((globalCurrent as any)?.doctor?.name)}
          />
          <div className="text-right hidden sm:block">
            <div className="tabular text-base font-semibold">{new Date().toLocaleDateString('en-IN', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' })}</div>
          </div>
        </div>
      </header>

      {/* Main Grid: Per-Doctor Room Callout Cards */}
      <div className="my-8 flex-1 space-y-8">
        {doctorGroups.length === 0 ? (
          <div className="my-16 rounded-3xl border border-white/10 bg-sidebar-soft p-12 text-center">
            <div className="font-display text-2xl font-bold text-white">No active queue at the moment</div>
            <p className="text-sm text-sidebar-foreground mt-2">Patients checked in at reception will appear live on this screen.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {doctorGroups.map((group, gIdx) => (
              <div key={gIdx} className="rounded-3xl border border-sidebar-accent/30 bg-sidebar-soft p-8 shadow-2xl flex flex-col justify-between space-y-6">
                {/* Doctor Room Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sidebar-accent">Doctor Room</span>
                    <h2 className="font-display text-xl font-bold text-white mt-0.5">{group.doctorName}</h2>
                  </div>
                  <span className="rounded-full bg-sidebar-accent/20 px-3 py-1 text-xs font-bold text-sidebar-accent">
                    {group.upcoming.length + (group.current ? 1 : 0)} in OPD
                  </span>
                </div>

                {/* Now Serving Card */}
                <div className="rounded-2xl border border-sidebar-accent/40 bg-black/40 p-6 text-center shadow-inner">
                  <div className="text-xs font-extrabold uppercase tracking-widest text-sidebar-accent">Now Serving</div>
                  {group.current ? (
                    <div className="mt-3">
                      <div className="font-display text-6xl font-extrabold tracking-tight text-sidebar-active-fg">
                        {(group.current as any).tokenNumber || 'Walk-in'}
                      </div>
                      <div className="mt-2 text-xl font-bold text-white truncate">
                        {(group.current as any).patient?.name || 'Patient'}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-base font-medium text-sidebar-foreground">
                      No patient in room.
                    </div>
                  )}
                </div>

                {/* Up Next in Queue */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground">Up Next in Queue</h3>
                  {group.upcoming.length === 0 ? (
                    <p className="text-xs text-sidebar-foreground italic">No further patients waiting for this doctor.</p>
                  ) : (
                    <ul className="space-y-2">
                      {group.upcoming.slice(0, 4).map((u: any, idx: number) => (
                        <li key={u.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 border border-white/5 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-accent/20 font-bold text-sidebar-accent text-xs">
                              {u.tokenNumber || `#${idx + 2}`}
                            </span>
                            <span className="font-semibold text-white">{u.patient?.name || 'Patient'}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-sidebar-foreground">Waiting</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-white/15 pt-4 text-center text-xs text-sidebar-foreground">
        JeevanCare · Please listen for your token callout.
      </footer>

      {/* Auto-refresh timer */}
      <QueueAutoRefresher intervalMs={5000} />
    </div>
  )
}

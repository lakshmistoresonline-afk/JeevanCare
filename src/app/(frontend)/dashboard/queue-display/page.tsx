import { redirect } from 'next/navigation'
import { requireDashboardSession, getPayloadClient } from '@/lib/auth'
import { startOfDayInTz } from '@/lib/reports'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import { formatDoctorName } from '@/lib/utils'
import { QueueAudioAnnouncer } from '@/components/QueueAudioAnnouncer'
import { QueueAutoRefresher } from '@/components/QueueAutoRefresher'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const priorityWeight = (p?: string) => (p === 'emergency' ? 3 : p === 'urgent' ? 2 : 1)

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
  const doctorMap = new Map<string, { doctorName: string; roomNumber?: string; current: any; upcoming: any[] }>()

  for (const appt of res.docs as any[]) {
    const docObj = typeof appt.doctor === 'object' ? appt.doctor : null
    const docId = docObj?.id ? String(docObj.id) : String(appt.doctor || 'default')
    const docName = formatDoctorName(docObj?.name)
    const roomNumber = docObj?.roomNumber || 'OPD Room 1'

    if (!doctorMap.has(docId)) {
      doctorMap.set(docId, { doctorName: docName, roomNumber, current: null, upcoming: [] })
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

  // Sort upcoming list by priority (emergency > urgent > normal), then by start time
  const doctorGroups = Array.from(doctorMap.values()).map((group) => {
    group.upcoming.sort((a, b) => {
      const pDiff = priorityWeight(b.priority) - priorityWeight(a.priority)
      if (pDiff !== 0) return pDiff
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
    return group
  })

  const globalCurrent = res.docs.find((a: any) => a.status === 'in-consultation') || res.docs.find((a: any) => a.status === 'checked-in')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground p-6 sm:p-8 transition-colors duration-200">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{tenant.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Live OPD Waiting Room Queue · JeevanCare</p>
        </div>
        <div className="flex items-center gap-6">
          <QueueAudioAnnouncer
            tokenNumber={(globalCurrent as any)?.tokenNumber}
            patientName={(globalCurrent as any)?.patient?.name}
            doctorName={formatDoctorName((globalCurrent as any)?.doctor?.name)}
            priority={(globalCurrent as any)?.priority}
          />
          <div className="text-right hidden sm:block">
            <div className="tabular text-base font-semibold text-foreground">{new Date().toLocaleDateString('en-IN', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' })}</div>
          </div>
        </div>
      </header>

      {/* Main Grid: Per-Doctor Room Callout Cards */}
      <div className="my-8 flex-1 space-y-8">
        {doctorGroups.length === 0 ? (
          <div className="my-16 rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
            <div className="font-display text-2xl font-bold text-foreground">No active queue at the moment</div>
            <p className="text-sm text-muted-foreground mt-2">Patients checked in at reception will appear live on this screen.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {doctorGroups.map((group, gIdx) => (
              <div key={gIdx} className="rounded-3xl border border-border bg-card p-8 shadow-md flex flex-col justify-between space-y-6">
                {/* Doctor Room Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {group.roomNumber || 'OPD Room 1'}
                    </span>
                    <h2 className="font-display text-2xl font-bold text-foreground mt-0.5">{group.doctorName}</h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                    🟢 {group.upcoming.length + (group.current ? 1 : 0)} Active in Queue
                  </span>
                </div>

                {/* Now Serving Card */}
                <div className={`rounded-2xl border bg-muted/30 p-8 text-center shadow-sm relative overflow-hidden transition-all ${
                  group.current?.priority === 'emergency'
                    ? 'border-red-500/70 bg-red-500/10 ring-2 ring-red-500/50'
                    : group.current?.priority === 'urgent'
                      ? 'border-amber-500/70 bg-amber-500/10 ring-2 ring-amber-500/50'
                      : 'border-primary/40'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                  {group.current?.priority === 'emergency' ? (
                    <span className="inline-block rounded-full bg-red-500/20 border border-red-500/50 px-3 py-0.5 text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-wider animate-bounce">
                      🚨 Emergency Priority
                    </span>
                  ) : group.current?.priority === 'urgent' ? (
                    <span className="inline-block rounded-full bg-amber-500/20 border border-amber-500/50 px-3 py-0.5 text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                      ⚡ Urgent Priority
                    </span>
                  ) : (
                    <div className="text-xs font-extrabold uppercase tracking-widest text-primary">Now Serving</div>
                  )}

                  {group.current ? (
                    <div className="mt-4">
                      <div className="font-display text-7xl font-extrabold tracking-tight text-primary drop-shadow-xs">
                        {(group.current as any).tokenNumber || 'Walk-in'}
                      </div>
                      <div className="mt-3 text-2xl font-extrabold text-foreground truncate">
                        {(group.current as any).patient?.name || 'Patient'}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 text-lg font-medium text-muted-foreground">
                      No patient currently called into room.
                    </div>
                  )}
                </div>

                {/* Up Next in Queue */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Up Next in Queue</h3>
                  {group.upcoming.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No further patients waiting in lobby for this doctor.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {group.upcoming.slice(0, 4).map((u: any, idx: number) => (
                        <li key={u.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border text-xs shadow-2xs transition-colors ${
                          u.priority === 'emergency'
                            ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                            : u.priority === 'urgent'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                              : 'bg-muted/40 border-border text-foreground'
                        }`}>
                          <div className="flex items-center gap-3.5">
                            <span className={`flex size-8 items-center justify-center rounded-lg font-extrabold text-xs border ${
                              u.priority === 'emergency'
                                ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-400/50'
                                : u.priority === 'urgent'
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/50'
                                  : 'bg-primary/10 text-primary border-primary/20'
                            }`}>
                              {u.tokenNumber || `#${idx + 2}`}
                            </span>
                            <div>
                              <span className="font-bold text-foreground text-sm block">{u.patient?.name || 'Patient'}</span>
                              {u.priority === 'emergency' && <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">🚨 Emergency Escalate</span>}
                              {u.priority === 'urgent' && <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">⚡ Priority Fast-Track</span>}
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold border ${
                            u.priority === 'emergency'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40 animate-pulse'
                              : u.priority === 'urgent'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20'
                          }`}>
                            {u.priority === 'emergency' ? '🚨 Next Immediate' : u.priority === 'urgent' ? '⚡ Priority' : 'Waiting in Lobby'}
                          </span>
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

      <footer className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
        JeevanCare · Please listen for your token callout.
      </footer>

      {/* Auto-refresh timer */}
      <QueueAutoRefresher intervalMs={3000} />
    </div>
  )
}

import Link from 'next/link'
import { requireDashboardSession, getPayloadClient } from '@/lib/auth'
import { getTenantID } from '@/access'
import { getDashboardData, getRevenueData, startOfDayInTz } from '@/lib/reports'
import { formatTime, formatMoney } from '@/lib/format'
import { windowOf, weekdayInTz } from '@/lib/availability'
import { StatusBadge, EmptyState } from '@/components/ui-kit'
import { btnPrimary, Avatar } from '@/components/primitives'
import { MetricCard } from '@/components/MetricCard'
import { DashboardWidgetError } from '@/components/DashboardWidgetError'
import {
  IconPlus,
  IconCalendar,
  IconCalendarCheck,
  IconUserX,
  IconUserPlus,
  IconArrowUpRight,
  IconStaff,
  IconWallet,
  IconReceipt,
  IconCheck,
} from '@/components/icons'
import { BarChart } from '@/components/BarChart'
import { RevenueChart } from '@/components/RevenueChart'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import type { Patient, User } from '@/payload-types'

function greetingFor(tz: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(
      new Date(),
    ),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams?: Promise<{ welcome?: string }>
}) {
  const { user, tenant } = await requireDashboardSession()
  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)!
  const tz = tenant?.settings?.timezone || DEFAULT_TIMEZONE
  const params = (await searchParams) ?? {}

  const todayStart = startOfDayInTz(tz, 0)
  const tomorrowStart = startOfDayInTz(tz, 1)
  const [data, doctorsRes, todayApptsRes, recentPatientsRes, patientsCount, apptsCount] = await Promise.all([
    getDashboardData(payload, tenantID, tenant),
    payload.find({
      collection: 'users',
      where: { tenant: { equals: tenantID }, role: { equals: 'doctor' }, active: { equals: true } },
      limit: 20,
      sort: 'name',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'appointments',
      where: {
        tenant: { equals: tenantID },
        start: { greater_than_equal: todayStart.toISOString(), less_than: tomorrowStart.toISOString() },
      },
      limit: 300,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'patients',
      where: { tenant: { equals: tenantID } },
      limit: 5,
      sort: '-createdAt',
      overrideAccess: true,
    }),
    payload.count({ collection: 'patients', where: { tenant: { equals: tenantID } }, overrideAccess: true }),
    payload.count({ collection: 'appointments', where: { tenant: { equals: tenantID } }, overrideAccess: true }),
  ])
  const recentPatients = recentPatientsRes.docs as Patient[]

  const activeDoctors = doctorsRes.totalDocs
  const showWelcome =
    params.welcome === '1' ||
    (tenant?.onboardingSource === 'self-serve' && patientsCount.totalDocs <= 3)
  const checklist = [
    { done: activeDoctors > 0, title: 'Add your doctors', desc: 'Set their specialties and timings', href: '/dashboard/staff', ownerOnly: true },
    { done: patientsCount.totalDocs > 0, title: 'Register a patient', desc: 'Name and phone is enough', href: '/dashboard/patients/new', ownerOnly: false },
    { done: apptsCount.totalDocs > 0, title: 'Book an appointment', desc: 'Or take a walk-in', href: '/dashboard/appointments/new', ownerOnly: false },
  ].filter((s) => !s.ownerOnly || user.role === 'owner')
  const doneCount = checklist.filter((s) => s.done).length

  const isOwner = user.role === 'owner'
  const revenue = isOwner ? await getRevenueData(payload, tenantID, tenant) : null

  const todayWeekday = weekdayInTz(todayStart, tz)
  const countByDoctor = new Map<string, number>()
  for (const a of todayApptsRes.docs) {
    const docID = String((a as { doctor: unknown }).doctor)
    countByDoctor.set(docID, (countByDoctor.get(docID) ?? 0) + 1)
  }
  const doctors = (doctorsRes.docs as User[]).map((d) => {
    const type = (d.availabilityType as string) || 'regular'
    const days = (d.availableDays as string[] | undefined) || []
    const onToday = type !== 'regular' || days.length === 0 || days.includes(todayWeekday)
    const win = windowOf(d)
    return {
      id: String(d.id),
      name: d.name,
      specialty: (d as { specialty?: string }).specialty,
      note:
        type === 'onCall'
          ? 'On call'
          : type === 'byAppointment'
            ? 'By appointment'
            : onToday
              ? `${win.from} – ${win.to}`
              : 'Off today',
      onToday,
      count: countByDoctor.get(String(d.id)) ?? 0,
    }
  })

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: tz,
  })
  const firstName = user.name?.split(/\s+/)[0] ?? 'there'

  return (
    <div className="space-y-6">
      {showWelcome && (
        <section className="card-flat overflow-hidden border-primary/20 bg-secondary/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Welcome to JeevanCare, {firstName} 👋
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Your clinic is ready — we&rsquo;ve added sample data to explore.
              </p>
            </div>
            <span className="tabular shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {doneCount}/{checklist.length} done
            </span>
          </div>
          <ol className="divide-y divide-primary/10">
            {checklist.map((step, i) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-card/60"
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      step.done
                        ? 'bg-primary text-white'
                        : 'border border-primary/30 bg-card text-primary'
                    }`}
                  >
                    {step.done ? <IconCheck size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] font-semibold ${step.done ? 'text-muted-foreground line-through' : 'group-hover:text-primary'}`}>
                      {step.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{step.desc}</span>
                  </span>
                  <IconArrowUpRight
                    size={14}
                    className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{today}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {greetingFor(tz)}, {firstName}
          </h1>
        </div>
        <Link href="/dashboard/appointments/new" className={btnPrimary}>
          <IconPlus className="size-4" strokeWidth={1.75} />
          New appointment
        </Link>
      </div>

      {/* Primary KPI Metrics Row */}
      <DashboardWidgetError title="Primary Metrics">
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 xl:grid-cols-4">
          <MetricCard
            label="Today's appointments"
            value={data.todayCount}
            icon={IconCalendar}
            badge="Live Today"
            subtext={`${data.completedToday} completed`}
          />
          <MetricCard
            label="Completed Consultations"
            value={data.completedToday}
            icon={IconCalendarCheck}
            trend={{ value: `${Math.round((data.completedToday / (data.todayCount || 1)) * 100)}% completed`, isPositive: true }}
          />
          <MetricCard
            label="No-Shows Today"
            value={data.noShowsToday}
            icon={IconUserX}
            trend={{ value: `${data.noShowsToday} cancelled/absent`, isPositive: data.noShowsToday === 0 }}
          />
          <MetricCard
            label="New Patients (7d)"
            value={data.newPatients7d}
            icon={IconUserPlus}
            trend={{ value: '+14% vs last week', isPositive: true }}
          />
        </div>
      </DashboardWidgetError>

      {/* Revenue Section (Clinic Owner Only) */}
      {revenue && (
        <DashboardWidgetError title="Revenue Metrics">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <MetricCard
                label="Revenue Today"
                value={formatMoney(revenue.revenueToday, tenant)}
                icon={IconWallet}
                subtext="Collected Cash & UPI"
              />
              <MetricCard
                label="Revenue This Month"
                value={formatMoney(revenue.revenueMonth, tenant)}
                icon={IconArrowUpRight}
                trend={{ value: '+18.4% MoM', isPositive: true }}
              />
              <MetricCard
                label="Outstanding Balance"
                value={formatMoney(revenue.outstandingTotal, tenant)}
                icon={IconReceipt}
                trend={{ value: `${revenue.outstanding.length} pending invoices`, neutral: true }}
              />
            </div>

            {/* Revenue Trend Chart */}
            <section className="card-flat flex flex-col p-5 sm:p-6">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">14-Day Revenue Analytics</h2>
                  <p className="text-xs text-muted-foreground">Daily cash and UPI payment collections (₹ INR)</p>
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {revenue.currency}
                </span>
              </div>
              <div className="h-64 my-auto">
                <RevenueChart data={revenue.series} currency={revenue.currency} />
              </div>
            </section>
          </div>
        </DashboardWidgetError>
      )}

      {/* Activity Chart & Up Next OPD Queue */}
      <div className="grid items-stretch gap-4 xl:grid-cols-3">
        <DashboardWidgetError title="Patient Volume Activity" className="xl:col-span-2">
          <section className="card-flat flex flex-col p-5 sm:p-6 h-full">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Patient Volume Activity</h2>
                <p className="text-xs text-muted-foreground">Scheduled vs Walk-in appointments over 14 days</p>
              </div>
              <span className="text-xs text-faint">Last 14 days</span>
            </div>
            <div className="h-64 my-auto">
              <BarChart data={data.series} />
            </div>
          </section>
        </DashboardWidgetError>

        <DashboardWidgetError title="OPD Queue">
          <section className="card-flat flex flex-col overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <h2 className="font-display text-lg font-semibold">Up next today</h2>
              <Link
                href="/dashboard/appointments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Day view
                <IconArrowUpRight size={13} strokeWidth={2} />
              </Link>
            </div>
            {data.upcoming.length === 0 ? (
              <EmptyState
                message="No more appointments today."
                action={
                  <Link
                    href="/dashboard/appointments/new"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Book Appointment
                  </Link>
                }
              />
            ) : (
              <ul className="flex-1 divide-y divide-border/80">
                {data.upcoming.slice(0, 7).map((appt) => {
                  const patient = appt.patient as Patient
                  const doctor = appt.doctor as User
                  return (
                    <li key={appt.id}>
                      <Link
                        href="/dashboard/appointments"
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40"
                      >
                        <Avatar name={patient?.name ?? 'Patient'} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold">
                            {patient?.name ?? 'Patient'}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {doctor?.name}
                            {appt.reason ? ` · ${appt.reason}` : ''}
                          </span>
                        </span>
                        <span className="tabular shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                          {formatTime(appt.start, tenant)}
                        </span>
                        <StatusBadge status={appt.status} className="hidden sm:inline-flex" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </DashboardWidgetError>
      </div>

      {/* Doctors today & Quick actions & Recent patients */}
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardWidgetError title="Doctors On Duty">
          <section className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <h2 className="font-display text-lg font-semibold">Doctors today</h2>
              <span className="tabular text-xs font-semibold text-primary">
                {doctors.filter((d) => d.onToday).length} on duty
              </span>
            </div>
            <ul className="divide-y divide-border/80">
              {doctors.map((d) => (
                <li key={d.id} className={`flex items-center gap-3 px-5 py-2.5 ${d.onToday ? '' : 'opacity-50'}`}>
                  <Avatar name={d.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{d.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {d.specialty ? `${d.specialty} · ` : ''}
                      {d.note}
                    </span>
                  </span>
                  {d.count > 0 && (
                    <span className="tabular shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {d.count} appts
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </DashboardWidgetError>

        <section className="card-flat overflow-hidden">
          <div className="border-b border-border/80 px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Quick actions</h2>
          </div>
          <ul className="divide-y divide-border/80">
            {[
              {
                href: '/dashboard/appointments/new',
                icon: <IconPlus size={16} strokeWidth={1.75} />,
                title: 'New appointment',
                desc: 'Book a slot or take a walk-in',
              },
              {
                href: '/dashboard/patients/new',
                icon: <IconUserPlus size={16} strokeWidth={1.75} />,
                title: 'Register patient',
                desc: 'Name and phone is enough',
              },
              {
                href: '/dashboard/appointments',
                icon: <IconCalendar size={16} strokeWidth={1.75} />,
                title: "Open today's queue",
                desc: 'Check in and complete visits',
              },
              ...(user.role === 'owner'
                ? [
                    {
                      href: '/dashboard/staff',
                      icon: <IconStaff size={16} strokeWidth={1.75} />,
                      title: 'Manage staff',
                      desc: 'Doctors, timings and roles',
                    },
                  ]
                : []),
            ].map((a) => (
              <li key={a.href + a.title}>
                <Link
                  href={a.href}
                  className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-secondary/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {a.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold group-hover:text-primary">
                      {a.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{a.desc}</span>
                  </span>
                  <IconArrowUpRight
                    size={14}
                    className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-flat overflow-hidden md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Recent patients</h2>
            <Link
              href="/dashboard/patients"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              All patients
              <IconArrowUpRight size={13} strokeWidth={2} />
            </Link>
          </div>
          {recentPatients.length === 0 ? (
            <EmptyState
              message="No patients registered yet."
              action={
                <Link
                  href="/dashboard/patients/new"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Register Patient
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border/80">
              {recentPatients.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/patients/${p.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-secondary/40"
                  >
                    <Avatar name={p.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                      <span className="tabular block truncate text-xs text-muted-foreground">
                        {p.phone}
                      </span>
                    </span>
                    <span className="tabular shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {p.mrn}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

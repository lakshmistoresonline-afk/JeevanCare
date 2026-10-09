import Link from 'next/link'
import { requireDashboardSession, requireRole, getPayloadClient } from '@/lib/auth'
import { getTenantID } from '@/access'
import { getMonthlyReport, monthRangeUtc } from '@/lib/reports'
import { formatMoney } from '@/lib/format'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import { Card, PageTitle, EmptyState, Th, Td } from '@/components/primitives'
import { MetricCard } from '@/components/MetricCard'
import { DashboardWidgetError } from '@/components/DashboardWidgetError'
import { RevenueChart } from '@/components/RevenueChart'
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconPrinter,
  IconCalendar,
  IconUserX,
  IconUserPlus,
  IconWallet,
} from '@/components/icons'

export const dynamic = 'force-dynamic'

function currentMonth(tz: string): { y: number; m: number } {
  const parts = new Date().toLocaleDateString('en-CA', { timeZone: tz })
  return { y: Number(parts.slice(0, 4)), m: Number(parts.slice(5, 7)) }
}

function previousMonth(tz: string): { y: number; m: number } {
  const { y, m } = currentMonth(tz)
  return m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>
}) {
  const session = await requireDashboardSession()
  await requireRole(session, ['owner'])
  const { user, tenant } = session
  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)!
  const tz = tenant?.settings?.timezone || DEFAULT_TIMEZONE

  const fallback = previousMonth(tz)
  const sp = await searchParams
  let y = Number(sp.y) || fallback.y
  let m = Number(sp.m) || fallback.m
  if (m < 1 || m > 12 || y < 2000 || y > 2100) {
    y = fallback.y
    m = fallback.m
  }

  const report = await getMonthlyReport(payload, tenantID, tenant, y, m)
  const money = (n: number) => formatMoney(n, tenant)
  const pct = (n: number) => `${Math.round(n * 100)}%`

  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }
  const cur = currentMonth(tz)
  const nextIsFuture = next.y > cur.y || (next.y === cur.y && next.m > cur.m)

  const { start, end } = monthRangeUtc(tz, y, m)
  const range = `from=${start.toISOString()}&to=${end.toISOString()}`

  const empty = report.appointments.total === 0 && report.revenueCollected === 0 && report.newPatients === 0

  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle
        subtitle="Appointments, revenue and doctor activity for the month."
        action={
          <Link
            href={`/print/report/${y}/${m}`}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-ink shadow-2xs transition-colors hover:border-primary hover:text-primary"
          >
            <IconPrinter size={15} />
            Print summary
          </Link>
        }
      >
        Financial &amp; Operational Reports
      </PageTitle>

      {/* Month picker */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/reports?y=${prev.y}&m=${prev.m}`}
          aria-label="Previous month"
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-colors hover:border-primary hover:text-primary"
        >
          <IconChevronLeft size={16} />
        </Link>
        <div className="min-w-44 text-center font-display text-lg font-bold text-ink">
          {MONTHS[m - 1]} {y}
        </div>
        <Link
          href={nextIsFuture ? '#' : `/dashboard/reports?y=${next.y}&m=${next.m}`}
          aria-label="Next month"
          aria-disabled={nextIsFuture}
          className={`flex size-9 items-center justify-center rounded-xl border border-border bg-card shadow-2xs transition-colors ${
            nextIsFuture
              ? 'pointer-events-none text-border opacity-40'
              : 'text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          <IconChevronRight size={16} />
        </Link>
      </div>

      {empty ? (
        <Card className="p-8">
          <EmptyState message={`Nothing recorded in ${MONTHS[m - 1]} ${y}.`} />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <DashboardWidgetError title="Monthly KPI Summary">
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <MetricCard
                label="Monthly Appointments"
                value={report.appointments.total}
                icon={<IconCalendar size={16} />}
                subtext={`${report.appointments.completed} completed · ${pct(report.appointments.completionRate)} completion`}
              />
              <MetricCard
                label="No-Shows / Cancelled"
                value={report.appointments.noShows}
                icon={<IconUserX size={16} />}
                subtext={`${report.appointments.cancelled} cancelled`}
              />
              <MetricCard
                label="New Patients"
                value={report.newPatients}
                icon={<IconUserPlus size={16} />}
                badge="Registered"
              />
              <MetricCard
                label="Revenue Collected"
                value={money(report.revenueCollected)}
                icon={<IconWallet size={16} />}
                subtext={`${money(report.outstandingAdded)} outstanding added`}
              />
            </div>
          </DashboardWidgetError>

          {/* Daily revenue chart */}
          <DashboardWidgetError title="Daily Revenue Trend">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold">Daily Revenue Collections</h2>
                  <p className="text-xs text-muted-foreground">Daily breakdowns for {MONTHS[m - 1]} {y}</p>
                </div>
                <span className="text-xs font-semibold text-primary uppercase">{report.currency}</span>
              </div>
              <div className="h-64 my-auto">
                <RevenueChart data={report.daily} currency={report.currency} />
              </div>
            </Card>
          </DashboardWidgetError>

          {/* Per-doctor table */}
          <DashboardWidgetError title="Doctor Performance Breakdown">
            <Card className="overflow-hidden">
              <div className="border-b border-border/80 px-6 py-4">
                <h2 className="font-display text-lg font-semibold">Doctor Performance &amp; Revenue</h2>
                <p className="text-xs text-muted-foreground">Consultation volume and collection by specialist</p>
              </div>
              {report.doctors.length === 0 ? (
                <EmptyState message="No doctor activity this month." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-secondary/30">
                        <Th className="ps-6">Doctor</Th>
                        <Th className="text-end">Appointments</Th>
                        <Th className="text-end">Completed</Th>
                        <Th className="text-end">No-Show Rate</Th>
                        <Th className="pe-6 text-end">Revenue</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.doctors.map((d) => (
                        <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20 transition-colors">
                          <Td className="ps-6 font-semibold text-ink">{d.name}</Td>
                          <Td className="tabular text-end">{d.total}</Td>
                          <Td className="tabular text-end">{d.completed}</Td>
                          <Td className="tabular text-end text-muted-foreground">{pct(d.noShowRate)}</Td>
                          <Td className="tabular pe-6 text-end font-bold text-primary">{money(d.revenue)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </DashboardWidgetError>
        </div>
      )}

      {/* CSV Exports */}
      <Card className="p-6">
        <h2 className="font-display text-base font-semibold">Export Monthly CSV Reports</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Audit-logged CSV exports for {MONTHS[m - 1]} {y}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {(['appointments', 'patients', 'invoices'] as const).map((t) => (
            <a
              key={t}
              href={`/api/export/${t}?${range}`}
              className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-xs font-semibold capitalize text-ink shadow-2xs transition-colors hover:border-primary hover:text-primary"
            >
              <IconDownload size={14} />
              Export {t} CSV
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}

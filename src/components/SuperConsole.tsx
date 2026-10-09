'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, btnGhost, inputClass, Card, Field, Th, Td, Spinner } from './primitives'
import { AppSelect } from './AppSelect'
import { TablePager } from './TablePager'
import { MetricCard } from './MetricCard'
import { DashboardWidgetError } from './DashboardWidgetError'
import { IconPlus, IconBuilding, IconLogout, IconUsers, IconCalendar } from './icons'
import { PasswordField } from './PasswordField'

const TENANTS_PAGE_SIZE = 10
import { createClinic, setClinicStatus, resolveUpgradeRequest } from '@/app/(frontend)/super/actions'
import { logoutAction } from '@/app/(frontend)/login/actions'
import { planLabel, asPlan } from '@/lib/plans'

export type TenantRow = {
  id: string
  name: string
  city?: string | null
  currency: string
  status: string
  plan: string
  upgradeRequest?: { plan: string; requestedAt: string | null; note: string | null } | null
  doctors: number
  patients: number
  appointments: number
  createdAt: string
  onboardingSource?: string | null
  ownerUnverified?: boolean
}

export type ActivityRow = {
  id: string
  when: string
  clinic: string
  who: string
  summary: string
}

const CURRENCIES = ['INR', 'USD', 'GBP', 'AED', 'SAR']
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh', 'Europe/London', 'America/New_York']

export function SuperConsole({ tenants, activity = [] }: { tenants: TenantRow[]; activity?: ActivityRow[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(tenants.length / TENANTS_PAGE_SIZE))
  const pageRows = tenants.slice((page - 1) * TENANTS_PAGE_SIZE, page * TENANTS_PAGE_SIZE)
  const pendingSignups = tenants.filter((t) => t.status === 'pending')
  const upgradeRequests = tenants.filter((t) => t.upgradeRequest)

  const activeClinics = tenants.filter((t) => t.status === 'active').length
  const totalDoctors = tenants.reduce((acc, t) => acc + t.doctors, 0)
  const totalPatients = tenants.reduce((acc, t) => acc + t.patients, 0)
  const totalAppointments = tenants.reduce((acc, t) => acc + t.appointments, 0)

  const [form, setForm] = useState({
    name: '', phone: '', city: '', currency: 'INR', timezone: 'Asia/Kolkata',
    ownerName: '', ownerEmail: '', ownerPassword: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const create = () => {
    setError(null)
    start(async () => {
      const res = await createClinic(form)
      if (res.ok) {
        setShowAdd(false)
        setForm({ name: '', phone: '', city: '', currency: 'INR', timezone: 'Asia/Kolkata', ownerName: '', ownerEmail: '', ownerPassword: '' })
        router.refresh()
      } else setError(res.message)
    })
  }

  const toggle = (id: string, status: string) => {
    start(async () => {
      const res = await setClinicStatus(id, status === 'active' ? 'suspended' : 'active')
      if (res.ok) router.refresh()
      else setError(res.message)
    })
  }

  const setStatus = (id: string, status: 'active' | 'suspended') => {
    setError(null)
    start(async () => {
      const res = await setClinicStatus(id, status)
      if (res.ok) router.refresh()
      else setError(res.message)
    })
  }

  const resolveUpgrade = (id: string, decision: 'approve' | 'reject') => {
    setError(null)
    start(async () => {
      const res = await resolveUpgradeRequest(id, decision)
      if (res.ok) router.refresh()
      else setError(res.message)
    })
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-up px-6 py-8 space-y-6">
      {/* Platform Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
            JeevanCare Platform Management
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Multi-Tenant Healthcare Infrastructure · {tenants.length} Total Clinics</p>
        </div>
        <div className="flex items-center gap-2.5">
          <a href="/admin" className={btnGhost}>CMS Payload Admin</a>
          <button className={btnPrimary} onClick={() => setShowAdd((s) => !s)}>
            <IconPlus size={15} />
            New Clinic
          </button>
          <form action={logoutAction}>
            <button type="submit" title="Log out" className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-colors hover:border-red hover:text-red">
              <IconLogout size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* SuperAdmin KPI Metrics */}
      <DashboardWidgetError title="Platform Metrics">
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <MetricCard
            label="Active Clinics"
            value={activeClinics}
            icon={IconBuilding}
            subtext={`${tenants.length} total onboarded`}
          />
          <MetricCard
            label="Specialist Doctors"
            value={totalDoctors}
            icon={IconUsers}
            subtext="Across all tenants"
          />
          <MetricCard
            label="Registered Patients"
            value={totalPatients}
            icon={IconBuilding}
            subtext="Medical profiles"
          />
          <MetricCard
            label="Total Consultations"
            value={totalAppointments}
            icon={IconCalendar}
            subtext="Lifetime appointments"
          />
        </div>
      </DashboardWidgetError>

      {/* New Clinic Form Drawer/Modal */}
      {showAdd && (
        <Card className="overflow-hidden border-primary/30 shadow-md">
          <div className="border-b border-border/80 px-6 py-4 bg-secondary/20">
            <h2 className="font-display text-base font-semibold">Register New Clinic Tenant</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">The clinic tenant and owner user account are generated atomically.</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Field label="Clinic name"><input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Apollo Clinic Thrissur" /></Field>
            <Field label="Clinic phone"><input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98470 11111" /></Field>
            <Field label="City"><input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Thrissur" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <AppSelect
                  value={form.currency}
                  onChange={(v) => set('currency', v)}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              </Field>
              <Field label="Timezone">
                <AppSelect
                  value={form.timezone}
                  onChange={(v) => set('timezone', v)}
                  options={TIMEZONES.map((t) => ({ value: t, label: t }))}
                />
              </Field>
            </div>
            <Field label="Owner name"><input className={inputClass} value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Dr. Suresh Kumar" /></Field>
            <Field label="Owner email"><input className={inputClass} type="email" value={form.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} placeholder="suresh@clinic.com" /></Field>
            <PasswordField
              label="Temporary password"
              id="ownerPassword"
              name="ownerPassword"
              required
              autoComplete="new-password"
              value={form.ownerPassword}
              onChange={(e) => set('ownerPassword', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/80 bg-canvas/60 px-6 py-4">
            {error ? <p className="text-xs font-semibold text-red">{error}</p> : <span />}
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={btnPrimary} disabled={pending} onClick={create}>{pending && <Spinner />}{pending ? 'Creating…' : 'Create Clinic'}</button>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Self-Serve Signups */}
      {pendingSignups.length > 0 && (
        <Card className="overflow-hidden border-amber/30 bg-amber-soft/40">
          <div className="flex items-center justify-between border-b border-amber/20 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-amber">Pending Clinic Approvals</h2>
            <span className="text-xs font-semibold text-amber">{pendingSignups.length} awaiting review</span>
          </div>
          <ul className="divide-y divide-amber/15">
            {pendingSignups.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-6 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/20">
                  <IconBuilding size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{t.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.city || '—'} · Onboarded {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {t.ownerUnverified && (
                  <span
                    className="shrink-0 rounded-full border border-amber/30 bg-amber-soft px-2.5 py-0.5 text-[11px] font-semibold text-amber"
                    title="Approval unlocks once the owner confirms their email."
                  >
                    Email Unverified
                  </span>
                )}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="text-xs font-semibold text-muted-foreground transition-colors hover:text-red disabled:opacity-50"
                    disabled={pending}
                    onClick={() => setStatus(t.id, 'suspended')}
                  >
                    Reject
                  </button>
                  <button
                    className={`${btnPrimary} h-8 px-3 text-xs`}
                    disabled={pending || t.ownerUnverified}
                    onClick={() => setStatus(t.id, 'active')}
                  >
                    Approve Clinic
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Plan Upgrade Requests */}
      {upgradeRequests.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
            <h2 className="font-display text-base font-semibold">Plan Upgrade Requests</h2>
            <span className="text-xs text-muted-foreground">{upgradeRequests.length} pending decisions</span>
          </div>
          <ul className="divide-y divide-border/80">
            {upgradeRequests.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-6 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/20">
                  <IconBuilding size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">
                    {t.name}
                    <span className="ms-2 font-normal text-muted-foreground text-xs">
                      {planLabel(asPlan(t.plan))} &rarr; {planLabel(asPlan(t.upgradeRequest!.plan))}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.upgradeRequest!.requestedAt &&
                      new Date(t.upgradeRequest!.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {t.upgradeRequest!.note && ` · "${t.upgradeRequest!.note}"`}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="text-xs font-semibold text-muted-foreground transition-colors hover:text-red disabled:opacity-50"
                    disabled={pending}
                    onClick={() => resolveUpgrade(t.id, 'reject')}
                  >
                    Decline
                  </button>
                  <button
                    className={`${btnPrimary} h-8 px-3 text-xs`}
                    disabled={pending}
                    onClick={() => resolveUpgrade(t.id, 'approve')}
                  >
                    Approve Upgrade
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Main Tenants Data Table */}
      <DashboardWidgetError title="Clinic Directory">
        <Card className="overflow-hidden">
          <div className="border-b border-border/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Onboarded Clinic Directory</h2>
              <p className="text-xs text-muted-foreground">Multi-tenant clinic operational status and plan allocations</p>
            </div>
            <span className="text-xs font-semibold text-primary">{tenants.length} Total Clinics</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-secondary/30">
                  <Th>Clinic Name</Th>
                  <Th>Plan</Th>
                  <Th>Currency</Th>
                  <Th>Status</Th>
                  <Th className="text-end">Doctors</Th>
                  <Th className="text-end">Patients</Th>
                  <Th className="text-end">Appts</Th>
                  <Th className="text-end pe-6">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pageRows.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-secondary/20">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary ring-1 ring-primary/20">
                          <IconBuilding size={15} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-ink">{t.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{t.city || '—'}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground font-medium">{planLabel(asPlan(t.plan))}</Td>
                    <Td className="tabular text-muted-foreground font-medium">{t.currency}</Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        t.status === 'active' ? 'bg-primary-soft text-primary' : 'bg-amber-soft text-amber'
                      }`}>
                        <span className={`size-1.5 rounded-full ${t.status === 'active' ? 'bg-primary' : 'bg-amber'}`} />
                        {t.status}
                      </span>
                    </Td>
                    <Td className="tabular text-end font-medium">{t.doctors}</Td>
                    <Td className="tabular text-end font-medium">{t.patients}</Td>
                    <Td className="tabular text-end font-medium">{t.appointments}</Td>
                    <Td className="text-end pe-6">
                      <button
                        className={`text-xs font-semibold transition-colors ${
                          t.status === 'active' ? 'text-muted-foreground hover:text-red' : 'text-primary hover:underline'
                        }`}
                        disabled={pending}
                        onClick={() => (t.status === 'pending' ? setStatus(t.id, 'active') : toggle(t.id, t.status))}
                      >
                        {t.status === 'active' ? 'Suspend' : t.status === 'pending' ? 'Approve' : 'Reactivate'}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager page={page} totalPages={totalPages} onChange={setPage} />
        </Card>
      </DashboardWidgetError>

      {/* Audit Activity Stream */}
      {activity.length > 0 && (
        <DashboardWidgetError title="Platform Audit Trail">
          <Card className="overflow-hidden">
            <div className="border-b border-border/80 px-6 py-4">
              <h2 className="font-display text-base font-semibold">Platform Audit Stream</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Latest sensitive operational actions across all clinics</p>
            </div>
            <ul className="divide-y divide-border/60">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-6 py-3 hover:bg-secondary/10 transition-colors">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{a.summary}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.clinic} · {a.who}</span>
                  </span>
                  <span className="tabular shrink-0 text-xs text-muted-foreground font-medium">
                    {new Date(a.when).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </DashboardWidgetError>
      )}
    </div>
  )
}

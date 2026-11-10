import Link from 'next/link'
import { requireDashboardSession, getPayloadClient } from '@/lib/auth'
import { getTenantID } from '@/access'
import { Card, StatusBadge, Th, Td, Avatar } from '@/components/primitives'
import { formatMoney, formatDateTime } from '@/lib/format'
import { IconReceipt, IconPrinter, IconChevronRight } from '@/components/icons'
import type { Invoice, Patient } from '@/payload-types'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const { user, tenant } = await requireDashboardSession()
  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)!

  const res = await payload.find({
    collection: 'invoices',
    where: { tenant: { equals: tenantID } },
    sort: '-createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
    select: {
      id: true,
      invoiceNumber: true,
      patient: true,
      createdAt: true,
      totalAmount: true,
      amountPaid: true,
      balanceDue: true,
      status: true,
      currency: true,
    },
  })

  const invoices = res.docs as Invoice[]
  const moneyCtx = { settings: { currency: tenant?.settings?.currency || 'INR' } }
  const m = (n?: number | null) => formatMoney(n ?? 0, moneyCtx)

  const totalCollected = invoices.reduce((s, inv) => s + (inv.amountPaid ?? 0), 0)
  const totalPending = invoices.reduce((s, inv) => s + (inv.balanceDue ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Invoices &amp; Billing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage patient invoices, payment receipts, and balance collections for {tenant?.name ?? 'Clinic'}
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 bg-card border-border/80 shadow-2xs">
          <span className="text-xs font-bold uppercase text-muted-foreground">Total Invoices</span>
          <div className="mt-1 text-2xl font-extrabold font-display text-ink">{invoices.length}</div>
        </Card>
        <Card className="p-4 bg-card border-border/80 shadow-2xs">
          <span className="text-xs font-bold uppercase text-muted-foreground">Total Collected</span>
          <div className="mt-1 text-2xl font-extrabold font-display text-green-strong">{m(totalCollected)}</div>
        </Card>
        <Card className="p-4 bg-card border-border/80 shadow-2xs">
          <span className="text-xs font-bold uppercase text-muted-foreground">Pending Balance Due</span>
          <div className="mt-1 text-2xl font-extrabold font-display text-primary">{m(totalPending)}</div>
        </Card>
      </div>

      {/* Invoices List Table */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-3">
              <IconReceipt size={22} />
            </span>
            <h3 className="font-bold text-ink text-base">No Invoices Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Invoices are automatically generated when receptionists check in patients or when doctors complete consultations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-xs uppercase font-bold text-muted-foreground">
                  <Th>Invoice #</Th>
                  <Th>Patient</Th>
                  <Th>Date &amp; Time</Th>
                  <Th className="text-end">Total</Th>
                  <Th className="text-end">Paid</Th>
                  <Th className="text-end">Balance</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-end">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => {
                  const patient = inv.patient as Patient
                  return (
                    <tr key={inv.id} className="hover:bg-canvas/50 transition-colors">
                      <Td className="font-bold text-primary font-mono text-xs">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={patient?.name ?? 'Patient'} size="sm" />
                          <div className="min-w-0">
                            <span className="font-bold text-ink truncate block">{patient?.name ?? 'Patient'}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{patient?.mrn ?? ''}</span>
                          </div>
                        </div>
                      </Td>
                      <Td className="tabular text-xs text-muted-foreground">
                        {formatDateTime(inv.createdAt, moneyCtx)}
                      </Td>
                      <Td className="tabular text-end font-semibold">{m(inv.totalAmount)}</Td>
                      <Td className="tabular text-end text-green-strong font-medium">{m(inv.amountPaid)}</Td>
                      <Td className="tabular text-end font-bold text-ink">{m(inv.balanceDue)}</Td>
                      <Td className="text-center">
                        <StatusBadge status={inv.voided ? 'voided' : (inv.paymentStatus ?? 'unpaid')} />
                      </Td>
                      <Td className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/print/receipt/${inv.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                            title="Print Receipt"
                          >
                            <IconPrinter size={15} />
                          </Link>
                          <Link
                            href={`/dashboard/invoices/${inv.id}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-ink hover:bg-secondary transition-colors"
                            title="View Invoice Details"
                          >
                            <IconChevronRight size={15} />
                          </Link>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

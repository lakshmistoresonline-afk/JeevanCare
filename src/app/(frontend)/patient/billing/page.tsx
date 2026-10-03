import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { Card, StatusBadge } from '@/components/primitives'
import { formatDateTime, formatMoney } from '@/lib/format'

export default async function PatientBillingPage() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const res = await payload.find({
    collection: 'invoices',
    where: {
      tenant: { equals: tenant.id },
      patient: { equals: patient.id },
    },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const invoices = res.docs

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Billing & Invoices</h1>
        <p className="text-sm text-muted-foreground">View your invoice history and payment status (read-only).</p>
      </div>

      <Card className="overflow-hidden">
        {invoices.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No invoices available.</p>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv: any) => (
              <li key={inv.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div>
                  <div className="tabular font-medium">{inv.invoiceNumber}</div>
                  <div className="tabular text-xs text-muted-foreground">
                    Total: {formatMoney(inv.totalAmount ?? 0, { settings: { currency: inv.currency } })} · Paid: {formatMoney(inv.amountPaid ?? 0, { settings: { currency: inv.currency } })} · Balance: {formatMoney(inv.balanceDue ?? 0, { settings: { currency: inv.currency } })}
                  </div>
                  <div className="tabular text-[11px] text-faint">{formatDateTime(inv.createdAt, tenant)}</div>
                </div>
                <StatusBadge status={inv.voided ? 'voided' : (inv.paymentStatus ?? 'unpaid')} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

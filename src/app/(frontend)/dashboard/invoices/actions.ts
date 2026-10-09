'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { relId } from '@/lib/utils'
import type { Invoice, User, Visit } from '@/payload-types'

async function ctx() {
  const user = await getCurrentUser()
  if (!user || user.role === 'superAdmin') return null
  const payload = await getPayloadClient()
  return { user, payload }
}

/** Create an invoice pre-filled from a visit (consultation line = doctor's fee). */
export async function createInvoiceFromVisit(visitId: string): Promise<ActionResult<{ id: string }>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  const { user, payload } = c
  try {
    const visit = (await payload.findByID({ collection: 'visits', id: visitId, depth: 1, overrideAccess: false, user })) as Visit
    const doctor = visit.doctor as User
    const fee = typeof doctor?.consultationFee === 'number' ? doctor.consultationFee : 0
    const invoice = await payload.create({
      collection: 'invoices',
      user,
      overrideAccess: false,
      data: {
        visit: visitId,
        patient: relId(visit.patient),
        lineItems: [{ description: `Consultation — ${doctor?.name ?? 'Doctor'}`, quantity: 1, unitAmount: fee }],
      } as never,
    })
    revalidatePath('/dashboard')
    return { ok: true, data: { id: String(invoice.id) } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export type LineItemInput = { description: string; quantity: number; unitAmount: number }

/** Create a standalone invoice (e.g. a charge with no visit). */
export async function createInvoice(input: {
  patientId: string
  visitId?: string
  lineItems: LineItemInput[]
}): Promise<ActionResult<{ id: string }>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  const { user, payload } = c
  if (!input.patientId || !input.lineItems?.length) {
    return { ok: false, code: 'VALIDATION', message: 'A patient and at least one line item are required.' }
  }
  try {
    const invoice = await payload.create({
      collection: 'invoices',
      user,
      overrideAccess: false,
      data: { patient: input.patientId, visit: input.visitId, lineItems: input.lineItems } as never,
    })
    return { ok: true, data: { id: String(invoice.id) } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

/** Record a payment against an invoice using atomic $push to prevent lost updates.
 *  The beforeChange hook recalculates derived amounts from the full payments array. */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: string,
): Promise<ActionResult<{ id: string }>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  const { user, payload } = c
  if (!(amount > 0)) return { ok: false, code: 'VALIDATION', message: 'Enter an amount greater than zero.' }

  // Validate method is supported
  const validMethods = ['cash', 'upi', 'card', 'bank_transfer', 'cheque']
  if (!validMethods.includes(method)) {
    return { ok: false, code: 'VALIDATION', message: 'Unsupported payment method.' }
  }

  try {
    const inv = (await payload.findByID({ collection: 'invoices', id: invoiceId, depth: 0, overrideAccess: false, user })) as Invoice

    // Reject payments on voided invoices
    if (inv.voided) {
      return { ok: false, code: 'INVOICE_VOIDED', message: "This invoice has been voided and can't receive payments." }
    }

    // Check for overpayment before attempting the atomic push
    const currentPaid = Number(inv.amountPaid ?? 0)
    const total = Number(inv.totalAmount ?? 0)
    if (currentPaid + amount > total + 1e-9) {
      return { ok: false, code: 'PAYMENT_EXCEEDS_BALANCE', message: `Payment exceeds the remaining balance (${total - currentPaid}).` }
    }

    // Use MongoDB atomic $push to append the payment — concurrent submissions
    // can no longer lose updates by reading stale arrays.
    const model = (payload.db as any).collections?.invoices
    if (model) {
      const native = model.collection
      const paymentEntry = {
        amount,
        method,
        receivedAt: new Date().toISOString(),
        receivedBy: relId(user.id) ? user.id : String(user.id),
      }
      await native.updateOne(
        { _id: (inv as any)._id ?? inv.id },
        { $push: { payments: paymentEntry } },
      )

      // Now trigger the beforeChange hook to recompute derived fields by
      // performing a no-op update through Payload.
      await payload.update({
        collection: 'invoices',
        id: invoiceId,
        user,
        overrideAccess: false,
        data: { payments: undefined } as never,
      })
    } else {
      // Fallback: read-append-write (non-atomic, but correct for single-instance)
      const existing = (inv.payments ?? []).map((p) => ({
        amount: p.amount,
        method: p.method,
        receivedAt: p.receivedAt,
        receivedBy: p.receivedBy ? relId(p.receivedBy) : undefined,
      }))
      await payload.update({
        collection: 'invoices',
        id: invoiceId,
        user,
        overrideAccess: false,
        data: { payments: [...existing, { amount, method, receivedAt: new Date().toISOString() }] } as never,
      })
    }

    revalidatePath(`/dashboard/invoices/${invoiceId}`)
    revalidatePath('/dashboard')
    return { ok: true, data: { id: invoiceId } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

/** Void an invoice (owner only). Excluded from revenue; frozen afterwards. */
export async function voidInvoice(invoiceId: string, reason: string): Promise<ActionResult<{ id: string }>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  const { user, payload } = c
  if (user.role !== 'owner') return { ok: false, code: 'FORBIDDEN', message: 'Only the clinic owner can void an invoice.' }
  if (!reason.trim()) return { ok: false, code: 'VALIDATION', message: 'A reason is required to void an invoice.' }
  try {
    await payload.update({
      collection: 'invoices',
      id: invoiceId,
      user,
      overrideAccess: false,
      data: { voided: true, voidReason: reason.trim() } as never,
    })
    revalidatePath(`/dashboard/invoices/${invoiceId}`)
    revalidatePath('/dashboard')
    return { ok: true, data: { id: invoiceId } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

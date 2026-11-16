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
  const user = await getCurrentUser()
  if (!user) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  const payload = await getPayloadClient()
  if (!(amount > 0)) return { ok: false, code: 'VALIDATION', message: 'Enter an amount greater than zero.' }

  const validMethods = ['cash', 'upi', 'card', 'bank_transfer', 'cheque']
  if (!validMethods.includes(method)) {
    return { ok: false, code: 'VALIDATION', message: 'Unsupported payment method.' }
  }

  try {
    const inv = (await payload.findByID({ collection: 'invoices', id: invoiceId, depth: 0, overrideAccess: true })) as Invoice

    if (inv.voided) {
      return { ok: false, code: 'INVOICE_VOIDED', message: "This invoice has been voided and can't receive payments." }
    }

    const currentPaid = Number(inv.amountPaid ?? 0)
    const total = Number(inv.totalAmount ?? 0)
    if (currentPaid + amount > total + 1e-9) {
      return { ok: false, code: 'PAYMENT_EXCEEDS_BALANCE', message: `Payment exceeds the remaining balance (${total - currentPaid}).` }
    }

    const currentPayments = (inv.payments ?? []).map((p: any) => ({
      amount: Number(p.amount ?? 0),
      method: String(p.method || 'cash'),
      receivedAt: p.receivedAt ? new Date(p.receivedAt).toISOString() : new Date().toISOString(),
      receivedBy: relId(p.receivedBy) || user.id,
    }))

    const newPayment = {
      amount,
      method,
      receivedAt: new Date().toISOString(),
      receivedBy: user.id,
    }

    const updatedPayments = [...currentPayments, newPayment]

    await payload.update({
      collection: 'invoices',
      id: invoiceId,
      overrideAccess: true,
      data: {
        payments: updatedPayments,
      } as never,
    })

    revalidatePath(`/dashboard/invoices/${invoiceId}`)
    revalidatePath('/dashboard/invoices')
    revalidatePath('/dashboard/appointments')
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

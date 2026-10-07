import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { recordPayment, voidInvoice, createInvoice } from '@/app/(frontend)/dashboard/invoices/actions'
import { relId } from '@/lib/utils'

describe('Billing & Payment Integrity Hardening Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  // =========================================================================
  // 1. SERVER DERIVATION OF FINANCIAL TOTALS & STATUS
  // =========================================================================

  it('calculates totalAmount, amountPaid, balanceDue, and paymentStatus on server side', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        lineItems: [
          { description: 'Consultation Fee', quantity: 1, unitAmount: 500 },
          { description: 'Lab Tests', quantity: 2, unitAmount: 250 },
        ],
        // Fraudulent client totals attempt (must be ignored)
        totalAmount: 10,
        balanceDue: 0,
        paymentStatus: 'paid',
      } as any,
    })

    expect(invoice.totalAmount).toBe(1000) // (1*500) + (2*250)
    expect(invoice.amountPaid).toBe(0)
    expect(invoice.balanceDue).toBe(1000)
    expect(invoice.paymentStatus).toBe('unpaid')
    expect(invoice.currency).toBe('INR')
  })

  // =========================================================================
  // 2. OVERPAYMENT PREVENTION
  // =========================================================================

  it('rejects payments exceeding the remaining invoice balance', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        lineItems: [{ description: 'Consultation', quantity: 1, unitAmount: 300 }],
      } as any,
    })

    // Attempt payment of 500 on a 300 balance
    const overpayAttempt = payload.update({
      collection: 'invoices',
      id: invoice.id,
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        payments: [{ amount: 500, method: 'cash' }],
      } as any,
    })

    await expect(overpayAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 3. VOIDED INVOICE IMMUTABILITY & PAYMENTS BLOCK
  // =========================================================================

  it('freezes voided invoices and blocks subsequent payment attempts', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        lineItems: [{ description: 'Consultation', quantity: 1, unitAmount: 400 }],
      } as any,
    })

    // Owner voids invoice
    await payload.update({
      collection: 'invoices',
      id: invoice.id,
      user: f.a.owner,
      overrideAccess: false,
      data: { voided: true, voidReason: 'Billed in error' } as any,
    })

    // Attempt recording payment against voided invoice
    const payAttempt = payload.update({
      collection: 'invoices',
      id: invoice.id,
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        payments: [{ amount: 400, method: 'upi' }],
      } as any,
    })

    await expect(payAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 4. LOCK LINE ITEMS AFTER PAYMENT
  // =========================================================================

  it('locks line items from editing after a payment has been recorded', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        lineItems: [{ description: 'Consultation', quantity: 1, unitAmount: 600 }],
        payments: [{ amount: 200, method: 'cash' }],
      } as any,
    })

    // Attempt modifying line items after partial payment
    const editAttempt = payload.update({
      collection: 'invoices',
      id: invoice.id,
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        lineItems: [{ description: 'Tampered Fee', quantity: 1, unitAmount: 1000 }],
      } as any,
    })

    await expect(editAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 5. UNAUTHORIZED VOIDING PREVENTION
  // =========================================================================

  it('denies non-owner roles from voiding invoices', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        lineItems: [{ description: 'Consultation', quantity: 1, unitAmount: 350 }],
      } as any,
    })

    // Receptionist attempts to void
    const voidAttempt = payload.update({
      collection: 'invoices',
      id: invoice.id,
      user: f.a.receptionist,
      overrideAccess: false,
      data: { voided: true, voidReason: 'Unauthorized void' } as any,
    })

    await expect(voidAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 6. CROSS-TENANT RELATIONSHIP ISOLATION
  // =========================================================================

  it('rejects creating an invoice for a patient belonging to another clinic', async () => {
    const attempt = payload.create({
      collection: 'invoices',
      user: f.a.receptionist,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.b.patient.id, // Patient from Clinic B
        lineItems: [{ description: 'Cross tenant attempt', quantity: 1, unitAmount: 500 }],
      } as any,
    })

    await expect(attempt).rejects.toBeTruthy()
  })
})

'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { relId } from '@/lib/utils'
import type { User } from '@/payload-types'

export type PrescriptionRowInput = {
  medicine: string
  dosage?: string
  frequency?: string
  frequencyNote?: string
  durationDays?: number
  instructions?: string
}

export type VisitInput = {
  appointmentId: string
  symptoms?: string
  diagnosis?: string
  notes?: string
  vitals?: {
    bpSystolic?: number
    bpDiastolic?: number
    temperatureC?: number
    weightKg?: number
    pulse?: number
  }
  prescription?: PrescriptionRowInput[]
  followUpDate?: string
}

/** Record a consultation against an appointment. */
export async function recordVisit(input: VisitInput): Promise<ActionResult<{ id: string; invoiceId?: string }>> {
  const user = await getCurrentUser()
  if (!user || user.role === 'superAdmin' || user.role === 'receptionist' || (user.role as string) === 'patient') {
    return { ok: false, code: 'FORBIDDEN', message: "Only attending doctors and clinic owners can record visits." }
  }
  const payload = await getPayloadClient()

  // Drop blank vitals and empty prescription rows
  const vitals = input.vitals
    ? Object.fromEntries(Object.entries(input.vitals).filter(([, v]) => v != null && !Number.isNaN(v)))
    : undefined
  const prescription = (input.prescription ?? [])
    .filter((p) => p.medicine?.trim())
    .map((p) => ({
      medicine: p.medicine.trim(),
      dosage: p.dosage?.trim() || undefined,
      frequency: p.frequency || undefined,
      frequencyNote: p.frequencyNote?.trim() || undefined,
      durationDays: p.durationDays ?? undefined,
      instructions: p.instructions?.trim() || undefined,
    }))

  try {
    const appt = (await payload.findByID({
      collection: 'appointments',
      id: input.appointmentId,
      depth: 0,
      overrideAccess: true,
    })) as any

    if (!appt) {
      return { ok: false, code: 'NOT_FOUND', message: 'Appointment record not found.' }
    }

    const apptTenantID = relId(appt.tenant)
    const patientID = relId(appt.patient)
    const doctorID = relId(appt.doctor) || user.id

    // Check if visit record already exists for this appointment
    const existingVisits = await payload.find({
      collection: 'visits',
      where: { appointment: { equals: input.appointmentId } },
      limit: 1,
      overrideAccess: true,
    })

    let visit: any
    if (existingVisits.docs.length > 0) {
      const existingDoc = existingVisits.docs[0] as any
      const isCompletedVisit = Boolean(existingDoc.diagnosis || (existingDoc.prescription && existingDoc.prescription.length > 0))
      if (isCompletedVisit) {
        return { ok: false, code: 'FORBIDDEN', message: 'A visit record has already been recorded for this appointment.' }
      }
      visit = await payload.update({
        collection: 'visits',
        id: existingDoc.id,
        overrideAccess: true,
        data: {
          symptoms: input.symptoms || undefined,
          diagnosis: input.diagnosis || undefined,
          notes: input.notes || undefined,
          vitals: vitals && Object.keys(vitals).length ? vitals : undefined,
          prescription,
          followUpDate: input.followUpDate || undefined,
        } as never,
      })
    } else {
      visit = await payload.create({
        collection: 'visits',
        overrideAccess: true,
        data: {
          tenant: apptTenantID,
          appointment: input.appointmentId,
          patient: patientID,
          doctor: doctorID,
          symptoms: input.symptoms || undefined,
          diagnosis: input.diagnosis || undefined,
          notes: input.notes || undefined,
          vitals: vitals && Object.keys(vitals).length ? vitals : undefined,
          prescription,
          followUpDate: input.followUpDate || undefined,
        } as never,
      })
    }

    // Transition appointment status to 'post-consultation' (Pharmacy / Checkout stage)
    await payload.update({
      collection: 'appointments',
      id: input.appointmentId,
      overrideAccess: true,
      data: { status: 'post-consultation' } as never,
    }).catch(() => {})

    let finalInvoiceId: string | undefined = undefined

    const existingInvoices = await payload.find({
      collection: 'invoices',
      where: { tenant: { equals: apptTenantID }, patient: { equals: patientID } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    })

    if (existingInvoices.docs.length > 0) {
      finalInvoiceId = String(existingInvoices.docs[0].id)
      if (!existingInvoices.docs[0].visit) {
        await payload.update({
          collection: 'invoices',
          id: existingInvoices.docs[0].id,
          overrideAccess: true,
          data: { visit: String(visit.id) } as never,
        }).catch(() => {})
      }
    } else {
      // Auto-create unpaid invoice for the visit if patient did not pay at reception
      const doctor = doctorID ? (await payload.findByID({ collection: 'users', id: doctorID, depth: 0, overrideAccess: true }).catch(() => null)) as User : null
      const fee = typeof doctor?.consultationFee === 'number' && doctor.consultationFee > 0 ? doctor.consultationFee : 800

      const newInv = await payload.create({
        collection: 'invoices',
        overrideAccess: true,
        data: {
          tenant: apptTenantID,
          patient: patientID,
          visit: String(visit.id),
          lineItems: [
            {
              description: `Consultation — ${doctor?.name ?? 'Doctor'}`,
              quantity: 1,
              unitAmount: fee,
              amount: fee,
            },
          ],
          totalAmount: fee,
          amountPaid: 0,
          balanceDue: fee,
          paymentStatus: 'unpaid',
          voided: false,
        } as never,
      }).catch(() => null)

      if (newInv) finalInvoiceId = String(newInv.id)
    }

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard/invoices')
    revalidatePath('/dashboard')

    return { ok: true, data: { id: String(visit.id), invoiceId: finalInvoiceId } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

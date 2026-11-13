'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { wallTimeToUTC } from '@/lib/reports'
import { computeEnd, findConflict } from '@/lib/booking'
import { checkAvailability, formatWindow, windowOf, type AvailabilityTag } from '@/lib/availability'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import { relId } from '@/lib/utils'
import type { User, Appointment } from '@/payload-types'
import {
  resolveActorTenantInternal,
  internalBookAppointment,
  internalGetAvailableSlots,
} from '@/lib/bookingInternal'

export type DoctorAvailabilityHit = {
  id: string
  name: string
  tag: AvailabilityTag
  note: string
  free: boolean
}

export async function availableDoctorsAt(
  date: string,
  time: string,
  durationMins: number,
): Promise<DoctorAvailabilityHit[]> {
  const ctx = await resolveActorTenantInternal()
  if (!ctx || !date || !time) return []
  const { payload, tenantID, tenant } = ctx
  const tz = tenant?.settings?.timezone || DEFAULT_TIMEZONE
  const start = wallTimeToUTC(tz, date, time)
  const end = computeEnd(start, durationMins || tenant?.settings?.appointmentDurationMins || 15)

  const docs = await payload.find({
    collection: 'users',
    where: { tenant: { equals: tenantID }, role: { equals: 'doctor' }, active: { equals: true } },
    limit: 50,
    sort: 'name',
    overrideAccess: true,
  })

  const hits: DoctorAvailabilityHit[] = []
  for (const d of docs.docs as User[]) {
    const a = checkAvailability(d, start, end, tz)
    if (!a.inFinder) continue
    let free = a.bookable
    if (free) {
      const clash = await findConflict({
        payload,
        tenantID,
        doctorID: String(d.id),
        start,
        end,
      })
      if (clash) free = false
    }
    hits.push({
      id: String(d.id),
      name: d.name,
      tag: a.tag,
      note: a.tag === 'onCall' ? 'On call' : a.reason || formatWindow(windowOf(d)),
      free,
    })
  }
  return hits
}

/** Exported Server Action — ALWAYS derives identity strictly from server request session */
export async function bookAppointment(
  formData: FormData,
): Promise<ActionResult<{ id: string; token?: string }>> {
  const result = await internalBookAppointment(formData)
  if (result.ok) {
    try { revalidatePath('/dashboard/appointments') } catch {}
  }
  return result
}

export async function updateAppointmentStatus(
  id: string,
  status: string,
  cancellationReason?: string,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await resolveActorTenantInternal()
  if (!ctx || (ctx as any).isPatient) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  const { user, payload, tenantID } = ctx

  try {
    const existingAppt = (await payload.findByID({
      collection: 'appointments',
      id,
      depth: 0,
      overrideAccess: true,
    })) as any

    if (!existingAppt || String(relId(existingAppt.tenant)) !== String(tenantID)) {
      return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to update this appointment." }
    }

    await payload.update({
      collection: 'appointments',
      id,
      overrideAccess: true,
      data: { status, ...(cancellationReason ? { cancellationReason } : {}) } as never,
    })
    try { revalidatePath('/dashboard/appointments') } catch {}
    try { revalidatePath('/dashboard') } catch {}
    return { ok: true, data: { id } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export async function recordPatientVitals(
  appointmentId: string,
  vitals: {
    bpSystolic?: number
    bpDiastolic?: number
    temperatureC?: number
    weightKg?: number
    pulse?: number
  },
): Promise<ActionResult<{ ok: boolean }>> {
  const ctx = await resolveActorTenantInternal()
  if (!ctx || (ctx as any).isPatient) {
    return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to record vitals." }
  }
  const { user, payload, tenantID } = ctx

  try {
    const appt = (await payload.findByID({
      collection: 'appointments',
      id: appointmentId,
      depth: 0,
      overrideAccess: true,
    })) as any

    const apptTenantID = relId(appt?.tenant) || tenantID
    const patientID = relId(appt?.patient)
    const doctorID = relId(appt?.doctor)

    const existingVisits = await payload.find({
      collection: 'visits',
      where: { appointment: { equals: appointmentId } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingVisits.docs.length > 0) {
      await payload.update({
        collection: 'visits',
        id: existingVisits.docs[0].id,
        overrideAccess: true,
        data: { vitals } as never,
      })
    } else {
      await payload.create({
        collection: 'visits',
        overrideAccess: true,
        data: {
          tenant: apptTenantID,
          appointment: appointmentId,
          patient: patientID,
          doctor: doctorID,
          visitDate: new Date().toISOString(),
          vitals,
        } as never,
      })
    }

    try { revalidatePath('/dashboard/appointments') } catch {}
    try { revalidatePath('/dashboard') } catch {}
    return { ok: true, data: { ok: true } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export async function checkInAndCollectPayment(input: {
  appointmentId: string
  amount: number
  paymentMethod: string
}): Promise<ActionResult<{ id: string; invoiceId?: string; token?: string }>> {
  const ctx = await resolveActorTenantInternal()
  if (!ctx || (ctx as any).isPatient) {
    return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to check in patients." }
  }
  const { user, payload, tenantID } = ctx

  try {
    const appt = (await payload.update({
      collection: 'appointments',
      id: input.appointmentId,
      overrideAccess: true,
      data: { status: 'checked-in' } as never,
    })) as Appointment

    const apptTenantID = relId(appt.tenant) || tenantID
    const doctorID = relId(appt.doctor)
    const doctor = doctorID ? (await payload.findByID({ collection: 'users', id: doctorID, depth: 0, overrideAccess: true })) as User : null
    const fee = input.amount > 0 ? input.amount : (typeof doctor?.consultationFee === 'number' && doctor.consultationFee > 0 ? doctor.consultationFee : 800)

    let invoiceId: string | undefined = undefined
    if (fee > 0 && apptTenantID) {
      const inv = await payload.create({
        collection: 'invoices',
        overrideAccess: true,
        data: {
          tenant: apptTenantID,
          patient: relId(appt.patient),
          lineItems: [
            {
              description: `Consultation — ${doctor?.name ?? 'Doctor'}`,
              quantity: 1,
              unitAmount: fee,
              amount: fee,
            },
          ],
          totalAmount: fee,
          amountPaid: fee,
          balanceDue: 0,
          paymentStatus: 'paid',
          payments: [
            {
              amount: fee,
              method: input.paymentMethod || 'cash',
              receivedAt: new Date().toISOString(),
              receivedBy: user.id,
            },
          ],
          voided: false,
        } as never,
      })
      invoiceId = String(inv.id)
    }

    try { revalidatePath('/dashboard/appointments') } catch {}
    try { revalidatePath('/dashboard/invoices') } catch {}
    try { revalidatePath('/dashboard') } catch {}

    return {
      ok: true,
      data: {
        id: String(appt.id),
        invoiceId,
        token: (appt as { tokenNumber?: string }).tokenNumber,
      },
    }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await resolveActorTenantInternal()
  if (!ctx || (ctx as any).isPatient) {
    return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to reschedule appointments." }
  }
  const { user, payload, tenant } = ctx

  try {
    const tz = tenant?.settings?.timezone || DEFAULT_TIMEZONE
    const startUTC = wallTimeToUTC(tz, newDate, newTime)

    await payload.update({
      collection: 'appointments',
      id: appointmentId,
      user,
      overrideAccess: true,
      data: {
        start: startUTC.toISOString(),
        status: 'scheduled',
      } as never,
    })

    try { revalidatePath('/dashboard/appointments') } catch {}
    try { revalidatePath('/dashboard') } catch {}
    return { ok: true, data: { id: appointmentId } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

/** Exported Server Action — ALWAYS derives caller identity strictly from server request session */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
): Promise<{ ok: boolean; slots?: string[]; message?: string }> {
  return internalGetAvailableSlots(doctorId, date)
}

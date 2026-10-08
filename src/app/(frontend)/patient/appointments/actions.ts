'use server'

import { revalidatePath } from 'next/cache'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { wallTimeToUTC } from '@/lib/reports'
import { computeEnd, findConflict } from '@/lib/booking'
import { checkAvailability, windowsOf } from '@/lib/availability'
import { relId } from '@/lib/utils'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import type { User } from '@/payload-types'

export async function getPatientAvailableSlots(
  doctorId: string,
  date: string,
): Promise<{ ok: boolean; slots?: string[]; message?: string }> {
  if (!doctorId || !date) return { ok: false, message: 'Doctor and date are required.' }

  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const doctor = (await payload.findByID({ collection: 'users', id: doctorId, depth: 0, overrideAccess: true }).catch(() => null)) as User | null
  if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
    return { ok: false, message: 'Doctor is inactive or not found.' }
  }

  // Tenant isolation: doctor must belong to the patient's tenant
  const docTenantID = relId(doctor.tenant) || ''
  if (docTenantID !== String(tenant.id)) {
    return { ok: false, message: 'Doctor not found.' }
  }

  const tz = tenant.settings?.timezone || DEFAULT_TIMEZONE
  const durationMins = tenant.settings?.appointmentDurationMins || 15
  const wins = windowsOf(doctor)
  const now = new Date()
  const slots: string[] = []

  for (const win of wins) {
    const [fromH, fromM] = win.from.split(':').map(Number)
    const [toH, toM] = win.to.split(':').map(Number)
    let currentMinutes = fromH * 60 + fromM
    const endMinutes = toH * 60 + toM

    while (currentMinutes + durationMins <= endMinutes) {
      const h = Math.floor(currentMinutes / 60)
      const m = currentMinutes % 60
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const start = wallTimeToUTC(tz, date, timeStr)
      const end = computeEnd(start, durationMins)

      if (start > now) {
        const avail = checkAvailability(doctor, start, end, tz)
        if (avail.bookable) {
          const conflict = await findConflict({ payload, tenantID: docTenantID, doctorID: String(doctorId), start, end })
          if (!conflict) {
            const displayTime = start.toLocaleTimeString('en-IN', {
              hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz,
            }).toLowerCase()
            slots.push(displayTime)
          }
        }
      }
      currentMinutes += durationMins
    }
  }
  return { ok: true, slots }
}

export async function patientBookAppointment(
  doctorId: string,
  date: string,
  time: string,
  reason: string,
): Promise<ActionResult<{ id: string }>> {
  const { patient, tenant, user } = await requirePatientSession()
  const payload = await getPayloadClient()

  if (!doctorId || !date || !time) {
    return { ok: false, code: 'VALIDATION', message: 'Doctor, date and time are required.' }
  }

  // Resolve doctor and validate tenant isolation
  const doctor = (await payload.findByID({ collection: 'users', id: doctorId, depth: 0, overrideAccess: true }).catch(() => null)) as User | null
  if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
    return { ok: false, code: 'VALIDATION', message: 'Selected doctor is inactive or not found.' }
  }
  const docTenantID = relId(doctor.tenant) || ''
  if (docTenantID !== String(tenant.id)) {
    return { ok: false, code: 'FORBIDDEN', message: 'Doctor not found.' }
  }

  const tz = tenant.settings?.timezone || DEFAULT_TIMEZONE
  const durationMins = tenant.settings?.appointmentDurationMins || 15
  const start = wallTimeToUTC(tz, date, time)
  const end = computeEnd(start, durationMins)

  if (start < new Date()) {
    return { ok: false, code: 'VALIDATION', message: 'Cannot book appointments in the past.' }
  }

  const avail = checkAvailability(doctor, start, end, tz)
  if (!avail.bookable) {
    return { ok: false, code: 'VALIDATION', message: `${doctor.name} can't be booked then — ${avail.reason}.` }
  }

  const conflict = await findConflict({ payload, tenantID: docTenantID, doctorID: doctorId, start, end })
  if (conflict) {
    return { ok: false, code: 'SLOT_TAKEN', message: 'This appointment slot is no longer available. Please select another time.' }
  }

  try {
    const appt = await payload.create({
      collection: 'appointments',
      user,
      overrideAccess: true,
      data: {
        tenant: String(tenant.id),
        patient: String(patient.id),
        doctor: doctorId,
        start: start.toISOString(),
        durationMins,
        reason: reason || undefined,
        isWalkIn: false,
        status: 'scheduled',
      } as never,
    })
    try { revalidatePath('/patient/appointments') } catch {}
    try { revalidatePath('/patient/dashboard') } catch {}
    return { ok: true, data: { id: String(appt.id) } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

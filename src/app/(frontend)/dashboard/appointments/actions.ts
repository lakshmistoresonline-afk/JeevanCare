'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { wallTimeToUTC } from '@/lib/reports'
import { computeEnd, findConflict } from '@/lib/booking'
import { checkAvailability, formatWindow, windowOf, type AvailabilityTag } from '@/lib/availability'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import type { User } from '@/payload-types'
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
  const { user, payload } = ctx

  try {
    await payload.update({
      collection: 'appointments',
      id,
      user,
      overrideAccess: false,
      data: { status, ...(cancellationReason ? { cancellationReason } : {}) } as never,
    })
    try { revalidatePath('/dashboard/appointments') } catch {}
    try { revalidatePath('/dashboard') } catch {}
    return { ok: true, data: { id } }
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
